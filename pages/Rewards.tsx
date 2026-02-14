import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

const Rewards: React.FC = () => {
    const { user, updateBalance } = useGame();

    // Mock Data for Challenges
    const [challenges, setChallenges] = useState([
        { id: 1, title: "Win 5 Hands at Showdown", reward: 500, progress: 3, target: 5, claimed: false },
        { id: 2, title: "Play 50 Hands", reward: 200, progress: 50, target: 50, claimed: false },
        { id: 3, title: "Knock out a player in a Tournament", reward: 1000, progress: 0, target: 1, claimed: false },
    ]);

    const [chests, setChests] = useState([
        { id: 1, type: 'Bronze', status: 'ready', reward: '$50 - $200' },
        { id: 2, type: 'Silver', status: 'locked', reward: '$200 - $1,000' },
        { id: 3, type: 'Gold', status: 'locked', reward: '$1,000 - $10,000' },
    ]);

    const handleClaim = (id: number, reward: number) => {
        setChallenges(prev => prev.map(c => c.id === id ? { ...c, claimed: true } : c));
        updateBalance(reward);
    };

    const [openedChest, setOpenedChest] = useState<number | null>(null);

    const handleOpenChest = (id: number) => {
        setOpenedChest(id);
        const chest = chests.find(c => c.id === id);
        if (chest) {
            // Random reward based on type
            let rewardAmount = 0;
            if (chest.type === 'Bronze') rewardAmount = Math.floor(Math.random() * 150) + 50;
            if (chest.type === 'Silver') rewardAmount = Math.floor(Math.random() * 800) + 200;
            if (chest.type === 'Gold') rewardAmount = Math.floor(Math.random() * 9000) + 1000;

            updateBalance(rewardAmount);
            setChests(prev => prev.map(c => c.id === id ? { ...c, status: 'opened', reward: `WON $${rewardAmount}` } : c));
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-y-auto custom-scrollbar">
            <header className="px-8 py-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                    Player <span className="text-gold">Rewards</span>
                </h1>
                <p className="text-slate-400 font-bold max-w-2xl">
                    Earn points by playing and unlock exclusive benefits, cash rewards, and tournament tickets.
                </p>
            </header>

            <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">

                {/* VIP Status Card */}
                <section className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-gold shadow-[0_0_30px_rgba(255,215,0,0.3)] flex items-center justify-center bg-slate-900">
                                <span className="material-symbols-outlined text-6xl text-gold">military_tech</span>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gold text-black font-black px-3 py-1 rounded shadow-lg text-xs uppercase tracking-wider whitespace-nowrap">
                                {user.rank}
                            </div>
                        </div>

                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-2xl font-bold text-white">Current Status</h3>
                                <span className="text-primary font-bold">1,250 / 2,000 XP</span>
                            </div>
                            <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-4 border border-slate-600">
                                <div className="h-full bg-gradient-to-r from-gold to-orange-500 w-[62%] relative">
                                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">
                                Earn <span className="text-white font-bold">750 XP</span> to reach <span className="text-blue-400 font-bold">Platinum</span> rank and unlock <span className="text-green-400 font-bold">25% Rakeback</span>.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Daily Challenges */}
                    <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined text-poker-green">task_alt</span>
                                Daily Missions
                            </h2>
                            <span className="text-xs font-bold bg-slate-700 px-2 py-1 rounded text-slate-300">Resets in 04:32:10</span>
                        </div>

                        <div className="space-y-4">
                            {challenges.map(challenge => (
                                <div key={challenge.id} className="bg-slate-700/30 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-200 mb-1">{challenge.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[150px]">
                                                <div
                                                    className="h-full bg-poker-green transition-all duration-500"
                                                    style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-mono text-slate-400">{challenge.progress}/{challenge.target}</span>
                                        </div>
                                    </div>
                                    <div>
                                        {challenge.claimed ? (
                                            <button disabled className="px-4 py-2 bg-slate-700 text-slate-500 font-bold rounded-lg text-xs flex items-center gap-1 cursor-default">
                                                <span className="material-symbols-outlined text-sm">check</span> CLAIMED
                                            </button>
                                        ) : challenge.progress >= challenge.target ? (
                                            <button
                                                onClick={() => handleClaim(challenge.id, challenge.reward)}
                                                className="px-4 py-2 bg-poker-green hover:bg-green-600 text-white font-bold rounded-lg text-xs shadow-lg shadow-green-900/20 animate-bounce-short"
                                            >
                                                CLAIM {challenge.reward}
                                            </button>
                                        ) : (
                                            <div className="px-4 py-2 text-slate-500 font-bold text-xs flex flex-col items-center">
                                                <span className="text-gold">+{challenge.reward} Pts</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Treasure Chests */}
                    <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined text-gold">redeem</span>
                                Loot Chests
                            </h2>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {chests.map(chest => (
                                <div key={chest.id} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-3 text-center transition-all ${chest.status === 'locked' ? 'border-slate-700 bg-slate-800/50 opacity-60' :
                                    chest.status === 'opened' ? 'border-slate-700 bg-slate-800/50' :
                                        'border-gold/50 bg-gold/10 hover:bg-gold/20 cursor-pointer hover:scale-105'
                                    }`}>
                                    {chest.status === 'ready' && <div className="absolute -top-2 -right-2 size-4 bg-red-500 rounded-full animate-ping"></div>}

                                    <div className={`p-4 rounded-full bg-slate-900 shadow-inner ${chest.status === 'ready' ? 'animate-wiggle' : ''}`}>
                                        <span className={`material-symbols-outlined text-4xl ${chest.type === 'Bronze' ? 'text-orange-400' :
                                            chest.type === 'Silver' ? 'text-slate-300' :
                                                'text-yellow-400'
                                            }`}>
                                            {chest.status === 'opened' ? 'drafts' : 'lock'}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className={`font-bold text-sm ${chest.type === 'Bronze' ? 'text-orange-400' :
                                            chest.type === 'Silver' ? 'text-slate-300' :
                                                'text-yellow-400'
                                            }`}>{chest.type} Chest</h4>
                                        <p className="text-[10px] text-slate-400 mt-1">{chest.reward}</p>
                                    </div>

                                    {chest.status === 'ready' && (
                                        <button
                                            onClick={() => handleOpenChest(chest.id)}
                                            className="w-full py-1.5 bg-gold hover:bg-yellow-400 text-black font-bold text-xs rounded shadow-lg mt-2"
                                        >
                                            OPEN
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {openedChest && (
                            <div className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-dashed border-slate-600 text-center">
                                <p className="text-xs text-slate-400">Next Chest at <span className="text-white font-bold">1,500 XP</span></p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Rewards;
