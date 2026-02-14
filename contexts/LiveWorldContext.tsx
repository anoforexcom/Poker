import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

interface LiveWorldContextType {
    tournaments: any[];
    onlinePlayers: number;
    registerForTournament: (tournamentId: string) => Promise<void>;
}

const LiveWorldContext = createContext<LiveWorldContextType | undefined>(undefined);

export const LiveWorldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [onlinePlayers, setOnlinePlayers] = useState(0);

    const fetchTournaments = async () => {
        try {
            const { data, error } = await supabase.from('tournaments').select('*');
            if (error) {
                console.error('Error fetching tournaments:', error);
                return;
            }
            if (data) setTournaments(data);
        } catch (err) {
            console.error('Unexpected error fetching tournaments:', err);
        }
    };

    const fetchOnlinePlayers = async () => {
        try {
            const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            if (error) {
                console.error('Error fetching player count:', error);
                return;
            }
            setOnlinePlayers(count || 0);
        } catch (err) {
            console.error('Unexpected error fetching player count:', err);
        }
    };

    const registerForTournament = async (tournamentId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Check if already registered
        const { data: existing } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) return; // Already registered

        const { error } = await supabase.from('tournament_participants').insert({
            tournament_id: tournamentId,
            user_id: user.id,
            status: 'active'
        });

        if (error) throw error;

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
        <LiveWorldContext.Provider value={{ tournaments, onlinePlayers, registerForTournament }}>
            {children}
        </LiveWorldContext.Provider>
    );
};

export const useLiveWorld = () => {
    const context = useContext(LiveWorldContext);
    if (!context) throw new Error('useLiveWorld must be used within a LiveWorldProvider');
    return context;
};
