import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    balance: number;
    rank: string;
    xp: number;
    level: number;
    isAdmin: boolean;
    stats: any;
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
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchProfile = async (userId: string, email: string) => {
        console.log(`[AUTH_CONTEXT] Fetching Firestore profile for: ${userId}`);

        try {
            const docRef = doc(db, 'profiles', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('[AUTH_CONTEXT] Profile found:', data.name);
                return {
                    id: userId,
                    name: data.name,
                    email: email,
                    avatar: data.avatar_url,
                    balance: data.balance,
                    rank: data.rank,
                    xp: data.xp || 0,
                    level: data.level || 1,
                    isAdmin: data.is_admin || false
                };
            } else {
                console.warn('[AUTH_CONTEXT] Profile not found for', userId);
                return null;
            }
        } catch (error) {
            console.error('[AUTH_CONTEXT] Error fetching profile:', error);
            return null;
        }
    };

    const ensureProfileExists = async (userId: string, email: string, name?: string) => {
        console.log(`[AUTH_CONTEXT] Ensuring profile exists for: ${userId}`);
        try {
            const docRef = doc(db, 'profiles', userId);
            let docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log('[AUTH_CONTEXT] Profile does not exist. Creating new profile...');
                const profileData = {
                    name: name || email.split('@')[0],
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                    balance: 10000,
                    rank: 'Bronze',
                    is_admin: false,
                    xp: 0,
                    level: 1,
                    stats: {
                        hands_played: 0,
                        hands_won: 0,
                        biggest_pot: 0,
                        best_hand: '',
                        win_streak: 0,
                        current_streak: 0,
                        total_chips_won: 0,
                        total_chips_lost: 0,
                        login_streak: 0,
                        last_daily_claim: null,
                        last_login_date: null,
                    },
                    created_at: serverTimestamp()
                };

                try {
                    await setDoc(docRef, profileData);
                    console.log('[AUTH_CONTEXT] Profile created successfully');
                    return { id: userId, email, ...profileData, isAdmin: false, avatar: profileData.avatar_url, stats: profileData.stats };
                } catch (setErr: any) {
                    console.error('[AUTH_CONTEXT] Error writing to Firestore:', setErr);
                    if (setErr.code === 'permission-denied') {
                        throw new Error('Permissão negada no Firestore. Verifique as rules.');
                    }
                    throw setErr;
                }
            }

            const data = docSnap.data();
            console.log('[AUTH_CONTEXT] Profile already exists:', data.name);
            return {
                id: userId,
                name: data.name,
                email: email,
                avatar: data.avatar_url,
                balance: data.balance,
                rank: data.rank,
                xp: data.xp || 0,
                level: data.level || 1,
                isAdmin: data.is_admin || false,
                stats: data.stats || { // Ensure stats object exists, provide defaults if not
                    hands_played: 0,
                    hands_won: 0,
                    biggest_pot: 0,
                    best_hand: '',
                    win_streak: 0,
                    current_streak: 0,
                    total_chips_won: 0,
                    total_chips_lost: 0,
                    login_streak: 0,
                    last_daily_claim: null,
                    last_login_date: null,
                },
            };
        } catch (error: any) {
            console.error('[AUTH_CONTEXT] Profile check/creation failed:', error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const profile = await fetchProfile(firebaseUser.uid, firebaseUser.email || '');
                if (profile) {
                    setUser(profile);
                } else {
                    // This could happen if auth exists but profile doc was deleted
                    const newProfile = await ensureProfileExists(firebaseUser.uid, firebaseUser.email || '');
                    setUser(newProfile as User);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setIsProcessing(true);
        try {
            // MAGIC BYPASS FOR TESTING
            if (email === 'jogador@teste.com' && password === 'poker123') {
                console.log('[AUTH_CONTEXT] Using magic login bypass...');
                const testUser: User = {
                    id: '00000000-0000-0000-0000-000000000001',
                    name: 'Jogador Teste',
                    email: email,
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
                    balance: 100000,
                    rank: 'Diamond',
                    xp: 5000,
                    level: 10,
                    isAdmin: true,
                    stats: null
                };
                setUser(testUser);
                return;
            }

            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error('[AUTH_CONTEXT] Login error:', err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsProcessing(true);
        console.log(`[AUTH_CONTEXT] Starting registration for: ${email}`);
        try {
            // MAGIC BYPASS FOR TESTING
            if (email === 'jogador@teste.com') {
                console.log('[AUTH_CONTEXT] Using magic register bypass...');
                const testUser: User = {
                    id: '00000000-0000-0000-0000-000000000001',
                    name: name || 'Jogador Teste',
                    email: email,
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
                    balance: 100000,
                    rank: 'Diamond',
                    xp: 5000,
                    level: 10,
                    isAdmin: true,
                    stats: null
                };
                setUser(testUser);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            console.log('[AUTH_CONTEXT] Firebase Auth user created:', firebaseUser.uid);

            try {
                await updateFirebaseProfile(firebaseUser, { displayName: name });
            } catch (profileErr) {
                console.warn('[AUTH_CONTEXT] Could not update Firebase Auth profile display name:', profileErr);
            }

            const profile = await ensureProfileExists(firebaseUser.uid, email, name);
            if (profile) {
                setUser(profile as User);
            }
        } catch (err: any) {
            console.error('[AUTH_CONTEXT] Detailed Registration error:', err);

            // Map common Firebase errors to user-friendly messages in Portuguese
            let userMessage = 'Falha ao registar conta.';

            if (err.code === 'auth/email-already-in-use') {
                userMessage = 'Este email já está em uso.';
            } else if (err.code === 'auth/invalid-email') {
                userMessage = 'Email inválido.';
            } else if (err.code === 'auth/weak-password') {
                userMessage = 'A password é demasiado fraca.';
            } else if (err.code === 'auth/operation-not-allowed') {
                userMessage = 'O registo com email/password não está ativo no Firebase.';
            } else if (err.message && err.message.includes('permission-denied')) {
                userMessage = 'Erro de permissão no banco de dados (Firestore Rules).';
            }

            throw new Error(userMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const continueAsGuest = async () => {
        const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        const guestUser: User = {
            id: guestId,
            name: 'Demo Guest',
            email: 'demo@guest.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
            balance: 50000,
            rank: 'Platinum',
            xp: 2500,
            level: 5,
            isAdmin: false,
            stats: null
        };

        // For guests, we don't necessarily persist to Firestore in this version
        // unless they convert to a real account, but keeping consistency with old logic:
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
