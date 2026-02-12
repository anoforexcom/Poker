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

    const fetchProfile = async (userId: string, email: string) => {
        console.log('[AUTH_CONTEXT] Fetching profile for:', userId);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[AUTH_CONTEXT] Error fetching profile:', error);
            return null;
        }

        if (data) {
            const profile: User = {
                id: data.id,
                name: data.name,
                email: email,
                avatar: data.avatar_url,
                balance: data.balance,
                rank: data.rank
            };
            return profile;
        }
        return null;
    };

    useEffect(() => {
        // Check active session on mount
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await fetchProfile(session.user.id, session.user.email || '');
                setUser(profile);
            }
            setIsLoading(false);
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AUTH_CONTEXT] Auth event:', event);
            if (session?.user) {
                const profile = await fetchProfile(session.user.id, session.user.email || '');
                setUser(profile);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                }
            }
        });

        if (error) {
            setIsLoading(false);
            throw error;
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
