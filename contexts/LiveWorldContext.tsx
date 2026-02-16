import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

interface LiveWorldContextType {
    tournaments: any[];
    onlinePlayers: number;
    smoothedOnlinePlayers: number;
    activeTables: number;
    registerForTournament: (tournamentId: string, manualUserId?: string) => Promise<void>;
    manualPulse: () => Promise<void>;
}

const LiveWorldContext = createContext<LiveWorldContextType | undefined>(undefined);

export const LiveWorldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [onlinePlayers, setOnlinePlayers] = useState(0);
    const [activeTables, setActiveTables] = useState(0);

    const fetchTournaments = async () => {
        try {
            console.log('[LIVEWORLD] Fetching tournaments...');
            // Filter out finished games early to reduce noise
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .neq('status', 'finished')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[LIVEWORLD] Error fetching tournaments:', error);
                return;
            }
            console.log('[LIVEWORLD] Raw data:', data);

            if (data) {
                // Map snake_case database columns to camelCase for frontend components
                const mappedTournaments = data.map((t: any) => ({
                    ...t,
                    buyIn: Number(t.buy_in || 0),
                    prizePool: Number(t.prize_pool || 0),
                    players: t.players_count || 0,
                    maxPlayers: t.max_players || 6,
                    scheduledStartTime: t.scheduled_start_time,
                    lateRegUntil: t.late_reg_until,
                    currentBlindLevel: t.current_blind_level
                }));

                console.log('[LIVEWORLD] Mapped tournaments:', mappedTournaments);
                setTournaments(mappedTournaments);

                // Simple estimation for active tables based on player count
                const totalPlayers = data.reduce((acc: number, t: any) => acc + (t.players_count || 0), 0);
                setActiveTables(Math.ceil(totalPlayers / 6) || 0);
            }
        } catch (err) {
            console.error('[LIVEWORLD] Unexpected error fetching tournaments:', err);
        }
    };

    const fetchOnlinePlayers = async () => {
        try {
            const { count: humanCount, error: humanError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: botCount, error: botError } = await supabase.from('bots').select('*', { count: 'exact', head: true });

            if (humanError) console.error('Error fetching human count:', humanError);
            if (botError) console.error('Error fetching bot count:', botError);

            console.log(`[LIVEWORLD] Online Stats: Humans=${humanCount}, Bots=${botCount}`);

            // Resilience: Only update if we have valid numbers
            if (humanCount !== null && botCount !== null) {
                const total = (humanCount || 0) + (botCount || 0);
                setOnlinePlayers(total);
            } else {
                console.warn('[LIVEWORLD] Could not fetch player stats, keeping last state.');
            }
        } catch (err) {
            console.error('Unexpected error fetching player count:', err);
        }
    };

    const registerForTournament = async (tournamentId: string, manualUserId?: string) => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('[LIVEWORLD] Checking Auth:', { user, authError });

        // Use manual GUID if provided (for bypass accounts), else use auth.user().id
        const userId = user?.id || manualUserId;

        if (!userId) {
            throw new Error(`User not authenticated (Error: ${authError?.message || 'No Session and no Manual ID'})`);
        }

        // 1. Get tournament details (to get buy-in)
        const { data: tournament, error: tError } = await supabase
            .from('tournaments')
            .select('buy_in')
            .eq('id', tournamentId)
            .single();

        if (tError || !tournament) throw new Error("Tournament not found");

        // 2. Check if already registered
        const { data: existing } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) return; // Already registered

        // 3. SECURE PROCESS: CALL V9 RPC (Optimized Performance + Atoms)
        const { data, error: rpcError } = await supabase.rpc('join_or_tick_tournament_v9', {
            t_id: tournamentId,
            u_id_param: userId
        });

        if (rpcError) {
            console.error('[LIVEWORLD] RPC Join V6 failed:', rpcError);
            throw rpcError;
        }

        // Handle logical errors from SQL
        if (data && data.success === false) {
            throw new Error(data.message || 'Registration failed');
        }

        console.log('[LIVEWORLD] Joined V2 Success:', data);

        // Refresh data
        fetchTournaments();
    };

    useEffect(() => {
        fetchTournaments();
        fetchOnlinePlayers();
        const interval = setInterval(() => {
            fetchTournaments();
            fetchOnlinePlayers();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const manualPulse = async () => {
        console.log('[LIVEWORLD] Manual Pulse triggered...');
        try {
            await supabase.functions.invoke('poker-simulator', {
                body: { action: 'tick' }
            });
            await fetchTournaments();
            await fetchOnlinePlayers();
        } catch (err) {
            console.error('[LIVEWORLD] Manual Pulse failed:', err);
        }
    };

    // HEARTBEAT: Ensure the world stays alive
    useEffect(() => {
        const pulse = async () => {
            // Speedup Lobby: If no tournaments, force a pulse immediately
            if (tournaments.length === 0) {
                console.log('[LIVEWORLD] Lobby empty, sending AGGRESSIVE Server Pulse...');
            } else {
                console.log('[LIVEWORLD] Sending Server Pulse...');
            }

            try {
                await supabase.functions.invoke('poker-simulator', {
                    body: { action: 'tick' }
                });
                // Immediate refresh after tick to show new bots/games
                fetchTournaments();
            } catch (err) {
                console.error('[LIVEWORLD] Pulse failed:', err);
            }
        };

        // Pulse immediately
        pulse();

        // dynamic interval: faster if empty (2s) to bridge the "waking up" gap
        const pulseInterval = tournaments.length === 0 ? 2000 : 30000;
        const interval = setInterval(pulse, pulseInterval);
        return () => clearInterval(interval);
    }, [tournaments.length]); // Re-run if length changes to adjust pulse speed

    return (
        <LiveWorldContext.Provider value={{
            tournaments,
            onlinePlayers,
            registerForTournament,
            activeTables,
            manualPulse,
            smoothedOnlinePlayers: onlinePlayers // Alias for compatibility
        }}>
            {children}
        </LiveWorldContext.Provider>
    );
};

export const useLiveWorld = () => {
    const context = useContext(LiveWorldContext);
    if (!context) throw new Error('useLiveWorld must be used within a LiveWorldProvider');
    return context;
};
