import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    balance: number;
    rank: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Initial boot loading
    const [isProcessing, setIsProcessing] = useState(false); // Action loading (login/register)

    const fetchProfile = async (userId: string, email: string, retries = 3) => {
        console.log(`[AUTH_CONTEXT] Fetching profile for: ${userId} (Attempts left: ${retries})`);

        for (let i = 0; i <= retries; i++) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                console.log('[AUTH_CONTEXT] Profile found:', data.name);
                return {
                    id: data.id,
                    name: data.name,
                    email: email,
                    avatar: data.avatar_url,
                    balance: data.balance,
                    rank: data.rank
                };
            }

            if (error) {
                console.error('[AUTH_CONTEXT] Error fetching profile:', error);
            }

            if (i < retries) {
                console.log(`[AUTH_CONTEXT] Profile not found yet, retrying in ${1000 * (i + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }

        console.warn(`[AUTH_CONTEXT] Profile not found for ${userId} after retries. Creating/Upserting manually...`);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    name: email.split('@')[0], // Fallback name
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                    balance: 10000,
                    rank: 'Bronze'
                })
                .select()
                .maybeSingle();

            if (data) {
                return {
                    id: data.id,
                    name: data.name,
                    email: email,
                    avatar: data.avatar_url,
                    balance: data.balance,
                    rank: data.rank
                };
            }
            if (error) throw error;
        } catch (err) {
            console.error('[AUTH_CONTEXT] Manual profile creation failed:', err);
        }

        return null;
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const profile = await fetchProfile(session.user.id, session.user.email || '');
                    setUser(profile);
                }
            } catch (err) {
                console.error('[AUTH_CONTEXT] Initialization error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AUTH_CONTEXT] Auth event:', event);

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || (event === 'INITIAL_SESSION' && session)) {
                if (session?.user) {
                    const profile = await fetchProfile(session.user.id, session.user.email || '');
                    setUser(profile);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }

            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setIsProcessing(true);
        try {
            // MAGIC BYPASS FOR TESTING
            if (email === 'jogador@teste.com' && password === 'poker123') {
                console.log('[AUTH_CONTEXT] Using magic login bypass...');
                const testUser: User = {
                    id: 'magic-test-id-001',
                    name: 'Jogador Teste',
                    email: email,
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
                    balance: 100000,
                    rank: 'Diamond'
                };
                setUser(testUser);
                setIsProcessing(false);
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err) {
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsProcessing(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                    }
                }
            });

            if (error) throw error;

            console.log('[AUTH_CONTEXT] SignUp successful, ensuring profile exists...');

            if (data.user) {
                const profileData = {
                    id: data.user.id,
                    name: name,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
                    balance: 10000,
                    rank: 'Bronze'
                };

                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert(profileData);

                if (profileError) {
                    console.warn('[AUTH_CONTEXT] Manual profile upsert warning:', profileError);
                }

                // Immediately set user locally to trigger navigation
                setUser({
                    ...profileData,
                    email: email,
                    avatar: profileData.avatar_url,
                });
            }
        } catch (err) {
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const continueAsGuest = () => {
        const guestUser: User = {
            id: 'demo-guest-id',
            name: 'Demo Guest',
            email: 'demo@guest.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
            balance: 50000,
            rank: 'Platinum'
        };
        setUser(guestUser);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            continueAsGuest,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
