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

interface GameContextType {
  user: UserState;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  updateUser: (updates: Partial<UserState>) => Promise<void>;
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

  // Sync with AuthContext user
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        avatar: authUser.avatar,
        balance: authUser.balance,
        rank: authUser.rank,
      });
    } else {
      setUser(defaultUser);
    }
  }, [authUser]);

  const updateProfileInDB = async (updates: any) => {
    // Se for guest ou não estiver logado, apenas atualizamos o estado local
    if (!authUser || user.id === 'demo-guest-id') return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authUser.id);

    if (error) {
      console.error('[GAME_CONTEXT] Error updating profile:', error);
      throw error;
    }
  };

  const deposit = async (amount: number) => {
    const newBalance = user.balance + amount;
    await updateProfileInDB({ balance: newBalance });
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  const withdraw = async (amount: number) => {
    if (user.balance >= amount) {
      const newBalance = user.balance - amount;
      await updateProfileInDB({ balance: newBalance });
      setUser(prev => ({ ...prev, balance: newBalance }));
    } else {
      alert("Insufficient funds!");
      throw new Error('Insufficient funds');
    }
  };

  const updateBalance = async (amount: number) => {
    const newBalance = user.balance + amount;
    await updateProfileInDB({ balance: newBalance });
    setUser(prev => ({ ...prev, balance: newBalance }));
  }

  const updateUser = async (updates: Partial<UserState>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatar) dbUpdates.avatar_url = updates.avatar;
    if (updates.rank) dbUpdates.rank = updates.rank;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;

    await updateProfileInDB(dbUpdates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <GameContext.Provider value={{ user, deposit, withdraw, updateBalance, updateUser }}>
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
