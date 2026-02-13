
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useSimulation } from '../contexts/SimulationContext';
import { useNotification } from '../contexts/NotificationContext';
import { generateBotName } from '../utils/nameGenerator';
import { useGame } from '../contexts/GameContext';

import { ActiveGamesSwitcher } from '../components/ActiveGamesSwitcher';

const TournamentLobby: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { tournaments: liveWorldTournaments, onlinePlayers, registerForTournament } = useLiveWorld();
    const { user, withdraw } = useGame();
    const { showAlert } = useNotification();
    const navigate = useNavigate();

    // Simplified: tournaments already come from LiveWorld (which are rows in the DB)
    const tournaments = liveWorldTournaments || [];

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN!
    // Check persistence
    const [myRegistrations, setMyRegistrations] = useState<string[]>(() => {
        const saved = localStorage.getItem('poker_tournament_registrations');
        return saved ? JSON.parse(saved) : [];
    });

    const [activeTab, setActiveTab] = useState<'home' | 'players' | 'tables'>('home');
    const [isNavigating, setIsNavigating] = useState(false);

    // Mock Players List - MUST be before early return
    const [mockPlayers] = useState(() => Array.from({ length: 50 }).map(() => ({
        name: generateBotName(),
        country: '🏳️',
        chips: 1000000 // Will be set properly once we find tournament
    })));

    // NOW we can safely check and return early
    const tournament = tournaments.find(t => t.id === id);

    if (!tournament) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>Tournament not found or finished.</p>
                <button onClick={() => navigate('/play')} className="mt-4 text-primary hover:underline">Back to Lobby</button>
            </div>
        );
    }

    const isRegistering = tournament.status === 'Registering' || tournament.status === 'Late Reg';
    const isRunning = tournament.status === 'Running' || tournament.status === 'Final Table';
    const isRegistered = myRegistrations.includes(tournament.id);

    const handleRegister = async () => {
        if (!tournament) return;
        if (user.balance < tournament.buyIn) {
            await showAlert("Insufficient funds to register!", "error", { title: "Registration Failed" });
            return;
        }

        const confirmed = await showAlert(`Register for ${tournament.name} for $${tournament.buyIn}?`, "info", {
            showCancel: true,
            confirmText: "Register",
            title: "Confirm Registration"
        });

        if (confirmed) {
            try {
                await withdraw(tournament.buyIn);
                await registerForTournament(tournament.id, user.id);

                // Persist
                const newRegs = [...myRegistrations, tournament.id];
                setMyRegistrations(newRegs);
                localStorage.setItem('poker_tournament_registrations', JSON.stringify(newRegs));
                await showAlert("Successfully registered! Good luck!", "success", { title: "Registration Complete" });
            } catch (err: any) {
                console.error('Registration error:', err);
                await showAlert("Failed to register. Please try again.", "error", { title: "Error" });
            }
        }
    };

    const handleObserve = () => {
        setIsNavigating(true);
        setTimeout(() => {
            navigate(`/table/${tournament.id}?observe=true`);
        }, 300);
    };

    const handleGoToTable = () => {
        setIsNavigating(true);
        // Small delay to show loading state
        setTimeout(() => {
            navigate(`/table/${tournament.id}`);
        }, 300);
    };

    return (
        <div className="flex flex-col md:flex-row h-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50">
                {/* Header */}
                <div className="p-4 md:p-8 border-b border-white/5 bg-surface/20 backdrop-blur-md">
                    <button onClick={() => navigate('/play')} className="mb-4 text-slate-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <span className="material-symbols-outlined text-base">arrow_back</span> Voltar ao Lobby
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest border ${isRegistering ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    isRunning ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                    }`}>
                                    {tournament.status}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{tournament.gameType}</span>
                            </div>
                            <h1 className="text-2xl md:text-5xl font-black text-white font-display tracking-tighter uppercase italic">{tournament.name}</h1>
                            <p className="text-slate-500 text-[10px] font-mono mt-1 opacity-60">ID: {tournament.id.substring(0, 12)}</p>
                        </div>

                        <div className="text-left md:text-right bg-gold/5 p-4 rounded-2xl border border-gold/10 w-full md:w-auto">
                            <div className="text-2xl md:text-4xl font-black text-gold font-mono tracking-tighter">${tournament.prizePool.toLocaleString()}</div>
                            <div className="text-[10px] font-black text-gold/60 uppercase tracking-widest">
                                {tournament.type === 'sitgo' || tournament.type === 'spingo' ? 'Prêmio Máximo' : 'Prize Pool Garantido'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 px-4 md:px-8 bg-surface/30 backdrop-blur-sm overflow-x-auto scrollbar-hide">
                    {(['home', 'players', 'tables'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 md:px-6 py-4 text-[10px] md:text-sm font-black border-b-2 transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === tab
                                ? 'border-primary text-white shadow-inner bg-primary/5'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {tab === 'home' ? 'Resumo' : tab === 'players' ? 'Jogadores' : 'Mesas'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background">
                    {activeTab === 'home' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">info</span> Tournament Info
                                    </h3>
                                    <div className="bg-surface border border-border-dark rounded-xl p-6 space-y-4">
                                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                                            <span className="text-slate-400">Buy-in</span>
                                            <span className="text-white font-bold">${tournament.buyIn}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                                            <span className="text-slate-400">Starting Chips</span>
                                            <span className="text-white font-bold">10,000</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border-dark/50">
                                            <span className="text-slate-400">Blinds Increase</span>
                                            <span className="text-white font-bold">Every 10 mins</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-slate-400">Re-entry</span>
                                            <span className="text-white font-bold">Unlimited (First 2h)</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gold">emoji_events</span> Payouts
                                    </h3>
                                    <div className="bg-surface border border-border-dark rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-black/20 text-slate-400 font-bold">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Place</th>
                                                    <th className="px-4 py-3 text-right">Prize</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-dark/50">
                                                <tr>
                                                    <td className="px-4 py-3 text-gold font-bold">1st</td>
                                                    <td className="px-4 py-3 text-right text-white font-bold">${(tournament.prizePool * 0.3).toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 text-slate-300">2nd</td>
                                                    <td className="px-4 py-3 text-right text-slate-300">${(tournament.prizePool * 0.18).toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 text-slate-300">3rd</td>
                                                    <td className="px-4 py-3 text-right text-slate-300">${(tournament.prizePool * 0.12).toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 text-slate-500">4th-9th</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">${(tournament.prizePool * 0.05).toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'players' && (
                        <div className="bg-surface border border-border-dark rounded-xl overflow-hidden max-w-3xl">
                            <table className="w-full text-sm">
                                <thead className="bg-black/20 text-slate-400 font-bold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Player</th>
                                        <th className="px-6 py-4 text-left">Country</th>
                                        <th className="px-6 py-4 text-right">Chips</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-dark/50">
                                    {/* Real User if registered */}
                                    <tr className="bg-primary/10">
                                        <td className="px-6 py-3 font-bold text-white flex items-center gap-2">
                                            <img src={user.avatar} className="size-6 rounded-full" />
                                            {user.name} <span className="text-[10px] bg-primary text-white px-1 rounded ml-2">YOU</span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-300">🇺🇸</td>
                                        <td className="px-6 py-3 text-right text-gold font-mono font-bold">10,000</td>
                                    </tr>
                                    {/* Mock Bots */}
                                    {mockPlayers.map((p, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-300">{p.name}</td>
                                            <td className="px-6 py-3 text-slate-500">{p.country}</td>
                                            <td className="px-6 py-3 text-right text-slate-400 font-mono">{p.chips.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'tables' && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <span className="material-symbols-outlined text-5xl text-blue-500 opacity-50">table_restaurant</span>
                            <div className="text-center">
                                <h4 className="text-white font-bold mb-1">Table #1</h4>
                                <p className="text-sm text-slate-500 mb-4">View the action at the feature table.</p>
                                <button
                                    onClick={handleObserve}
                                    className="px-6 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold rounded-lg hover:bg-blue-600/30 transition-all uppercase tracking-widest text-xs"
                                >
                                    Observe Table
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar / Action Panel */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-surface/10 p-4 md:p-6 flex flex-col gap-6 md:gap-8 overflow-y-auto custom-scrollbar">
                {/* Active Games Switcher inside the tournament lobby panel for easy switching */}
                <div className="md:hidden pt-2">
                    <ActiveGamesSwitcher />
                    <div className="h-px bg-white/5 my-6"></div>
                </div>

                <div>
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Seu Status</h2>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center shadow-inner">
                        <div className={`text-sm font-black uppercase tracking-tighter mb-1 ${isRegistered ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isRegistered ? 'Inscrito' : 'Não Inscrito'}
                        </div>
                        <div className="text-white text-lg font-black font-mono tracking-tighter">${user.balance.toLocaleString()}</div>
                    </div>
                </div>

                {isRegistered ? (
                    <div className="space-y-3">
                        <button className="w-full py-4 bg-green-500/10 border border-green-500 text-green-500 font-black rounded-xl cursor-default flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span> REGISTERED</div>
                        </button>
                        <button
                            onClick={handleGoToTable}
                            disabled={isNavigating}
                            className="w-full py-4 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 animate-pulse"
                        >
                            {isNavigating ? (
                                <>
                                    <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    LOADING...
                                </>
                            ) : (
                                <>
                                    GO TO TABLE <span className="material-symbols-outlined">login</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : isRegistering ? (
                    <button
                        onClick={handleRegister}
                        className="w-full py-4 bg-poker-green hover:bg-green-500 text-white font-black rounded-xl shadow-lg shadow-poker-green/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        REGISTER NOW <span className="block text-xs font-normal opacity-80 mt-1">${tournament.buyIn} Buy-in</span>
                    </button>
                ) : (
                    <button
                        onClick={handleObserve}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg transition-all"
                    >
                        OBSERVE TABLES
                    </button>
                )}

                <div className="space-y-4 pt-6 border-t border-border-dark">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Entrants</span>
                        <span className="text-white font-bold">{tournament.players} / {tournament.maxPlayers}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-poker-green h-full" style={{ width: `${(tournament.players / tournament.maxPlayers) * 100}%` }}></div>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Start Time</span>
                        <span className="text-white font-bold">{tournament.startTime}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TournamentLobby;
