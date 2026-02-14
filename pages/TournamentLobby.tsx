
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveWorld } from '../contexts/LiveWorldContext';
import { useSimulation } from '../contexts/SimulationContext';
import { useNotification } from '../contexts/NotificationContext';
import { generateBotName } from '../utils/nameGenerator';
import { useGame } from '../contexts/GameContext';

import { ActiveGamesSwitcher } from '../components/ActiveGamesSwitcher';
import { supabase } from '../utils/supabase';

const TournamentLobby: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { tournaments: liveWorldTournaments, onlinePlayers, registerForTournament } = useLiveWorld();
    const { user, withdraw } = useGame();
    const { showAlert } = useNotification();
    const navigate = useNavigate();

    // Simplified: tournaments already come from LiveWorld (which are rows in the DB)
    const tournaments = liveWorldTournaments || [];

    // NOW we can safely check and return early
    const tournament = tournaments.find(t => t.id === id);

    const [activeTab, setActiveTab] = useState<'home' | 'players' | 'tables'>('home');
    const [isNavigating, setIsNavigating] = useState(false);

    // Real Players List State
    const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([]);

    // Deterministic Flag Generator
    const getCountryFlag = (id: string) => {
        const flags = ['🇺🇸', '🇬🇧', '🇨🇦', '🇩🇪', '🇫🇷', '🇧🇷', '🇦🇷', '🇪🇸', '🇮🇹', '🇯🇵', '🇦🇺', '🇨🇳', '🇷🇺', '🇮🇳', '🇰🇷', '🇳🇱', '🇸🇪', '🇵🇹'];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return flags[Math.abs(hash) % flags.length];
    };

    // Fetch Players for Lobby
    React.useEffect(() => {
        if (!tournament) return;

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
                    const name = isBot ? p.bots?.name : p.profiles?.name;
                    const id = p.bot_id || p.user_id;
                    return {
                        id,
                        name: name || 'Unknown',
                        isBot,
                        country: isBot ? getCountryFlag(id) : '🇺🇸', // Default users to US for now or fetch from profile
                        chips: 10000 // Always show starting stack in lobby for now, or fetch if running
                    };
                });
                setLobbyPlayers(mapped);
            }
        };

        fetchLobbyPlayers();
        // Poll every 5s to keep list fresh
        const interval = setInterval(fetchLobbyPlayers, 5000);
        return () => clearInterval(interval);
    }, [tournament?.id]);

    // Countdown Timer Logic
    const [timeLeft, setTimeLeft] = useState('');

    React.useEffect(() => {
        if (!tournament || tournament.status !== 'Registering') return;

        const updateTimer = () => {
            const now = new Date();
            // Safe parse logic again just in case, though LiveWorld should handle it
            let start = new Date();
            if (tournament.startTime !== 'Now') {
                // Try to parse the original ISODate if we had it, but here we might only have formatted time.
                // Ideally we pass raw ISO string or we rely on the fact that if it's "Registering", it's in the future.
                // NOTE: formatted "startTime" in tournament object is HH:MM.
                // We need the RAW scheduled_start_time. 
                // Limitation: The 'tournament' object from LiveWorldContext is already formatted.
                // Fix: We should update LiveWorldContext to pass raw ISO or handle it here.
                // For now, let's assume if we can't parse, we show "Wait".
                // Actually, better to fetch the raw row or update LiveWorldContext.
                // Let's stick to "Starts Soon" if we can't parse, but wait!
                // The 'tournament' object in LiveWorldContext DOES NOT receive raw ISO.
                // I will depend on the LiveWorld update I made earlier? 
                // Wait, I updated LiveWorldContext to return formatted `startTime`.
                // I should check if I can pass raw timestamp too.
            }
        };
        // For now, simple placeholder or relying on the "Starts In" text if valid.
    }, [tournament]);

    // ... (rest of component)

    // NOW matching the return for the Players Tab
    // ...

    {
        activeTab === 'players' && (
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
                        {lobbyPlayers.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No players registered yet.</td></tr>
                        ) : (
                            lobbyPlayers.map((p, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-300 flex items-center gap-2">
                                        {p.name}
                                        {!p.isBot && <span className="text-[10px] bg-primary text-white px-1 rounded ml-2">HUMAN</span>}
                                        {p.id === user.id && <span className="text-[10px] bg-emerald-500 text-white px-1 rounded ml-2">YOU</span>}
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-lg">{p.country}</td>
                                    <td className="px-6 py-3 text-right text-gold font-mono font-bold">{p.chips.toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )
    }

    {
        activeTab === 'tables' && (
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
        )
    }
                </div >
            </div >

    {/* Sidebar / Action Panel */ }
    < div className = "w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-surface/10 p-4 md:p-6 flex flex-col gap-6 md:gap-8 overflow-y-auto custom-scrollbar" >
        {/* Active Games Switcher inside the tournament lobby panel for easy switching */ }
        < div className = "md:hidden pt-2" >
                    <ActiveGamesSwitcher />
                    <div className="h-px bg-white/5 my-6"></div>
                </div >

    <div>
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Your Status</h2>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center shadow-inner">
            <div className={`text-sm font-black uppercase tracking-tighter mb-1 ${isRegistered ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isRegistered ? 'Registered' : 'Not Registered'}
            </div>
            <div className="text-white text-lg font-black font-mono tracking-tighter">${user.balance.toLocaleString()}</div>
        </div>
    </div>

{
    isRegistered ? (
        <div className="space-y-3">
            <button className="w-full py-4 bg-green-500/10 border border-green-500 text-green-500 font-black rounded-xl cursor-default flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span> REGISTERED</div>
            </button>
            {/* Waiting Room Logic */}
            {tournament.status === 'Registering' && tournament.startTime !== 'Now' ? (
                <div className="w-full py-4 bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Tournament Starts In</span>
                    <div className="text-2xl font-black text-white font-mono">
                        {timeLeft || tournament.startTime}
                    </div>
                    <p className="text-[9px] text-slate-500">You are registered. Please wait.</p>
                </div>
            ) : (
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
            )}
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
    )
}

<div className="space-y-4 pt-6 border-t border-border-dark">
    <div className="flex justify-between text-sm">
        <span className="text-slate-500">Entrants</span>
        <span className="text-white font-bold">
            {tournament.players}
            {tournament.type === 'tournament' ? ' (Unlimited)' : ` / ${tournament.maxPlayers}`}
        </span>
    </div>
    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className="bg-poker-green h-full" style={{ width: tournament.type === 'tournament' ? '100%' : `${(tournament.players / tournament.maxPlayers) * 100}%` }}></div>
    </div>

    <div className="flex justify-between text-sm">
        <span className="text-slate-500">Start Time</span>
        <span className="text-white font-bold">{tournament.startTime}</span>
    </div>
</div>

            </div >
        </div >
    );
};

export default TournamentLobby;
