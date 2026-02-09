import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserState {
  name: string;
  avatar: string;
  balance: number;
  rank: string;
}

interface GameContextType {
  user: UserState;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  updateBalance: (amount: number) => void;
}

const defaultUser: UserState = {
  name: 'Carlos "The Shark"',
  avatar: 'https://picsum.photos/seed/pokerhero/100/100',
  balance: 12450.00,
  rank: 'VIP Emerald',
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(defaultUser);

  const deposit = (amount: number) => {
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  };

  const withdraw = (amount: number) => {
    if (user.balance >= amount) {
      setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    } else {
      alert("Insufficient funds!");
      // In a real app, we'd use a toast notification
    }
  };

  const updateBalance = (amount: number) => {
      setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  }

  return (
    <GameContext.Provider value={{ user, deposit, withdraw, updateBalance }}>
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
