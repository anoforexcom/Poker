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

// ── Ranking System ──────────────────────────────────────────
export interface RankInfo {
  name: string;
  xpRequired: number;
  color: string;
  icon: string;
  bonusMultiplier: number;
}

export const RANKS: RankInfo[] = [
  { name: 'Bronze', xpRequired: 0, color: '#CD7F32', icon: '🟤', bonusMultiplier: 1.0 },
  { name: 'Silver', xpRequired: 1000, color: '#C0C0C0', icon: '⚪', bonusMultiplier: 1.05 },
  { name: 'Gold', xpRequired: 5000, color: '#FFD700', icon: '🟡', bonusMultiplier: 1.10 },
  { name: 'Platinum', xpRequired: 15000, color: '#00CED1', icon: '💎', bonusMultiplier: 1.20 },
  { name: 'Diamond', xpRequired: 50000, color: '#4169E1', icon: '💠', bonusMultiplier: 1.30 },
  { name: 'Legend', xpRequired: 150000, color: '#DC143C', icon: '🔴', bonusMultiplier: 1.50 },
];

export const DAILY_BONUS_BASE = 1000;
export const STARTING_CHIPS = 10000;

// ── XP Rewards ──────────────────────────────────────────────
export const XP_REWARDS = {
  HAND_PLAYED: 5,
  HAND_WON: 15,
  PREMIUM_HAND: 25,  // Full House+
  DAILY_MISSION: 50,
  TOURNAMENT_WIN: 200,
};

// ── Types ───────────────────────────────────────────────────
export interface PlayerStats {
  hands_played: number;
  hands_won: number;
  biggest_pot: number;
  best_hand: string;
  win_streak: number;
  current_streak: number;
  total_chips_won: number;
  total_chips_lost: number;
  login_streak: number;
  last_daily_claim: string | null;  // ISO date string
  last_login_date: string | null;
}

export interface UserState {
  id: string;
  name: string;
  avatar: string;
  chips: number;       // renamed from balance
  rank: string;
  xp: number;
  level: number;
  stats: PlayerStats;
}

export interface Transaction {
  id: string;
  type: 'chip_purchase' | 'daily_bonus' | 'poker_win' | 'poker_loss' | 'reward' | 'achievement';
  amount: number;
  description: string;
  status: string;
  created_at: any;
}

interface GameContextType {
  user: UserState;
  transactions: Transaction[];
  // Chip operations
  addChips: (amount: number, type: Transaction['type'], description: string) => Promise<void>;
  removeChips: (amount: number, description: string) => Promise<void>;
  claimDailyBonus: () => Promise<{ success: boolean; amount: number; message: string }>;
  canClaimDailyBonus: () => boolean;
  // XP & Ranking
  addXP: (amount: number) => Promise<void>;
  getRank: () => RankInfo;
  getNextRank: () => RankInfo | null;
  getRankProgress: () => number; // 0-100
  // Legacy compat
  updateBalance: (amount: number) => Promise<void>;
  updateUser: (updates: Partial<UserState>) => Promise<void>;
  activeGames: string[];
  addActiveGame: (id: string) => void;
  removeActiveGame: (id: string) => void;
  claimReward: (challengeId: number) => Promise<{ success: boolean; message: string; new_balance?: number }>;
  // Stats
  updateStats: (updates: Partial<PlayerStats>) => Promise<void>;
  recordHandPlayed: (won: boolean, potSize: number, handName?: string) => Promise<void>;
}

const defaultStats: PlayerStats = {
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
};

const defaultUser: UserState = {
  id: '',
  name: 'Guest Player',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  chips: 0,
  rank: 'Bronze',
  xp: 0,
  level: 1,
  stats: { ...defaultStats },
};

const GameContext = createContext<GameContextType | undefined>(undefined);

// ── Helper: get rank from XP ────────────────────────────────
function getRankFromXP(xp: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xpRequired) rank = r;
  }
  return rank;
}

function getLevelFromXP(xp: number) {
  return Math.floor(xp / 100) + 1;
}

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

    const currentRank = getRankFromXP(authUser.xp || 0);

    setUser({
      id: authUser.id,
      name: authUser.name,
      avatar: authUser.avatar,
      chips: authUser.balance || 0, // balance in DB maps to chips
      rank: currentRank.name,
      xp: authUser.xp || 0,
      level: getLevelFromXP(authUser.xp || 0),
      stats: authUser.stats || { ...defaultStats },
    });

    // Listen to transactions
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', authUser.id),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        txs.push({
          id: docSnap.id,
          type: data.type,
          amount: data.amount,
          description: data.description || data.method || '',
          status: data.status,
          created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString()
        });
      });
      setTransactions(txs);
    }, (error) => {
      console.warn('[GameContext] Transaction query failed:', error.message);
      setTransactions([]);
    });

    return () => unsubscribe();
  }, [authUser]);

  const updateProfileInDB = async (updates: any) => {
    if (!authUser?.id) return;
    const docRef = doc(db, 'profiles', authUser.id);
    await updateDoc(docRef, updates);
  };

  // ── Chip Operations ─────────────────────────────────────
  const addChips = async (amount: number, type: Transaction['type'], description: string) => {
    if (!authUser?.id) return;
    const newChips = user.chips + amount;

    await updateProfileInDB({ balance: newChips });
    await addDoc(collection(db, 'transactions'), {
      user_id: authUser.id,
      type,
      amount,
      description,
      status: 'completed',
      created_at: serverTimestamp()
    });

    setUser(prev => ({ ...prev, chips: newChips }));
  };

  const removeChips = async (amount: number, description: string) => {
    if (!authUser?.id) return;
    const newChips = Math.max(0, user.chips - amount);

    await updateProfileInDB({ balance: newChips });
    await addDoc(collection(db, 'transactions'), {
      user_id: authUser.id,
      type: 'poker_loss',
      amount: -amount,
      description,
      status: 'completed',
      created_at: serverTimestamp()
    });

    setUser(prev => ({ ...prev, chips: newChips }));
  };

  // ── Daily Bonus ──────────────────────────────────────────
  const canClaimDailyBonus = () => {
    if (!user.stats.last_daily_claim) return true;
    const lastClaim = new Date(user.stats.last_daily_claim);
    const now = new Date();
    const hoursSince = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  };

  const claimDailyBonus = async () => {
    if (!canClaimDailyBonus()) {
      return { success: false, amount: 0, message: 'Daily bonus already claimed! Come back tomorrow.' };
    }

    const rank = getRankFromXP(user.xp);
    const bonusAmount = Math.floor(DAILY_BONUS_BASE * rank.bonusMultiplier);

    const now = new Date().toISOString();
    const lastLogin = user.stats.last_login_date;
    const isConsecutive = lastLogin && (new Date().getTime() - new Date(lastLogin).getTime()) < 48 * 60 * 60 * 1000;
    const newStreak = isConsecutive ? (user.stats.login_streak || 0) + 1 : 1;

    // Streak bonus: +10% per consecutive day, max +100%
    const streakBonus = Math.min(newStreak * 0.1, 1.0);
    const totalBonus = Math.floor(bonusAmount * (1 + streakBonus));

    await addChips(totalBonus, 'daily_bonus', `Daily bonus (Day ${newStreak} streak)`);
    await updateStats({
      last_daily_claim: now,
      last_login_date: now,
      login_streak: newStreak,
    });

    return { success: true, amount: totalBonus, message: `You earned ${totalBonus.toLocaleString()} chips! 🎉 (Day ${newStreak} streak)` };
  };

  // ── XP & Ranking ─────────────────────────────────────────
  const addXP = async (amount: number) => {
    const newXP = user.xp + amount;
    const newRank = getRankFromXP(newXP);
    const newLevel = getLevelFromXP(newXP);

    await updateProfileInDB({ xp: newXP, rank: newRank.name, level: newLevel });
    setUser(prev => ({ ...prev, xp: newXP, rank: newRank.name, level: newLevel }));
  };

  const getRank = () => getRankFromXP(user.xp);
  const getNextRank = () => {
    const currentIdx = RANKS.findIndex(r => r.name === user.rank);
    return currentIdx < RANKS.length - 1 ? RANKS[currentIdx + 1] : null;
  };
  const getRankProgress = () => {
    const current = getRank();
    const next = getNextRank();
    if (!next) return 100;
    const progressXP = user.xp - current.xpRequired;
    const neededXP = next.xpRequired - current.xpRequired;
    return Math.min(100, Math.floor((progressXP / neededXP) * 100));
  };

  // ── Stats ─────────────────────────────────────────────────
  const updateStats = async (updates: Partial<PlayerStats>) => {
    const newStats = { ...user.stats, ...updates };
    await updateProfileInDB({ stats: newStats });
    setUser(prev => ({ ...prev, stats: newStats }));
  };

  const recordHandPlayed = async (won: boolean, potSize: number, handName?: string) => {
    const updates: Partial<PlayerStats> = {
      hands_played: (user.stats.hands_played || 0) + 1,
    };

    if (won) {
      updates.hands_won = (user.stats.hands_won || 0) + 1;
      updates.current_streak = (user.stats.current_streak || 0) + 1;
      updates.total_chips_won = (user.stats.total_chips_won || 0) + potSize;

      if (updates.current_streak! > (user.stats.win_streak || 0)) {
        updates.win_streak = updates.current_streak;
      }
      if (potSize > (user.stats.biggest_pot || 0)) {
        updates.biggest_pot = potSize;
      }
      if (handName) {
        updates.best_hand = handName;
      }

      // XP for winning
      await addXP(XP_REWARDS.HAND_WON);
    } else {
      updates.current_streak = 0;
      updates.total_chips_lost = (user.stats.total_chips_lost || 0) + potSize;
    }

    // XP for playing
    await addXP(XP_REWARDS.HAND_PLAYED);
    await updateStats(updates);
  };

  // ── Legacy Compat ─────────────────────────────────────────
  const updateBalance = async (amount: number) => {
    // In freemium, this sets the chip count directly (used by poker engine)
    const diff = amount - user.chips;
    if (diff > 0) {
      await addChips(diff, 'poker_win', 'Poker winnings');
    } else if (diff < 0) {
      await removeChips(Math.abs(diff), 'Poker loss');
    }
  };

  const updateUser = async (updates: Partial<UserState>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatar) dbUpdates.avatar = updates.avatar;
    if (updates.chips !== undefined) dbUpdates.balance = updates.chips;
    await updateProfileInDB(dbUpdates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  const addActiveGame = (id: string) => {
    setActiveGames(prev => prev.includes(id) ? prev : [...prev, id]);
  };
  const removeActiveGame = (id: string) => {
    setActiveGames(prev => prev.filter(gameId => gameId !== id));
  };

  const claimReward = async (challengeId: number) => {
    try {
      if (!authUser?.id) throw new Error('Not authenticated');
      const rewardAmount = 500;
      await addChips(rewardAmount, 'reward', `Challenge #${challengeId} completed`);
      return { success: true, message: 'Reward claimed!', new_balance: user.chips + rewardAmount };
    } catch (error: any) {
      console.error('Reward claim failed:', error);
      throw error;
    }
  };

  return (
    <GameContext.Provider value={{
      user,
      transactions,
      addChips,
      removeChips,
      claimDailyBonus,
      canClaimDailyBonus,
      addXP,
      getRank,
      getNextRank,
      getRankProgress,
      updateBalance,
      updateUser,
      updateStats,
      recordHandPlayed,
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
