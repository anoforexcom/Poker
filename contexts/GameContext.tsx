import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

interface UserState {
  id: string; // Adicionado para operações de banco
  name: string;
  avatar: string;
  balance: number;
  rank: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
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
}

const defaultUser: UserState = {
  id: '',
  name: 'Guest Player',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  balance: 0,
  rank: 'Bronze',
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

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!authUser || authUser.id === 'demo-guest-id') return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
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
      });
      fetchTransactions();
    } else {
      setUser(defaultUser);
      setTransactions([]);
    }
  }, [authUser]);

  const updateProfileInDB = async (updates: any) => {
    if (!authUser || authUser.id === 'demo-guest-id' || !authUser.id) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', authUser.id);
    if (error) throw error;
  };

  const deposit = async (amount: number, method: string = 'Visa') => {
    const newBalance = user.balance + amount;
    await updateProfileInDB({ balance: newBalance });

    if (authUser && authUser.id !== 'demo-guest-id') {
      await supabase.from('transactions').insert({
        user_id: authUser.id,
        type: 'deposit',
        amount: amount,
        method: method,
        status: 'completed'
      });
      fetchTransactions();
    }

    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  const withdraw = async (amount: number, method: string = 'Visa') => {
    if (user.balance >= amount) {
      const newBalance = user.balance - amount;
      await updateProfileInDB({ balance: newBalance });

      if (authUser && authUser.id !== 'demo-guest-id') {
        await supabase.from('transactions').insert({
          user_id: authUser.id,
          type: 'withdrawal',
          amount: amount,
          method: method,
          status: 'completed'
        });
        fetchTransactions();
      }

      setUser(prev => ({ ...prev, balance: newBalance }));
    } else {
      throw new Error('Insufficient funds');
    }
  };

  const updateBalance = async (amount: number) => {
    const newBalance = user.balance + amount;
    await updateProfileInDB({ balance: newBalance });
    setUser(prev => ({ ...prev, balance: newBalance }));
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

  return (
    <GameContext.Provider value={{
      user,
      transactions,
      deposit,
      withdraw,
      updateBalance,
      updateUser,
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
