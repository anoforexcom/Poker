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
  updateUser: (updates: Partial<UserState>) => void;
}

const defaultUser: UserState = {
  name: 'Carlos "The Shark"',
  avatar: 'https://picsum.photos/seed/pokerhero/100/100',
  balance: 12450.00,
  rank: 'VIP Emerald',
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(() => {
    // Try to get user from localStorage (shared with AuthContext)
    const saved = localStorage.getItem('poker_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user profile:', e);
        return defaultUser;
      }
    }
    return defaultUser;
  });

  // Sync with localStorage changes (when AuthContext updates)
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('poker_user_profile');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse user profile:', e);
        }
      } else {
        setUser(defaultUser);
      }
    };

    // Listen for storage events (cross-tab sync)
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for same-tab updates
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Persist user changes to localStorage
  React.useEffect(() => {
    localStorage.setItem('poker_user_profile', JSON.stringify(user));
  }, [user]);

  const deposit = (amount: number) => {
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  };

  const withdraw = (amount: number) => {
    if (user.balance >= amount) {
      setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    } else {
      alert("Insufficient funds!");
    }
  };

  const updateBalance = (amount: number) => {
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  }

  const updateUser = (updates: Partial<UserState>) => {
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
