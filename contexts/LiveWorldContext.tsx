import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

interface LiveWorldContextType {
    tournaments: any[];
    onlinePlayers: number;
    smoothedOnlinePlayers: number;
    activeTables: number;
    registerForTournament: (tournamentId: string) => Promise<void>;
}

const LiveWorldContext = createContext<LiveWorldContextType | undefined>(undefined);

export const LiveWorldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [onlinePlayers, setOnlinePlayers] = useState(0);
    const [activeTables, setActiveTables] = useState(0);

    const fetchTournaments = async () => {
        try {
            console.log('[LIVEWORLD] Fetching tournaments...');
            const { data, error } = await supabase.from('tournaments').select('*');
            if (error) {
                console.error('[LIVEWORLD] Error fetching tournaments:', error);
                return;
            }
            console.log('[LIVEWORLD] Raw data:', data);

            if (data) {
                // Map snake_case database columns to camelCase for frontend components
                const mappedTournaments = data.map((t: any) => ({
                    ...t,
                    buyIn: t.buy_in,
                    prizePool: t.prize_pool,
                    players: t.players_count,
                    maxPlayers: t.max_players,
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

            const total = (humanCount || 0) + (botCount || 0);
            setOnlinePlayers(total);
        } catch (err) {
            console.error('Unexpected error fetching player count:', err);
        }
    };

    const registerForTournament = async (tournamentId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

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
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) return; // Already registered

        // 3. SECURE PROCESS: CALL RPC FOR BUY-IN
        // This function verifies auth.uid(), checks balance, deducts money and creates a transaction.
        const { error: rpcError } = await supabase.rpc('process_human_buyin', {
            tournament_id_param: tournamentId,
            amount_param: tournament.buy_in
        });

        if (rpcError) {
            console.error('[LIVEWORLD] RPC Buy-in failed:', rpcError);
            throw rpcError;
        }

        // 4. Insert participant record
        // The trigger trg_update_players_count will automatically increment tournaments.players_count
        const { error: insertError } = await supabase.from('tournament_participants').insert({
            tournament_id: tournamentId,
            user_id: user.id,
            status: 'active'
        });

        if (insertError) {
            console.error('[LIVEWORLD] Participant insertion failed:', insertError);
            throw insertError;
        }

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

    return (
        <LiveWorldContext.Provider value={{
            tournaments,
            onlinePlayers,
            registerForTournament,
            activeTables,
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
