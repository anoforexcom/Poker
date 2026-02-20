import React, { useState, useEffect } from 'react';
import { useGame, RANKS } from '../contexts/GameContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Rewards: React.FC = () => {
    const { user, claimReward, getRank, getRankProgress, getNextRank } = useGame();
    const [challenges, setChallenges] = useState<any[]>([
        { id: 1, title: 'Play 5 Hands', progress: 2, target: 5, reward: 500, claimed: false },
        { id: 2, title: 'Win 1 Hand', progress: 0, target: 1, reward: 1000, claimed: false },
        { id: 3, title: 'Go All-In', progress: 1, target: 1, reward: 1500, claimed: true },
        { id: 4, title: 'Reach Level 5', progress: 3, target: 5, reward: 5000, claimed: false },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchChallenges = async () => {
        if (!user || !user.id) return;
        setIsLoading(true);
        // Placeholder for real backend sync in the future
        // Keeping the hardcoded ones for now to show the freemium beauty
        setIsLoading(false);
    };

    useEffect(() => {
        fetchChallenges();
    }, [user?.id]);

    const handleClaim = async (id: number) => {
        try {
            const result = await claimReward(id);
            if (result.success) {
                setChallenges(prev => prev.map(c => c.id === id ? { ...c, claimed: true } : c));
            }
        } catch (err) {
            console.error('Failed to claim reward:', err);
        }
    };

    const [chests, setChests] = useState([
        { id: 1, type: 'Bronze', status: 'ready', reward: '500 - 2,000 Chips' },
        { id: 2, type: 'Silver', status: 'locked', reward: '2,000 - 10,000 Chips' },
        { id: 3, type: 'Gold', status: 'locked', reward: '10,000 - 100,000 Chips' },
    ]);

    const [openedChest, setOpenedChest] = useState<number | null>(null);

    const handleOpenChest = (id: number) => {
        setOpenedChest(id);
        const chest = chests.find(c => c.id === id);
        if (chest) {
            let rewardAmount = Math.floor(Math.random() * 1500) + 500;
            setChests(prev => prev.map(c => c.id === id ? { ...c, status: 'opened', reward: `WON ${rewardAmount.toLocaleString()} CHIPS` } : c));
        }
    };

    const currentRank = getRank();
    const nextRank = getNextRank();
    const progress = getRankProgress();

    return (
        <div className="flex h-full flex-col overflow-y-auto custom-scrollbar p-4 md:p-8">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    Player <span className="text-gold">Rewards</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Complete missions and open chests to earn virtual chips and XP.
                </p>
            </header>

            <div className="space-y-8 max-w-6xl mx-auto w-full">

                {/* Rank & XP Focus Card */}
                <section className="bg-surface border border-border-dark rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative">
                            <div className="size-24 md:size-32 rounded-full border-4 flex items-center justify-center bg-slate-900 shadow-lg" style={{ borderColor: currentRank.color }}>
                                <span className="text-5xl md:text-6xl">{currentRank.icon}</span>
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl" style={{ backgroundColor: currentRank.color }}>
                                {user.rank}
                            </div>
                        </div>

                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">Current Standing</h3>
                                <span className="text-primary font-black font-mono">{user.xp.toLocaleString()} XP</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden mb-4 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                                Level <span className="text-white font-black">{user.level}</span>
                                {nextRank ? (
                                    <> • <span className="text-white font-bold">{(nextRank.xpRequired - user.xp).toLocaleString()} XP</span> to reach <span className="font-bold" style={{ color: nextRank.color }}>{nextRank.name} {nextRank.icon}</span></>
                                ) : (
                                    <> • <span className="text-gold font-bold">LEGENDARY STATUS REACHED!</span></>
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Daily Missions */}
                    <section className="bg-surface rounded-2xl border border-border-dark p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-white uppercase flex items-center gap-2 tracking-tight">
                                <span className="material-symbols-outlined text-emerald-400">task_alt</span>
                                Daily Missions
                            </h2>
                            <span className="text-[10px] font-black text-slate-500 uppercase bg-white/5 px-2 py-1 rounded">Resets daily</span>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs text-slate-500 font-black uppercase italic">Syncing...</p>
                                </div>
                            ) : challenges.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <p className="text-sm font-bold opacity-50">No active missions.</p>
                                </div>
                            ) : (
                                challenges.map(challenge => (
                                    <div key={challenge.id} className="bg-white/2 p-4 rounded-xl border border-border-dark flex justify-between items-center transition-all hover:border-slate-700">
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm text-slate-200 mb-1">{challenge.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[150px]">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500">{challenge.progress}/{challenge.target}</span>
                                            </div>
                                        </div>
                                        <div className="pl-4">
                                            {challenge.claimed ? (
                                                <div className="px-3 py-1.5 bg-slate-800 text-slate-500 font-black rounded-lg text-[10px] uppercase flex items-center gap-1 opacity-50">
                                                    <span className="material-symbols-outlined text-xs">done_all</span> CLAIMED
                                                </div>
                                            ) : challenge.progress >= challenge.target ? (
                                                <button
                                                    onClick={() => handleClaim(challenge.id)}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                >
                                                    CLAIM {challenge.reward} 🪙
                                                </button>
                                            ) : (
                                                <div className="px-3 py-1.5 bg-white/5 rounded-lg text-gold font-black text-[10px] uppercase text-center border border-white/5">
                                                    +{challenge.reward} XP
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Treasure Chests */}
                    <section className="bg-surface rounded-2xl border border-border-dark p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-white uppercase flex items-center gap-2 tracking-tight">
                                <span className="material-symbols-outlined text-gold">redeem</span>
                                Loot Chests
                            </h2>
                        </div>

                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            {chests.map(chest => (
                                <div key={chest.id} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${chest.status === 'locked' ? 'border-slate-800 bg-slate-900/50 opacity-40 grayscale' :
                                    chest.status === 'opened' ? 'border-slate-800 bg-slate-900/50' :
                                        'border-gold/30 bg-gold/5 hover:bg-gold/10 cursor-pointer hover:scale-105'
                                    }`}>

                                    <div className={`p-4 rounded-full bg-slate-800 shadow-inner ${chest.status === 'ready' ? 'animate-wiggle' : ''}`}>
                                        <span className={`material-symbols-outlined text-3xl md:text-4xl ${chest.type === 'Bronze' ? 'text-orange-400' :
                                            chest.type === 'Silver' ? 'text-slate-300' :
                                                'text-yellow-400'
                                            }`}>
                                            {chest.status === 'opened' ? 'drafts' : 'lock'}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className={`font-black text-[10px] uppercase tracking-tighter ${chest.type === 'Bronze' ? 'text-orange-400' :
                                            chest.type === 'Silver' ? 'text-slate-300' :
                                                'text-yellow-400'
                                            }`}>{chest.type}</h4>
                                        <p className="text-[8px] text-slate-500 mt-0.5 leading-tight">{chest.reward}</p>
                                    </div>

                                    {chest.status === 'ready' && (
                                        <button
                                            onClick={() => handleOpenChest(chest.id)}
                                            className="w-full py-1.5 bg-gold hover:bg-yellow-400 text-black font-black text-[10px] uppercase rounded shadow-lg mt-1 active:scale-95 transition-all"
                                        >
                                            OPEN
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {openedChest && (
                            <div className="mt-6 p-4 bg-white/2 rounded-xl border border-dashed border-white/10 text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-black">Next Milestone</p>
                                <p className="text-xs text-white mt-1">Unlock next chest at <span className="text-gold font-bold">{(user.level + 1) * 2000} XP</span></p>
                            </div>
                        )}

                        {!openedChest && (
                            <div className="mt-6 p-4 bg-white/2 rounded-xl border border-border-dark text-slate-500 text-xs italic text-center">
                                Play more games to earn XP and unlock higher tier chests!
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Rewards;
