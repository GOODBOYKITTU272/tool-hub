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

    const normalizeEmail = (email: string) => email.toLowerCase().trim();

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

    const withTimeout = async <T,>(promise: Promise<T> | any, timeoutMs: number, errorMsg: string): Promise<T> => {
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
        });

        try {
            return await Promise.race([Promise.resolve(promise), timeoutPromise]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    };

    const withRetry = async <T,>(fn: () => Promise<T>, retries = 1): Promise<T> => {
        for (let i = 0; i <= retries; i++) {
            try {
                return await fn();
            } catch (error: any) {
                const isTimeout = error.message?.includes('timed out');
                const shouldRetry = isTimeout && i < retries;

                if (shouldRetry) {
                    console.log(`🔄 Retry ${i + 1}/${retries} after timeout...`);
                    await new Promise(r => setTimeout(r, 2000));
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
            // Ignore storage errors
        }
    };

    const fetchUserProfileInternal = async (authUserId: string): Promise<User | null> => {
        try {
            console.log(`🔍 [Auth] Profile Fetch for ${authUserId}`);

            const fetchPromise = supabase
                .from('users')
                .select('*')
                .eq('id', authUserId)
                .single();

            const profileRes = await withTimeout(
                fetchPromise,
                90000,
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

    useEffect(() => {
        console.log('🚀 AuthContext initializing...');
        let isMounted = true;
        let hasCompletedInit = false;

        const initAuth = async () => {
            try {
                console.log('⏳ [Auth] Starting initial session check...');

                const sessionRes = await withTimeout(
                    withRetry(() => supabase.auth.getSession()),
                    5000,
                    'Session check timed out - possible corrupt session data'
                ) as { data: { session: Session | null }, error: any };

                const session = sessionRes.data?.session || null;
                console.log('📦 [Auth] Initial session retrieved:', session ? 'Session exists' : 'No session');

                if (!isMounted) return;

                const seq = ++authUpdateSeqRef.current;
                setSession(session);

                if (session?.user) {
                    const mfaEnabled = await checkMfaStatus();
                    if (isMounted) setIsMfaEnabled(mfaEnabled);

                    const cached = readCachedProfile(session.user.id);
                    if (cached) {
                        console.log('💾 [Auth] Using cached profile');
                        setCurrentUser(cached);
                    }

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
            } catch (err: any) {
                console.error('❌ [Auth] Init error:', err);

                const isCorruptSession = err.message?.includes('timed out') || err.message?.includes('corrupt');
                if (isCorruptSession) {
                    console.warn('🧹 [Auth] Clearing potentially corrupt session data...');
                    try {
                        localStorage.removeItem('tool-hub-auth');
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('sb-')) localStorage.removeItem(key);
                        });
                    } catch (cleanupErr) {
                        console.error('Failed to clean localStorage:', cleanupErr);
                    }
                }

                if (isMounted) setCurrentUser(null);
            } finally {
                hasCompletedInit = true;
                if (isMounted) {
                    console.log('✅ [Auth] Initialization complete, setting loading to false');
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            const seq = ++authUpdateSeqRef.current;
            console.log('🔄 [Auth] State change:', event, '| hasCompletedInit:', hasCompletedInit);
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

            if (!hasCompletedInit && isMounted) {
                console.log('🔄 [Auth] Auth state changed before init completed, setting loading to false now');
                setLoading(false);
                hasCompletedInit = true; // Prevent double-setting if multiple events fire
            }
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

            // Sign in with Supabase Auth - no timeout, wait as long as needed
            const loginRes = await withRetry(() =>
                supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password: password,
                })
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

            // Fetch user profile asynchronously (don't block login completion)
            // This allows login to succeed immediately while profile loads in background
            fetchUserProfile(data.user.id).then((profile) => {
                if (!profile) {
                    console.warn('⚠️ [Auth] Profile not found after login, signing out...');
                    // User exists in auth but not in public.users
                    withTimeout(supabase.auth.signOut(), 3000, 'Signout timeout').catch(() => { });
                    setCurrentUser(null);
                    return;
                }

                console.log('✅ [Auth] Profile loaded:', profile.name);
                setCurrentUser(profile);
            }).catch((err) => {
                console.error('❌ [Auth] Profile fetch failed:', err);
                // Set minimal user data to allow partial functionality
                setCurrentUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    name: data.user.email?.split('@')[0] || 'User',
                    role: 'Observer', // Default to lowest privilege
                    must_change_password: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            });

            // Return success immediately, don't wait for profile
            setSession(data.session);

            return {
                success: true,
                needsPasswordReset: false // Profile loads async, can't check this yet
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

    // Logout function - Robust cleanup to prevent stale session issues
    const logout = async () => {
        try {
            console.log('🚪 [Auth] Starting logout process...');

            // Step 1: Sign out from Supabase
            try {
                await withTimeout(supabase.auth.signOut(), 5000, 'Signout timed out');
                console.log('✅ [Auth] Supabase signOut complete');
            } catch (error) {
                console.error('⚠️ [Auth] Supabase signOut error (continuing anyway):', error);
                // Continue with cleanup even if signOut fails
            }

            // Step 2: Explicitly clear ALL auth-related localStorage keys
            // This prevents stale sessions from interfering with re-login
            console.log('🧹 [Auth] Clearing localStorage...');
            const keys = Object.keys(localStorage);
            let clearedCount = 0;

            keys.forEach(key => {
                // Clear keys related to our app or Supabase
                if (
                    key.startsWith('tool-hub') ||
                    key.startsWith('supabase') ||
                    key.startsWith('sb-') ||
                    key.includes('auth')
                ) {
                    console.log(`  ↳ Removing: ${key}`);
                    localStorage.removeItem(key);
                    clearedCount++;
                }
            });

            console.log(`✅ [Auth] Cleared ${clearedCount} localStorage keys`);

            // Step 3: Reset React state FIRST (before navigation)
            // This is crucial: setting currentUser=null disables ReloadProtection
            // BEFORE window.location.href triggers the beforeunload event
            setCurrentUser(null);
            setSession(null);
            setIsMfaEnabled(false);
            setMfaFactorId(null);
            setMfaChallengeId(null);
            setLoading(false);
            console.log('✅ [Auth] React state reset');

            // Step 4: Small delay to ensure React state updates propagate
            // This gives ReloadProtection time to disable before navigation
            await new Promise(resolve => setTimeout(resolve, 50));

            // Step 5: Force navigation to login page (hard refresh)
            // Using window.location ensures complete state reset
            console.log('🔄 [Auth] Redirecting to login...');
            window.location.href = '/login';

        } catch (error) {
            console.error('❌ [Auth] Logout failed catastrophically:', error);

            // Emergency cleanup - clear everything and redirect
            console.error('🆘 [Auth] Performing emergency cleanup...');
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (storageError) {
                console.error('Failed to clear storage:', storageError);
            }

            // Force redirect even if cleanup failed
            window.location.href = '/login';
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
