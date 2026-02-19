import React, { useEffect } from 'react';
import { useSimulation } from '../contexts/SimulationContext';

const SimulationDashboard: React.FC = () => {
    const { stats, topBots, isRunning, startSimulation, stopSimulation } = useSimulation();

    useEffect(() => {
        // Auto-start simulation on mount
        startSimulation();
        return () => stopSimulation();
    }, []);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2">
                        🎮 Live Cash Game <span className="text-primary">Simulation</span>
                    </h1>
                    <p className="text-slate-400">
                        Real-time AI engine monitoring thousands of active hands
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={isRunning ? stopSimulation : startSimulation}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${isRunning
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isRunning ? '⏹️ Stop' : '▶️ Start'} Simulation
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    icon="smart_toy"
                    label="Active AI Bots"
                    value={stats.totalBots.toLocaleString()}
                    color="text-blue-400"
                />
                <StatCard
                    icon="payments"
                    label="Platform Profit"
                    value={`$${stats.houseProfit.toLocaleString()}`}
                    color="text-emerald-400"
                />
                <StatCard
                    icon="timeline"
                    label="System Health"
                    value="Stable"
                    color="text-primary"
                />
            </div>

            {/* Top Bots Leaderboard */}
            <div className="bg-surface rounded-2xl border border-border-dark p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold">leaderboard</span>
                    Top 20 AI Profiles
                </h2>

                <div className="space-y-2">
                    {topBots.map((bot, index) => (
                        <div
                            key={bot.id}
                            className="flex items-center gap-4 bg-background/50 p-4 rounded-lg hover:bg-background transition-colors"
                        >
                            <div className={`text-2xl font-black ${index === 0 ? 'text-gold' :
                                index === 1 ? 'text-slate-300' :
                                    index === 2 ? 'text-orange-600' :
                                        'text-slate-500'
                                }`}>
                                #{index + 1}
                            </div>
                            <img
                                src={bot.avatar}
                                alt={bot.name}
                                className="size-10 rounded-full border-2 border-primary"
                            />
                            <div className="flex-1">
                                <p className="text-white font-bold">{bot.name}</p>
                                <p className="text-xs text-slate-400">
                                    {bot.gamesPlayed?.toLocaleString() || 0} hands • {((bot.winRate || 0.5) * 100).toFixed(1)}% win rate
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gold font-bold">${bot.balance.toLocaleString()}</p>
                                <p className="text-xs text-slate-400">Cash Balance</p>
                            </div>
                        </div>
                    ))}

                    {topBots.length === 0 && (
                        <div className="text-center py-12 text-slate-500 italic">
                            Initializing leaderboard data...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: number | string; color: string }> = ({
    icon,
    label,
    value,
    color,
}) => (
    <div className="bg-surface border border-border-dark rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
            <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
);

export default SimulationDashboard;
