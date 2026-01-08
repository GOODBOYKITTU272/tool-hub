import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// User type from public.users table
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'Admin' | 'Owner' | 'Observer';
    must_change_password: boolean;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    currentUser: User | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordReset?: boolean; mfaRequired?: boolean }>;
    verifyMfa: (code: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    isMfaEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [isMfaEnabled, setIsMfaEnabled] = useState(false);
    const authUpdateSeqRef = useRef(0);
    const inFlightProfileRef = useRef<Promise<User | null> | null>(null);
    const inFlightProfileUserIdRef = useRef<string | null>(null);

    const PROFILE_CACHE_PREFIX = 'tool-hub-profile:';

    // Helper to normalize email (lowercase)
    const normalizeEmail = (email: string) => email.toLowerCase().trim();

    // Helper to validate ApplyWizz email domain
    const validateEmailDomain = (email: string): { valid: boolean; error?: string } => {
        const normalizedEmail = normalizeEmail(email);
        const domain = normalizedEmail.split('@')[1];

        if (domain !== 'applywizz.com') {
            return {
                valid: false,
                error: 'Access restricted: Only @applywizz.com email addresses are allowed. Please use your ApplyWizz company email.'
            };
        }

        return { valid: true };
    };

    // Helper to add timeout to promises
    const withTimeout = async <T,>(promise: Promise<T> | any, timeoutMs: number, errorMsg: string): Promise<T> => {
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
        });

        try {
            // Ensure we are racing a real promise
            return await Promise.race([Promise.resolve(promise), timeoutPromise]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    };

    // Helper to retry failed requests (for cold starts)
    const withRetry = async <T,>(fn: () => Promise<T>, retries = 1): Promise<T> => {
        for (let i = 0; i <= retries; i++) {
            try {
                return await fn();
            } catch (error: any) {
                const isTimeout = error.message?.includes('timed out');
                const shouldRetry = isTimeout && i < retries;

                if (shouldRetry) {
                    console.log(`🔄 Retry ${i + 1}/${retries} after timeout...`);
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Max retries exceeded');
    };

    const readCachedProfile = (authUserId: string): User | null => {
        try {
            if (typeof window === 'undefined') return null;
            const raw = window.localStorage.getItem(`${PROFILE_CACHE_PREFIX}${authUserId}`);
            if (!raw) return null;
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    };

    const writeCachedProfile = (profile: User) => {
        try {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(`${PROFILE_CACHE_PREFIX}${profile.id}`, JSON.stringify(profile));
        } catch {
            // ignore storage errors
        }
    };

    // Fetch user profile from public.users
    const fetchUserProfileInternal = async (authUserId: string): Promise<User | null> => {
        try {
            console.log(`🔍 [Auth] Profile Fetch for ${authUserId}`);

            const fetchPromise = supabase
                .from('users')
                .select('*')
                .eq('id', authUserId)
                .single();

            // 30 second timeout for profile fetch (cold starts)
            const profileRes = await withTimeout(
                fetchPromise,
                90000, // Increased to 90s for very slow environments
                'Profile fetch timed out'
            ) as { data: any, error: any };

            const { data, error } = profileRes;

            if (error) {
                console.error(`❌ [Auth] Fetch Error:`, error.message, error.code);
                return null;
            }

            if (!data) return null;

            console.log('✅ [Auth] Profile loaded');
            return data as User;
        } catch (err: any) {
            console.error(`❌ [Auth] Profile Exception:`, err.message || err);
            return null;
        }
    };

    const fetchUserProfile = (authUserId: string): Promise<User | null> => {
        if (inFlightProfileRef.current && inFlightProfileUserIdRef.current === authUserId) {
            return inFlightProfileRef.current;
        }

        inFlightProfileUserIdRef.current = authUserId;
        inFlightProfileRef.current = fetchUserProfileInternal(authUserId)
            .then((profile) => {
                if (profile) writeCachedProfile(profile);
                return profile;
            })
            .finally(() => {
                inFlightProfileRef.current = null;
                inFlightProfileUserIdRef.current = null;
            });

        return inFlightProfileRef.current;
    };


    // Helper to check MFA status
    const checkMfaStatus = async () => {
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            const totpFactor = data.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
            return !!totpFactor;
        } catch (err) {
            console.error('Error checking MFA status:', err);
            return false;
        }
    };

    // Initialize auth state
    useEffect(() => {
        console.log('🚀 AuthContext initializing...');
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Get initial session with 60s timeout + retry (very slow environments)
                const sessionRes = await withRetry(() =>
                    withTimeout(
                        supabase.auth.getSession(),
                        60000,
                        'Session check timed out'
                    )
                ) as { data: { session: Session | null }, error: any };

                const session = sessionRes.data?.session || null;

                if (!isMounted) return;

                const seq = ++authUpdateSeqRef.current;
                setSession(session);

                if (session?.user) {
                    const mfaEnabled = await checkMfaStatus();
                    if (isMounted) setIsMfaEnabled(mfaEnabled);

                    const cached = readCachedProfile(session.user.id);
                    if (cached) setCurrentUser(cached);

                    const profile = await fetchUserProfile(session.user.id);
                    if (!isMounted || seq !== authUpdateSeqRef.current) return;

                    if (profile) {
                        setCurrentUser(profile);
                    } else if (!cached) {
                        setCurrentUser(null);
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error('❌ [Auth] Init error:', err);
                if (isMounted) setCurrentUser(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            const seq = ++authUpdateSeqRef.current;
            console.log('🔄 [Auth] State change:', event);
            setSession(session);

            if (session?.user) {
                const mfaEnabled = await checkMfaStatus();
                if (isMounted) setIsMfaEnabled(mfaEnabled);

                const cached = readCachedProfile(session.user.id);
                if (cached) setCurrentUser(cached);

                const profile = await fetchUserProfile(session.user.id);
                if (!isMounted || seq !== authUpdateSeqRef.current) return;

                if (profile) {
                    setCurrentUser(profile);
                } else if (!cached) {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Login function
    const login = async (email: string, password: string) => {
        try {
            console.log('🔑 [Auth] Starting login for:', email);
            const normalizedEmail = normalizeEmail(email);

            // Validate email domain (ApplyWizz only)
            const domainCheck = validateEmailDomain(normalizedEmail);
            if (!domainCheck.valid) {
                return { success: false, error: domainCheck.error };
            }

            // Sign in with Supabase Auth (60s timeout + retry for very slow networks)
            const loginRes = await withRetry(() =>
                withTimeout(
                    supabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password: password,
                    }),
                    60000,
                    'Login request timed out. Please check your connection.'
                )
            ) as { data: { user: SupabaseUser | null, session: Session | null }, error: any };

            const { data, error } = loginRes;

            if (error) {
                return { success: false, error: error.message };
            }

            if (!data.user) {
                return { success: false, error: 'Authentication failed: No user returned.' };
            }

            // Check if MFA is required
            const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (mfaError) console.error('MFA Check Error:', mfaError);

            if (mfaData?.nextLevel === 'aal2' && mfaData?.nextLevel !== mfaData?.currentLevel) {
                // Get factors to find the TOTP one
                const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
                if (factorsError) return { success: false, error: factorsError.message };

                const totpFactor = factorsData.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
                if (!totpFactor) {
                    return { success: false, error: 'MFA required but no verified TOTP factor found.' };
                }

                // MFA is required. Create a challenge with timeout.
                const { data: challengeData, error: challengeError } = await withTimeout(
                    supabase.auth.mfa.challenge({
                        factorId: totpFactor.id
                    }),
                    10000,
                    'MFA challenge creation timed out'
                ) as { data: any, error: any };

                if (challengeError) {
                    return { success: false, error: `MFA Challenge failed: ${challengeError.message}` };
                }

                setMfaChallengeId(challengeData.id);
                setMfaFactorId(totpFactor.id);
                return { success: true, mfaRequired: true };
            }

            // Fetch user profile (30s timeout via fetchUserProfile)
            const profile = await fetchUserProfile(data.user.id);

            if (!profile) {
                // User exists in auth but not in public.users - try to sign out quickly
                try {
                    await withTimeout(supabase.auth.signOut(), 3000, 'Signout timeout');
                } catch { /* ignore signout error */ }

                return {
                    success: false,
                    error: 'User profile not found. This usually means your profile was deleted. Please contact your administrator to recreate it.',
                };
            }

            setCurrentUser(profile);
            setSession(data.session);

            return {
                success: true,
                needsPasswordReset: profile.must_change_password
            };
        } catch (error: any) {
            console.error('❌ [Auth] Login exception:', error);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred during login.',
            };
        }
    };

    // Verify MFA function
    const verifyMfa = async (code: string) => {
        try {
            if (!mfaFactorId) {
                return { success: false, error: 'No active MFA factor found. Please log in again.' };
            }

            // If challenge is missing or expired, create a new one
            let currentChallengeId = mfaChallengeId;
            if (!currentChallengeId) {
                console.log('🔄 [MFA] Creating new challenge...');
                const { data: challengeData, error: challengeError } = await withTimeout(
                    supabase.auth.mfa.challenge({
                        factorId: mfaFactorId
                    }),
                    10000,
                    'MFA challenge timed out'
                ) as { data: any, error: any };

                if (challengeError) {
                    console.error('❌ [MFA] Challenge creation error:', challengeError);
                    return { success: false, error: `Failed to create MFA challenge: ${challengeError.message}` };
                }
                currentChallengeId = challengeData.id;
                setMfaChallengeId(currentChallengeId);
            }

            console.log('🔐 [MFA] Verifying code...');
            const { error } = await withTimeout(
                supabase.auth.mfa.verify({
                    factorId: mfaFactorId,
                    challengeId: currentChallengeId,
                    code: code
                }),
                15000,
                'MFA verification timed out. Please try again.'
            ) as { error: any };

            // If verification failed due to expired challenge, create new challenge and retry
            if (error && (error.message.includes('expired') || error.status === 422)) {
                console.log('🔄 [MFA] Challenge expired, creating new one...');
                const { data: newChallenge, error: newChallengeError } = await withTimeout(
                    supabase.auth.mfa.challenge({
                        factorId: mfaFactorId
                    }),
                    10000,
                    'MFA challenge creation timed out'
                ) as { data: any, error: any };

                if (newChallengeError) {
                    console.error('❌ [MFA] New challenge failed:', newChallengeError);
                    return { success: false, error: 'MFA challenge expired. Please try again.' };
                }

                setMfaChallengeId(newChallenge.id);
                console.log('✅ [MFA] Fresh challenge ready. User must enter NEW code.');

                // CRITICAL FIX: Don't retry with stale TOTP code (changes every 30s)
                // User must enter fresh code from authenticator for new challenge
                return {
                    success: false,
                    error: 'Code expired. Please enter a fresh code from your authenticator app.'
                };
            } else if (error) {
                return { success: false, error: error.message || 'Invalid verification code.' };
            }

            setMfaChallengeId(null);
            setMfaFactorId(null);

            // IMPORTANT: Set MFA enabled immediately to prevent ProtectedRoute race condition
            setIsMfaEnabled(true);

            // Re-fetch profile now that we are fully authed
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const profile = await fetchUserProfile(user.id);
                if (profile) setCurrentUser(profile);
            }

            return { success: true };
        } catch (error: any) {
            console.error('❌ [MFA] Verification error:', error);
            return { success: false, error: error.message || 'MFA verification failed.' };
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await withTimeout(supabase.auth.signOut(), 5000, 'Signout timed out');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setCurrentUser(null);
            setSession(null);
        }
    };

    // Update password function
    const updatePassword = async (newPassword: string) => {
        try {
            if (!currentUser) return { success: false, error: 'No user logged in' };

            // Update password in Supabase Auth (15s timeout)
            const authRes = await withTimeout(
                supabase.auth.updateUser({ password: newPassword }),
                15000,
                'Password update timed out'
            ) as { data: { user: SupabaseUser | null }, error: any };

            const authError = authRes.error;

            if (authError) return { success: false, error: authError.message };

            // Update must_change_password flag
            const { error: dbError } = await supabase
                .from('users')
                .update({ must_change_password: false })
                .eq('id', currentUser.id);

            if (dbError) {
                return { success: false, error: 'Password updated but profile sync failed' };
            }

            const updatedProfile = await fetchUserProfile(currentUser.id);
            if (updatedProfile) setCurrentUser(updatedProfile);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Update failed' };
        }
    };

    const value = {
        currentUser,
        session,
        loading,
        login,
        verifyMfa,
        logout,
        updatePassword,
        isMfaEnabled,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
