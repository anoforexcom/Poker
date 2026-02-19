import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../utils/firebase';

interface UserState {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  rank: string;
  xp: number;
  level: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'poker_buyin' | 'poker_win' | 'reward';
  amount: number;
  method: string;
  status: string;
  created_at: any;
}

interface GameContextType {
  user: UserState;
  transactions: Transaction[];
  deposit: (amount: number, method?: string) => Promise<void>;
  withdraw: (amount: number, method?: string) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  updateUser: (updates: Partial<UserState>) => Promise<void>;
  activeGames: string[];
  addActiveGame: (id: string) => void;
  removeActiveGame: (id: string) => void;
  claimReward: (challengeId: number) => Promise<{ success: boolean; message: string; new_balance?: number }>;
}

const defaultUser: UserState = {
  id: '',
  name: 'Guest Player',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  balance: 0,
  rank: 'Bronze',
  xp: 0,
  level: 1
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserState>(defaultUser);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeGames, setActiveGames] = useState<string[]>(() => {
    const saved = localStorage.getItem('poker_active_games');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('poker_active_games', JSON.stringify(activeGames));
  }, [activeGames]);

  useEffect(() => {
    if (!authUser?.id) {
      setUser(defaultUser);
      setTransactions([]);
      return;
    }

    // Set initial user state from auth
    setUser({
      id: authUser.id,
      name: authUser.name,
      avatar: authUser.avatar,
      balance: authUser.balance,
      rank: authUser.rank,
      xp: authUser.xp || 0,
      level: authUser.level || 1,
    });

    // Listen to real-time transactions
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', authUser.id),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        txs.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          method: data.method,
          status: data.status,
          created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString()
        });
      });
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [authUser]);

  const updateProfileInDB = async (updates: any) => {
    if (!authUser?.id) return;
    const docRef = doc(db, 'profiles', authUser.id);
    await updateDoc(docRef, updates);
  };

  const deposit = async (amount: number, method: string = 'Visa') => {
    console.warn('[GAME_CONTEXT] Manual deposit restricted for production.');

    if (authUser?.id) {
      await addDoc(collection(db, 'transactions'), {
        user_id: authUser.id,
        type: 'deposit',
        amount: amount,
        method: method,
        status: 'completed',
        created_at: serverTimestamp()
      });

      // Update local and remote balance
      const newBalance = user.balance + amount;
      await updateProfileInDB({ balance: newBalance });
      setUser(prev => ({ ...prev, balance: newBalance }));
    }
  };

  const withdraw = async (amount: number, method: string = 'Visa') => {
    if (user.balance < amount) throw new Error('Insufficient funds');

    console.warn('[GAME_CONTEXT] Manual withdrawal restricted.');

    if (authUser?.id) {
      await addDoc(collection(db, 'transactions'), {
        user_id: authUser.id,
        type: 'withdrawal',
        amount: amount,
        method: method,
        status: 'pending',
        created_at: serverTimestamp()
      });

      const newBalance = user.balance - amount;
      await updateProfileInDB({ balance: newBalance });
      setUser(prev => ({ ...prev, balance: newBalance }));
    }
  };

  const updateBalance = async (amount: number) => {
    console.error('[SECURITY] updateBalance() forbidden in production.');
  };

  const updateUser = async (updates: Partial<UserState>) => {
    await updateProfileInDB(updates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  const addActiveGame = (id: string) => {
    setActiveGames(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const removeActiveGame = (id: string) => {
    setActiveGames(prev => prev.filter(gameId => gameId !== id));
  };

  const claimReward = async (challengeId: number) => {
    // Simulated RPC call using Firestore
    try {
      if (!authUser?.id) throw new Error('Not authenticated');

      const rewardAmount = 500; // Simplified reward amount
      const newBalance = user.balance + rewardAmount;

      await updateProfileInDB({ balance: newBalance });

      await addDoc(collection(db, 'transactions'), {
        user_id: authUser.id,
        type: 'reward',
        amount: rewardAmount,
        method: 'System',
        status: 'completed',
        created_at: serverTimestamp()
      });

      setUser(prev => ({ ...prev, balance: newBalance }));

      return { success: true, message: 'Reward claimed!', new_balance: newBalance };
    } catch (error: any) {
      console.error('Reward claim failed:', error);
      throw error;
    }
  };

  return (
    <GameContext.Provider value={{
      user,
      transactions,
      deposit,
      withdraw,
      updateBalance,
      updateUser,
      claimReward,
      activeGames,
      addActiveGame,
      removeActiveGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
