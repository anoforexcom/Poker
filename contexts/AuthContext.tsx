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
    const [isLoading, setIsLoading] = useState(true);

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

        console.warn('[AUTH_CONTEXT] Profile not found after retries. Creating temporary guest-like profile.');
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
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err) {
            setIsLoading(false);
            throw err;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                    }
                }
            });
            if (error) throw error;

            // Note: onAuthStateChange will handle setting the user and setIsLoading(false)
        } catch (err) {
            setIsLoading(false);
            throw err;
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
