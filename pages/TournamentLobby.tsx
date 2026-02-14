

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useGame } from '../contexts/GameContext';
import { useNotification } from '../contexts/NotificationContext';
import { ActiveGamesSwitcher } from '../components/ActiveGamesSwitcher';
import { supabase } from '../utils/supabase';

const TournamentLobby: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { tournaments, registerForTournament } = useLiveWorld();
    const { user } = useGame();
    const { showAlert } = useNotification();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'players' | 'tables'>('home');
    const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Sync tournament from LiveWorld list
    useEffect(() => {
        if (tournaments && id) {
            const found = tournaments.find(t => t.id === id);
            setTournament(found || null);
        }
    }, [tournaments, id]);

    // Fetch players
    useEffect(() => {
        if (!tournament?.id) return;

        const fetchLobbyPlayers = async () => {
            const { data } = await supabase
                .from('tournament_participants')
                .select(`
                    bot_id, user_id,
                    bots(name),
                    profiles(name)
                `)
                .eq('tournament_id', tournament.id)
                .eq('status', 'active');

            if (data) {
                const mapped = data.map((p: any) => {
                    const isBot = !!p.bot_id;
                    const name = isBot ? (p.bots?.name || 'Bot') : (p.profiles?.name || 'Player');
                    const playerId = p.bot_id || p.user_id;

                    // Deterministic flag
                    const flags = ['🇺🇸', '🇬🇧', '🇨🇦', '🇩🇪', '🇫🇷', '🇧🇷', '🇦🇷', '🇪🇸', '🇮🇹', '🇯🇵'];
                    let hash = 0;
                    for (let i = 0; i < playerId.length; i++) hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
                    const country = flags[Math.abs(hash) % flags.length];

                    return {
                        id: playerId,
                        name,
                        isBot,
                        country,
                        chips: tournament.startingStack || 10000
                    };
                });
                setLobbyPlayers(mapped);
            }
        };

        fetchLobbyPlayers();
        const interval = setInterval(fetchLobbyPlayers, 5000);
        return () => clearInterval(interval);
    }, [tournament?.id]);

    // Timer logic
    useEffect(() => {
        if (!tournament || tournament.status !== 'Registering') return;

        const timer = setInterval(() => {
            // Simple parsing for "HH:MM" format
            // Assumes tournament.startTime is like "14:00" or "Now"
            if (tournament.startTime === 'Now') {
                setTimeLeft('Starting...');
                return;
            }

            const [hours, minutes] = tournament.startTime.split(':').map(Number);
            const now = new Date();
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);

            if (target < now) target.setDate(target.getDate() + 1);

            const diff = target.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft('Starting...');
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [tournament]);

    const isRegistered = lobbyPlayers.some(p => p.id === user.id);

    const handleRegister = async () => {
        if (!tournament) return;
        if (user.balance < tournament.buyIn) {
            showAlert('Insufficient funds', 'error');
            return;
        }

        setIsRegistering(true);
        try {
            await registerForTournament(tournament.id);
            showAlert('Successfully registered!', 'success');
        } catch (e) {
            console.error(e);
            showAlert('Registration failed', 'error');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleEnter = () => {
        setIsNavigating(true);
        setTimeout(() => navigate(`/table/${id}`), 500);
    };

    if (!tournament) return <div className="p-8 text-center text-white">Loading Tournament...</div>;

    return (
        <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-xs font-bold uppercase">Back</span>
                    </button>
                    <div className="flex bg-black/40 p-1 rounded-lg gap-1">
                        {(['home', 'players', 'tables'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-blue-600 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'home' && (
                        <div className="text-center py-12 space-y-4">
                            <h1 className="text-4xl font-black italic">{tournament.name}</h1>
                            <p className="text-slate-400">Status: <span className="text-emerald-400 font-bold">{tournament.status}</span></p>
                            <div className="max-w-xl mx-auto grid grid-cols-2 gap-4 text-left mt-8">
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase">Buy-in</div>
                                    <div className="text-xl font-mono text-gold">${tournament.buyIn}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase">Prize Pool</div>
                                    <div className="text-xl font-mono text-emerald-400">${tournament.prizePool}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'players' && (
                        <div className="bg-white/5 rounded-xl overflow-hidden max-w-4xl mx-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-black/20 text-slate-400 font-bold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Player</th>
                                        <th className="px-6 py-4">Country</th>
                                        <th className="px-6 py-4 text-right">Chips</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {lobbyPlayers.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No players yet.</td></tr>
                                    ) : (
                                        lobbyPlayers.map((p, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="px-6 py-3 font-medium flex items-center gap-2">
                                                    {p.name}
                                                    {p.id === user.id && <span className="bg-emerald-500 text-black text-[10px] px-1 rounded font-bold">YOU</span>}
                                                    {p.isBot && <span className="bg-slate-700 text-[10px] px-1 rounded">BOT</span>}
                                                </td>
                                                <td className="px-6 py-3 text-center text-lg">{p.country}</td>
                                                <td className="px-6 py-3 text-right font-mono text-gold">{p.chips.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'tables' && (
                        <div className="text-center py-20">
                            <div className="inline-block p-6 bg-white/5 rounded-2xl">
                                <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">table_restaurant</span>
                                <h3 className="font-bold">Main Table</h3>
                                <button onClick={() => navigate(`/table/${id}?spectate=true`)} className="mt-4 px-6 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition border border-blue-500/30 text-xs font-bold uppercase">
                                    Observe
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-black/20 border-l border-white/5 p-6 flex flex-col gap-6">
                <div className="md:hidden"><ActiveGamesSwitcher /></div>

                <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Your Wallet</h3>
                    <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                        <div className="text-2xl font-mono font-black text-white">${user.balance.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-end gap-3">
                    {isRegistered ? (
                        <>
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-center text-emerald-400 font-bold flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">check_circle</span> Registered
                            </div>

                            {(tournament.status === 'Running' || tournament.status === 'Late Reg' || timeLeft === 'Starting...') ? (
                                <button
                                    onClick={handleEnter}
                                    disabled={isNavigating}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isNavigating ? 'Loading...' : 'GO TO TABLE'}
                                    {!isNavigating && <span className="material-symbols-outlined">login</span>}
                                </button>
                            ) : (
                                <div className="p-4 bg-slate-800 rounded-xl text-center">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Starts In</div>
                                    <div className="text-xl font-mono">{timeLeft || tournament.startTime}</div>
                                </div>
                            )}
                        </>
                    ) : (
                        tournament.status !== 'Finished' && (
                            <button
                                onClick={handleRegister}
                                disabled={isRegistering}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg transition-all"
                            >
                                {isRegistering ? 'Registering...' : `REGISTER NOW ($${tournament.buyIn})`}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentLobby;
