import React, { useEffect } from 'react';
import { useSimulation } from '../contexts/SimulationContext';

const SimulationDashboard: React.FC = () => {
    const { stats, tournaments, topBots, isRunning, startSimulation, stopSimulation } = useSimulation();

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
                        🎮 Live Tournament <span className="text-primary">Simulation</span>
                    </h1>
                    <p className="text-slate-400">
                        Real-time simulation system with thousands of bots
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    icon="smart_toy"
                    label="Total Bots"
                    value={stats.totalBots.toLocaleString()}
                    color="text-blue-400"
                />
                <StatCard
                    icon="emoji_events"
                    label="Active Tournaments"
                    value={stats.totalTournaments}
                    color="text-gold"
                />
                <StatCard
                    icon="app_registration"
                    label="Registering"
                    value={stats.registeringTournaments}
                    color="text-green-400"
                />
                <StatCard
                    icon="play_circle"
                    label="Running"
                    value={stats.runningTournaments}
                    color="text-primary"
                />
                <StatCard
                    icon="check_circle"
                    label="Finished"
                    value={stats.finishedTournaments}
                    color="text-slate-400"
                />
                <StatCard
                    icon="groups"
                    label="Active Players"
                    value={stats.totalPlayersInTournaments.toLocaleString()}
                    color="text-purple-400"
                />
            </div>

            {/* Live Tournaments */}
            <div className="bg-surface rounded-2xl border border-border-dark p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">live_tv</span>
                    Live Tournaments
                    <span className="ml-auto text-sm font-normal text-slate-400">
                        Real-time updates
                    </span>
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {tournaments.slice(0, 10).map(tournament => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>

                {tournaments.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
                            hourglass_empty
                        </span>
                        <p>Waiting for tournaments...</p>
                    </div>
                )}
            </div>

            {/* Top Bots Leaderboard */}
            <div className="bg-surface rounded-2xl border border-border-dark p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold">leaderboard</span>
                    Top 20 Bots
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
                                    {bot.gamesPlayed.toLocaleString()} games • {(bot.winRate * 100).toFixed(1)}% win rate
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gold font-bold">🏆 {bot.tournamentsWon}</p>
                                <p className="text-xs text-slate-400">${bot.balance.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
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
    <div className="bg-surface border border-border-dark rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
            <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
);

const TournamentCard: React.FC<{ tournament: any }> = ({ tournament }) => {
    const statusColors = {
        registering: 'bg-green-500/10 text-green-400 border-green-500/20',
        running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        finished: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    return (
        <div className="bg-background/50 border border-border-dark rounded-xl p-4 hover:bg-background transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-white font-bold mb-1">{tournament.name}</h3>
                    <p className="text-xs text-slate-400">Buy-in: ${tournament.buyIn}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColors[tournament.status]}`}>
                    {tournament.status === 'registering' ? '📝 Registering' :
                        tournament.status === 'running' ? '▶️ Running' :
                            '✅ Finished'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface/50 rounded p-2">
                    <p className="text-xs text-slate-400">Players</p>
                    <p className="text-lg font-bold text-white">{tournament.players.length}/{tournament.maxPlayers}</p>
                </div>
                <div className="bg-surface/50 rounded p-2">
                    <p className="text-xs text-slate-400">Prize Pool</p>
                    <p className="text-lg font-bold text-gold">${tournament.prizePool.toLocaleString()}</p>
                </div>
                <div className="bg-surface/50 rounded p-2">
                    <p className="text-xs text-slate-400">Blind Level</p>
                    <p className="text-lg font-bold text-primary">{tournament.blindLevel}</p>
                </div>
            </div>

            {tournament.winner && (
                <div className="mt-3 bg-gold/10 border border-gold/20 rounded p-2 flex items-center gap-2">
                    <span className="text-gold">🏆</span>
                    <span className="text-sm font-bold text-white">{tournament.winner.name}</span>
                </div>
            )}
        </div>
    );
};

export default SimulationDashboard;
