import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

export type TournamentStatus = 'Registering' | 'Late Reg' | 'Running' | 'Final Table' | 'Finished';

export interface Tournament {
    id: string;
    name: string;
    gameType: string;
    buyIn: number;
    prizePool: number;
    players: number;
    maxPlayers: number;
    status: TournamentStatus;
    startTime: string; // Display string like "14:00" or "Now"
    progress: number; // 0-100 for running tournaments
    type?: 'tournament' | 'cash' | 'sitgo' | 'spingo';
}

interface LiveWorldContextType {
    onlinePlayers: number;
    smoothedOnlinePlayers: number;
    activeTables: number;
    tournaments: Tournament[];
    registerForTournament: (id: string, userId: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const LiveWorldContext = createContext<LiveWorldContextType | undefined>(undefined);

export const LiveWorldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [onlinePlayers, setOnlinePlayers] = useState(3452);
    const [smoothedOnlinePlayers, setSmoothedOnlinePlayers] = useState(3452);
    const [activeTables, setActiveTables] = useState(482);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [cashPlayersBase, setCashPlayersBase] = useState(3210);

    const fetchTournaments = async () => {
        console.log('[LIVE_WORLD] Fetching tournaments from Supabase...');
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[LIVE_WORLD] Error fetching tournaments:', error);
            return;
        }

        if (data && data.length > 0) {
            const mapped: Tournament[] = data.map(t => {
                const now = new Date();
                const startTime = new Date(t.scheduled_start_time);
                const lateRegUntil = new Date(t.late_reg_until);

                let normalizedStatus: TournamentStatus = 'Registering';
                if (t.status === 'finished') normalizedStatus = 'Finished';
                else if (now > lateRegUntil) normalizedStatus = 'Running';
                else if (now > startTime) normalizedStatus = 'Late Reg';

                return {
                    id: t.id,
                    name: t.name,
                    gameType: t.type === 'cash' ? 'NL Hold\'em' : t.type.toUpperCase(),
                    buyIn: Number(t.buy_in),
                    prizePool: Number(t.prize_pool),
                    players: t.players_count,
                    maxPlayers: t.max_players,
                    status: normalizedStatus,
                    startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    progress: normalizedStatus === 'Running' ? 50 : 0,
                    type: t.type as any
                };
            });
            setTournaments(mapped);

            const totalTournamentPlayers = mapped.reduce((acc, t) => acc + t.players, 0);

            // Flutuação muito suave do base (não muda radicalmente em cada fetch)
            const totalOnline = totalTournamentPlayers + cashPlayersBase;

            setOnlinePlayers(totalOnline);
            setActiveTables(Math.ceil(totalTournamentPlayers / 9) + Math.ceil(cashPlayersBase / 6));
        } else {
            // Fallback for Demo/New environments when Supabase is empty
            const fallbackTournaments: Tournament[] = [
                { id: 'sim-1', name: 'Sunday Million [DEMO]', gameType: 'NL HOLD\'EM', buyIn: 215, prizePool: 1000000, players: 4520, maxPlayers: 10000, status: 'Registering', startTime: '18:00', type: 'tournament', progress: 0 },
                { id: 'sim-2', name: 'Micro Stakes Zoom', gameType: 'NL Hold\'em', buyIn: 2, prizePool: 0, players: 120, maxPlayers: 500, status: 'Running', startTime: 'Now', type: 'cash', progress: 45 },
                { id: 'sim-3', name: 'High Roller Turbo', gameType: 'NL HOLD\'EM', buyIn: 530, prizePool: 50000, players: 82, maxPlayers: 180, status: 'Late Reg', startTime: 'Now', type: 'tournament', progress: 10 },
                { id: 'sim-4', name: 'Daily Marathon', gameType: 'NL HOLD\'EM', buyIn: 22, prizePool: 15000, players: 240, maxPlayers: 1000, status: 'Running', startTime: 'Now', type: 'tournament', progress: 60 },
                { id: 'sim-5', name: 'Headhunter Progressive KO', gameType: 'NL HOLD\'EM', buyIn: 109, prizePool: 25000, players: 156, maxPlayers: 500, status: 'Registering', startTime: '19:30', type: 'tournament', progress: 0 }
            ];
            setTournaments(fallbackTournaments);
            setOnlinePlayers(cashPlayersBase + 5000); // Fixed boost for empty DB
            setActiveTables(Math.ceil(5000 / 9) + Math.ceil(cashPlayersBase / 6));
        }
    };

    // Small base fluctuation every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCashPlayersBase(prev => {
                const shift = Math.random() > 0.5 ? 1 : -1;
                return prev + (Math.floor(Math.random() * 5) * shift);
            });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchTournaments();

        const subscription = supabase
            .channel('realtime:tournaments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
                fetchTournaments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [cashPlayersBase]);

    // Smoothing Heartbeat (Slow and professional smoothing)
    useEffect(() => {
        const interval = setInterval(() => {
            setSmoothedOnlinePlayers(prev => {
                const diff = onlinePlayers - prev;
                if (Math.abs(diff) < 0.1) return onlinePlayers;
                // Slower smoothing (0.02) to avoid "growing too fast"
                const step = diff * 0.02;
                return prev + step;
            });
        }, 80);

        return () => clearInterval(interval);
    }, [onlinePlayers]);

    const registerForTournament = async (tournamentId: string, userId: string) => {
        console.log('[LIVE_WORLD] Registering user:', userId, 'for tournament:', tournamentId);

        // 1. Get current tournament state
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) throw new Error('Tournament not found');

        // Check if full (Only for Cash and Sit&Go, Tournaments are unlimited)
        const isUnlimited = tournament.type === 'tournament' || tournament.type === 'spingo';
        if (!isUnlimited && tournament.players >= tournament.maxPlayers) {
            throw new Error('This game is full');
        }

        // If it's a Demo Guest user or empty ID (not initialized), we bypass the DB
        if (userId === 'demo-guest-id' || !userId) {
            console.log('[LIVE_WORLD] Guest user or empty ID detected, bypassing DB registration');
            return;
        }

        // Check if already registered
        const { data: existing } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            console.log('[LIVE_WORLD] User already registered');
            return;
        }

        // 1. Join the tournament participants
        const { error: joinError } = await supabase
            .from('tournament_participants')
            .insert({ tournament_id: tournamentId, user_id: userId, status: 'active' });

        if (joinError) throw joinError;

        // 2. Increment player count in tournament table
        await supabase
            .from('tournaments')
            .update({ players_count: (tournament.players || 0) + 1 })
            .eq('id', tournamentId);
    };

    return (
        <LiveWorldContext.Provider value={{
            onlinePlayers,
            smoothedOnlinePlayers: Math.round(smoothedOnlinePlayers),
            activeTables,
            tournaments,
            registerForTournament,
            refreshData: fetchTournaments
        }}>
            {children}
        </LiveWorldContext.Provider>
    );
};

export const useLiveWorld = () => {
    const context = useContext(LiveWorldContext);
    if (context === undefined) {
        throw new Error('useLiveWorld must be used within a LiveWorldProvider');
    }
    return context;
};
