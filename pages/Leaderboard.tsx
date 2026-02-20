import React, { useState, useEffect } from 'react';
import { useGame, RANKS } from '../contexts/GameContext';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface LeaderboardPlayer {
    id: string;
    name: string;
    avatar: string;
    chips: number;
    xp: number;
    rank: string;
    level: number;
    stats: any;
}

const Leaderboard: React.FC = () => {
    const { user: currentUser } = useGame();
    const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'chips' | 'xp' | 'winrate'>('chips');
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'profiles'), orderBy('balance', 'desc'), limit(50));
                const snap = await getDocs(q);
                const list: LeaderboardPlayer[] = [];
                snap.forEach(doc => {
                    const d = doc.data();
                    list.push({
                        id: doc.id,
                        name: d.name || 'Unknown',
                        avatar: d.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
                        chips: d.balance || 0,
                        xp: d.xp || 0,
                        rank: d.rank || 'Bronze',
                        level: d.level || 1,
                        stats: d.stats || { hands_played: 0, hands_won: 0 },
                    });
                });
                setPlayers(list);
            } catch (err) {
                console.warn('[Leaderboard] Failed to fetch:', err);
                // Fallback with mock data including current user
                const mockPlayers: LeaderboardPlayer[] = [
                    { id: currentUser.id || '1', name: currentUser.name, avatar: currentUser.avatar, chips: currentUser.chips, xp: currentUser.xp, rank: currentUser.rank, level: currentUser.level, stats: currentUser.stats },
                    { id: 'bot_1', name: 'AceKing99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AceKing', chips: 85000, xp: 12000, rank: 'Gold', level: 25, stats: { hands_played: 450, hands_won: 180 } },
                    { id: 'bot_2', name: 'PokerShark', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shark', chips: 72000, xp: 9500, rank: 'Gold', level: 20, stats: { hands_played: 380, hands_won: 150 } },
                    { id: 'bot_3', name: 'BluffMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bluff', chips: 58000, xp: 7200, rank: 'Silver', level: 15, stats: { hands_played: 290, hands_won: 110 } },
                    { id: 'bot_4', name: 'RiverRat', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=River', chips: 45000, xp: 5800, rank: 'Silver', level: 12, stats: { hands_played: 220, hands_won: 85 } },
                    { id: 'bot_5', name: 'FlopHero', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flop', chips: 32000, xp: 3200, rank: 'Silver', level: 8, stats: { hands_played: 150, hands_won: 55 } },
                    { id: 'bot_6', name: 'NitPicker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nit', chips: 21000, xp: 1800, rank: 'Silver', level: 5, stats: { hands_played: 100, hands_won: 40 } },
                    { id: 'bot_7', name: 'ChipLeader', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chip', chips: 15000, xp: 800, rank: 'Bronze', level: 3, stats: { hands_played: 60, hands_won: 20 } },
                ];
                setPlayers(mockPlayers);
            }
            setLoading(false);
        };
        fetchPlayers();
    }, [timeFilter]);

    const sortedPlayers = [...players].sort((a, b) => {
        if (sortBy === 'chips') return b.chips - a.chips;
        if (sortBy === 'xp') return b.xp - a.xp;
        const aRate = a.stats?.hands_played > 0 ? a.stats.hands_won / a.stats.hands_played : 0;
        const bRate = b.stats?.hands_played > 0 ? b.stats.hands_won / b.stats.hands_played : 0;
        return bRate - aRate;
    });

    const getRankInfo = (rankName: string) => RANKS.find(r => r.name === rankName) || RANKS[0];
    const getWinRate = (p: LeaderboardPlayer) => p.stats?.hands_played > 0 ? Math.round((p.stats.hands_won / p.stats.hands_played) * 100) : 0;

    const myPosition = sortedPlayers.findIndex(p => p.id === currentUser.id) + 1;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Leaderboard</h2>
                    <p className="text-slate-400 text-sm">Compete for the top spot and earn bragging rights!</p>
                </div>
                <div className="flex gap-2">
                    {(['all', 'month', 'week'] as const).map(tf => (
                        <button key={tf} onClick={() => setTimeFilter(tf)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase ${timeFilter === tf ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                            {tf === 'all' ? 'All Time' : tf === 'month' ? 'This Month' : 'This Week'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort tabs */}
            <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border-dark w-fit">
                {([
                    { key: 'chips', label: 'By Chips', icon: 'toll' },
                    { key: 'xp', label: 'By XP', icon: 'star' },
                    { key: 'winrate', label: 'By Win Rate', icon: 'trending_up' },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setSortBy(tab.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === tab.key ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Top 3 Podium */}
            {sortedPlayers.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {[1, 0, 2].map(idx => {
                        const p = sortedPlayers[idx];
                        const rank = getRankInfo(p.rank);
                        const isCenter = idx === 0;
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                            <div key={p.id} className={`flex flex-col items-center p-4 md:p-6 rounded-2xl border transition-all ${isCenter
                                    ? 'bg-gradient-to-b from-gold/10 to-transparent border-gold/30 ring-1 ring-gold/20 md:-mt-4'
                                    : 'bg-surface border-border-dark'
                                } ${p.id === currentUser.id ? 'ring-2 ring-primary' : ''}`}>
                                <span className="text-2xl md:text-3xl mb-2">{medals[idx === 0 ? 0 : idx === 1 ? 1 : 2]}</span>
                                <img src={p.avatar} alt={p.name} className="size-12 md:size-16 rounded-full border-2 mb-2" style={{ borderColor: rank.color }} />
                                <p className="text-white font-bold text-sm md:text-base truncate w-full text-center">{p.name}</p>
                                <span className="text-xs" style={{ color: rank.color }}>{rank.icon} {rank.name}</span>
                                <p className="text-gold font-black text-lg md:text-xl mt-1">
                                    {sortBy === 'chips' ? p.chips.toLocaleString() : sortBy === 'xp' ? `${p.xp.toLocaleString()} XP` : `${getWinRate(p)}%`}
                                </p>
                                {p.id === currentUser.id && <span className="text-[8px] font-black text-primary uppercase mt-1">You</span>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Your Position */}
            {myPosition > 0 && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-black text-lg">#{myPosition}</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-bold">Your Position</p>
                        <p className="text-slate-400 text-xs">
                            {sortBy === 'chips' ? `${currentUser.chips.toLocaleString()} chips` : sortBy === 'xp' ? `${currentUser.xp.toLocaleString()} XP` : `${getWinRate({ ...currentUser, stats: currentUser.stats } as any)}% win rate`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-gold font-black">{getRankInfo(currentUser.rank).icon} {currentUser.rank}</p>
                        <p className="text-slate-400 text-xs">Level {currentUser.level}</p>
                    </div>
                </div>
            )}

            {/* Full Ranking Table */}
            <div className="bg-surface border border-border-dark rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-dark text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="py-3 px-4 text-left">#</th>
                                <th className="py-3 px-4 text-left">Player</th>
                                <th className="py-3 px-4 text-right">Chips</th>
                                <th className="py-3 px-4 text-right hidden md:table-cell">XP</th>
                                <th className="py-3 px-4 text-right hidden md:table-cell">Win Rate</th>
                                <th className="py-3 px-4 text-center">Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading leaderboard...</td></tr>
                            ) : (
                                sortedPlayers.map((p, i) => {
                                    const rank = getRankInfo(p.rank);
                                    const isMe = p.id === currentUser.id;
                                    return (
                                        <tr key={p.id} className={`border-b border-border-dark/50 transition-colors ${isMe ? 'bg-primary/5' : 'hover:bg-white/2'}`}>
                                            <td className="py-3 px-4">
                                                <span className={`font-black text-sm ${i < 3 ? 'text-gold' : 'text-slate-500'}`}>
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.avatar} alt={p.name} className="size-8 rounded-full border" style={{ borderColor: rank.color }} />
                                                    <div>
                                                        <p className={`font-bold text-sm ${isMe ? 'text-primary' : 'text-white'}`}>{p.name} {isMe && <span className="text-[8px] text-primary">(You)</span>}</p>
                                                        <p className="text-[10px] text-slate-500 hidden sm:block">Level {p.level}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-gold font-bold text-sm">{p.chips.toLocaleString()}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right hidden md:table-cell">
                                                <span className="text-white font-mono text-sm">{p.xp.toLocaleString()}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right hidden md:table-cell">
                                                <span className={`font-bold text-sm ${getWinRate(p) >= 50 ? 'text-emerald-400' : 'text-slate-400'}`}>{getWinRate(p)}%</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-sm" title={rank.name}>{rank.icon}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
