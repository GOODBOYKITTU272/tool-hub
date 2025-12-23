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
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
        let timeoutId: number | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
        });

        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            if (timeoutId !== undefined) clearTimeout(timeoutId);
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

    // Fetch user profile from public.users with retry logic and timeout
    const fetchUserProfileInternal = async (authUserId: string, retries = 2): Promise<User | null> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔍 [Auth] Profile Fetch: Attempt ${attempt}/${retries} for ${authUserId}`);

                const fetchPromise = (supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUserId)
                    .single()) as Promise<any>;

                // Add 8 second timeout
                const { data, error } = await withTimeout(
                    fetchPromise,
                    8000,
                    'Profile fetch timed out after 8 seconds'
                );

                if (error) {
                    console.error(`❌ [Auth] Fetch Error (Attempt ${attempt}):`, error.message, error.code);

                    // If table doesn't exist, stop retrying
                    if (error.code === '42P01') {
                        console.error('🛑 [Auth] CRITICAL: "users" table is missing in Supabase!');
                        return null;
                    }

                    if (attempt < retries) {
                        const delay = 500 * attempt;
                        console.log(`⏳ [Auth] Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    return null;
                }

                if (!data) {
                    console.warn('⚠️ [Auth] Fetch succeeded but data is empty');
                    return null;
                }

                console.log('✅ [Auth] Profile loaded successfully');
                return data as User;
            } catch (err: any) {
                console.error(`❌ [Auth] Exception (Attempt ${attempt}):`, err.message || err);

                if (attempt < retries) {
                    const delay = 500 * attempt;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                return null;
            }
        }
        return null;
    };

    const fetchUserProfile = (authUserId: string, retries = 3): Promise<User | null> => {
        if (inFlightProfileRef.current && inFlightProfileUserIdRef.current === authUserId) {
            return inFlightProfileRef.current;
        }

        inFlightProfileUserIdRef.current = authUserId;
        inFlightProfileRef.current = fetchUserProfileInternal(authUserId, retries)
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

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const seq = ++authUpdateSeqRef.current;
            console.log('🔐 Initial session check:', session ? 'Session found' : 'No session');
            if (session) {
                console.log('📧 Session user email:', session.user.email);
                console.log('🆔 Session user ID:', session.user.id);
            }

            setSession(session);

            if (session?.user) {
                const cached = readCachedProfile(session.user.id);
                if (cached) {
                    setCurrentUser(cached);
                }

                console.log('👤 Fetching profile for user:', session.user.email);
                const profile = await fetchUserProfile(session.user.id);
                if (!isMounted || seq !== authUpdateSeqRef.current) return;

                if (profile) {
                    console.log('✅ Profile loaded successfully!');
                    console.log('🎯 Setting currentUser to:', profile.name, `(${profile.role})`);
                    setCurrentUser(profile);
                    console.log('✨ currentUser state updated');
                } else {
                    console.warn('⚠️ Profile not found, but keeping session active');
                    console.log('🔄 Setting currentUser to null');
                    setCurrentUser(null);
                }
            } else {
                console.log('❌ No session user found');
                setCurrentUser(null);
            }

            console.log('✅ Auth initialization complete, setting loading to false');
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            const seq = ++authUpdateSeqRef.current;
            console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
            setSession(session);

            if (session?.user) {
                const cached = readCachedProfile(session.user.id);
                if (cached) {
                    setCurrentUser(cached);
                }

                const profile = await fetchUserProfile(session.user.id);
                if (!isMounted || seq !== authUpdateSeqRef.current) return;

                if (profile) {
                    setCurrentUser(profile);
                } else {
                    console.warn('⚠️ Profile not found during auth change, but keeping session');
                    // DON'T sign out - just set currentUser to null
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
            const normalizedEmail = normalizeEmail(email);

            // Sign in with Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password, // Password is case-sensitive
            });

            if (error) {
                console.error('Login error:', error);
                return {
                    success: false,
                    error: error.message || 'Invalid email or password',
                };
            }

            if (!data.user) {
                return {
                    success: false,
                    error: 'No user data returned',
                };
            }

            // Fetch user profile
            const profile = await fetchUserProfile(data.user.id);

            if (!profile) {
                // User exists in auth but not in public.users
                await supabase.auth.signOut();
                return {
                    success: false,
                    error: 'User profile not found. Please contact administrator.',
                };
            }

            setCurrentUser(profile);
            setSession(data.session);

            // Check if password reset is required
            if (profile.must_change_password) {
                return {
                    success: true,
                    needsPasswordReset: true,
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Login exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            };
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setSession(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Update password function
    const updatePassword = async (newPassword: string) => {
        try {
            if (!currentUser) {
                return {
                    success: false,
                    error: 'No user logged in',
                };
            }

            // Update password in Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (authError) {
                console.error('Password update error:', authError);
                return {
                    success: false,
                    error: authError.message || 'Failed to update password',
                };
            }

            // Update must_change_password flag in public.users
            const { error: dbError } = await supabase
                .from('users')
                .update({ must_change_password: false })
                .eq('id', currentUser.id);

            if (dbError) {
                console.error('Database update error:', dbError);
                return {
                    success: false,
                    error: 'Password updated but failed to update profile',
                };
            }

            // Refresh user profile
            const updatedProfile = await fetchUserProfile(currentUser.id);
            if (updatedProfile) {
                setCurrentUser(updatedProfile);
            }

            return { success: true };
        } catch (error) {
            console.error('Update password exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            };
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
