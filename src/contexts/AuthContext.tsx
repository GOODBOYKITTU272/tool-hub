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
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordReset?: boolean }>;
    logout: () => Promise<void>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const authUpdateSeqRef = useRef(0);
    const inFlightProfileRef = useRef<Promise<User | null> | null>(null);
    const inFlightProfileUserIdRef = useRef<string | null>(null);

    const PROFILE_CACHE_PREFIX = 'tool-hub-profile:';

    // Helper to normalize email (lowercase)
    const normalizeEmail = (email: string) => email.toLowerCase().trim();

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

            // Strict 10 second timeout for profile fetch
            const profileRes = await withTimeout(
                fetchPromise,
                10000,
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


    // Initialize auth state
    useEffect(() => {
        console.log('🚀 AuthContext initializing...');
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Get initial session with 10s timeout
                const sessionRes = await withTimeout(
                    supabase.auth.getSession(),
                    10000,
                    'Session check timed out'
                ) as { data: { session: Session | null }, error: any };

                const session = sessionRes.data?.session || null;

                if (!isMounted) return;

                const seq = ++authUpdateSeqRef.current;
                setSession(session);

                if (session?.user) {
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

            // Sign in with Supabase Auth (15s timeout)
            const loginRes = await withTimeout(
                supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password: password,
                }),
                15000,
                'Login request timed out. Please check your connection.'
            ) as { data: { user: SupabaseUser | null, session: Session | null }, error: any };

            const { data, error } = loginRes;

            if (error) {
                return { success: false, error: error.message };
            }

            if (!data.user) {
                return { success: false, error: 'Authentication failed: No user returned.' };
            }

            // Fetch user profile (10s timeout via fetchUserProfile)
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
        logout,
        updatePassword,
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
