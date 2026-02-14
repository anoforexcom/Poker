import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { getTournamentSimulator } from '../utils/tournamentSimulator';

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
                let startDate = new Date();
                try {
                    if (t.scheduled_start_time) {
                        startDate = new Date(t.scheduled_start_time);
                        // Check for Invalid Date
                        if (isNaN(startDate.getTime())) {
                            startDate = new Date();
                        }
                    }
                } catch (e) {
                    console.error('Date parse error', e);
                }

                const lateRegUntil = t.late_reg_until ? new Date(t.late_reg_until) : new Date(startDate.getTime() + 30 * 60000);

                let normalizedStatus: TournamentStatus = 'Registering';
                if (t.status === 'finished') normalizedStatus = 'Finished';
                else if (now > lateRegUntil) normalizedStatus = 'Running'; // Fallback if simulator didn't update
                else if (now > startDate) normalizedStatus = 'Late Reg';

                // Format friendly time
                const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
                let formattedTime = startDate.toLocaleTimeString([], timeOptions);

                // Dynamic Relative Time
                const diffMs = startDate.getTime() - now.getTime();
                const diffMins = Math.ceil(diffMs / 60000);

                if (diffMs > 0 && diffMs < 60 * 60 * 1000) {
                    formattedTime = `Starting in ${diffMins}m`;
                } else if (diffMs <= 0 && diffMs > -60000) { // Within 1 min passed
                    formattedTime = 'Starting...';
                } else if (normalizedStatus === 'Running' || normalizedStatus === 'Late Reg') {
                    formattedTime = 'Now';
                }

                return {
                    id: t.id,
                    name: t.name,
                    gameType: t.type === 'cash' ? 'NL Hold\'em' : t.type.toUpperCase(),
                    buyIn: Number(t.buy_in),
                    prizePool: Number(t.prize_pool),
                    players: t.players_count,
                    maxPlayers: t.max_players,
                    status: normalizedStatus,
                    startTime: formattedTime === 'Invalid Date' ? 'Now' : formattedTime,
                    progress: normalizedStatus === 'Running' ? 50 : 0,
                    type: t.type as any
                };
            });
            setTournaments(mapped);

            const totalTournamentPlayers = mapped.reduce((acc, t) => acc + t.players, 0);

            // STRICT REALISM: Only show actual players (bots + humans)
            setOnlinePlayers(totalTournamentPlayers);
            setSmoothedOnlinePlayers(totalTournamentPlayers); // disable smoothing for accuracy
            setActiveTables(Math.ceil(totalTournamentPlayers / 6)); // Estimate tables based on players
        } else {
            // Fallback for Demo/New environments when Supabase is empty
            const fallbackTournaments: Tournament[] = [
                { id: 'sim-1', name: 'Sunday Million [DEMO]', gameType: 'NL HOLD\'EM', buyIn: 215, prizePool: 1000000, players: 4520, maxPlayers: 10000, status: 'Registering', startTime: '18:00', type: 'tournament', progress: 0 },
                { id: 'sim-2', name: 'Micro Stakes Zoom', gameType: 'NL Hold\'em', buyIn: 2, prizePool: 0, players: 120, maxPlayers: 500, status: 'Running', startTime: 'Now', type: 'cash', progress: 45 },
            ];
            setTournaments(fallbackTournaments);
            setOnlinePlayers(4640);
            setActiveTables(800);
        }
    };



    // Initialize Simulator for realistic background activity
    useEffect(() => {
        const simulator = getTournamentSimulator();
        simulator.start();

        // Seed initial 24/7 schedule if empty
        simulator.seedInitialData();

        return () => simulator.stop();
    }, []);

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

    // Periodically refresh data to update relative times ("In 5m" -> "In 4m")
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTournaments();
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [cashPlayersBase]);

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

        // If it's an empty ID (not initialized), we bypass the DB
        if (!userId) {
            console.log('[LIVE_WORLD] Empty user ID detected, bypassing DB registration');
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

        if (joinError) {
            console.error('[LIVE_WORLD] Registration error:', joinError);
            // FAIL-SAFE for Demo/Guest accounts if the DB profile doesn't exist or transient error
            if (userId === '00000000-0000-0000-0000-000000000002') {
                console.warn('[LIVE_WORLD] Guest registration DB failure - bypassing for demo.');
            } else {
                throw joinError;
            }
        }

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
