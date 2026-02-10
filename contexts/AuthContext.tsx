import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string; // email for simplicity
    name: string;
    email: string;
    password?: string; // stored for mock auth
    avatar: string;
    balance: number;
    rank: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_DB_KEY = 'poker_users_db';
const CURRENT_USER_KEY = 'poker_user_profile'; // Shared with GameContext

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const db = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
        const foundUser = db.find((u: User) => u.email === email && u.password === password);

        if (foundUser) {
            const { password, ...safeUser } = foundUser;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
            setUser(safeUser);
        } else {
            setIsLoading(false);
            throw new Error('Invalid email or password');
        }
        setIsLoading(false);
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        const db = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');

        // Check if email exists
        if (db.some((u: User) => u.email === email)) {
            setIsLoading(false);
            throw new Error('Email already registered');
        }

        const newUser: User = {
            id: email,
            name,
            email,
            password,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            balance: 10000, // Starting balance
            rank: 'Bronze'
        };

        const updatedDb = [...db, newUser];
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedDb));

        // Auto-login after register
        const { password: _, ...safeUser } = newUser;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
        setUser(safeUser);

        setIsLoading(false);
    };

    const logout = () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
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
