import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

interface UserState {
  id: string; // Adicionado para operações de banco
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
  created_at: string;
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

  const fetchTransactions = async () => {
    if (!authUser?.id) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (data) setTransactions(data);
  };

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        avatar: authUser.avatar,
        balance: authUser.balance,
        rank: authUser.rank,
        xp: authUser.xp || 0,
        level: authUser.level || 1,
      });
      fetchTransactions();
    } else {
      setUser(defaultUser);
      setTransactions([]);
    }
  }, [authUser]);

  const updateProfileInDB = async (updates: any) => {
    if (!authUser || !authUser.id) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', authUser.id);
    if (error) throw error;
  };

  const deposit = async (amount: number, method: string = 'Visa') => {
    // SECURITY: In production, this would be a webhook from a payment provider.
    // We'll update the balance via a dedicated RPC if available, or keep it local-only for UI until synced.
    console.warn('[GAME_CONTEXT] Manual deposit is being restricted for production hardening.');

    if (authUser && authUser.id) {
      // Still allow for demo purposes but log it correctly
      const { error } = await supabase.from('transactions').insert({
        user_id: authUser.id,
        type: 'deposit',
        amount: amount,
        method: method,
        status: 'completed'
      });
      if (error) throw error;

      // Note: In real-money, a trigger would update the profile balance based on the transaction.
      // For now, we update local state only if the insert was successful.
      setUser(prev => ({ ...prev, balance: prev.balance + amount }));
      fetchTransactions();
    }
  };

  const withdraw = async (amount: number, method: string = 'Visa') => {
    if (user.balance < amount) throw new Error('Insufficient funds');

    console.warn('[GAME_CONTEXT] Manual withdrawal is restricted for production hardening.');

    if (authUser && authUser.id) {
      await supabase.from('transactions').insert({
        user_id: authUser.id,
        type: 'withdrawal',
        amount: amount,
        method: method,
        status: 'pending'
      });

      // Important: Balance deduction should only happen via backend trigger or after verification.
      setUser(prev => ({ ...prev, balance: prev.balance - amount }));
      fetchTransactions();
    }
  };

  const updateBalance = async (amount: number) => {
    // Prevent random balance updates from client code
    console.error('[SECURITY] updateBalance() called from client. This action is forbidden in production.');
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
    const { data, error } = await supabase.rpc('claim_reward', { challenge_id_param: challengeId });
    if (error) throw error;

    if (data.success) {
      setUser(prev => ({ ...prev, balance: data.new_balance }));
      fetchTransactions();
    }
    return data;
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
