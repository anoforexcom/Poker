import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TournamentSimulator, getTournamentSimulator } from '../utils/tournamentSimulator';
import { supabase } from '../utils/supabase';

interface SimulationContextType {
    isRunning: boolean;
    startSimulation: () => void;
    stopSimulation: () => void;
    stats: {
        totalBots: number;
        totalTournaments: number;
        registeringTournaments: number;
        runningTournaments: number;
        finishedTournaments: number;
        totalPlayersInTournaments: number;
        houseProfit: number;
    };
    tournaments: any[];
    topBots: any[];
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Simulator removed. State is now driven by Backend + Realtime
    const [stats, setStats] = useState({
        totalBots: 0,
        totalTournaments: 0,
        registeringTournaments: 0,
        runningTournaments: 0,
        finishedTournaments: 0,
        totalPlayersInTournaments: 0,
        houseProfit: 0
    });
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [topBots, setTopBots] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const { count: totalBots } = await supabase.from('bots').select('*', { count: 'exact', head: true });
            const { data: allTournaments } = await supabase.from('tournaments').select('*').order('scheduled_start_time', { ascending: true });

            if (allTournaments) {
                const regs = allTournaments.filter(t => t.status === 'registering' || t.status === 'late_reg' || t.status === 'Registering' || t.status === 'Late Reg').length;
                const runs = allTournaments.filter(t => t.status === 'running' || t.status === 'Running').length;
                const fins = allTournaments.filter(t => t.status === 'finished' || t.status === 'Finished').length;
                const totalPlayers = allTournaments.reduce((acc, t) => acc + (t.players_count || 0), 0);

                setStats(prev => ({
                    ...prev,
                    totalBots: totalBots || 0,
                    totalTournaments: allTournaments.length,
                    registeringTournaments: regs,
                    runningTournaments: runs,
                    finishedTournaments: fins,
                    totalPlayersInTournaments: totalPlayers
                }));

                // Filter out finished for the Lobby list, sort by start time/active
                setTournaments(allTournaments
                    .filter(t => t.status !== 'finished' && t.status !== 'Finished')
                    .sort((a, b) => {
                        // Running first
                        const statusA = a.status.toLowerCase();
                        const statusB = b.status.toLowerCase();
                        if (statusA === 'running' && statusB !== 'running') return -1;
                        if (statusB === 'running' && statusA !== 'running') return 1;
                        return new Date(a.scheduled_start_time).getTime() - new Date(b.scheduled_start_time).getTime();
                    })
                );
            }

            // House Profit (Transactions)
            const { data: pokerTx } = await supabase
                .from('transactions')
                .select('type, amount')
                .in('type', ['poker_buyin', 'poker_win']);

            if (pokerTx) {
                const buyins = pokerTx.filter(tx => tx.type === 'poker_buyin').reduce((sum, tx) => sum + Number(tx.amount), 0);
                const wins = pokerTx.filter(tx => tx.type === 'poker_win').reduce((sum, tx) => sum + Number(tx.amount), 0);
                setStats(prev => ({ ...prev, houseProfit: buyins - wins }));
            }

            const { data: top } = await supabase.from('bots').select('*').order('balance', { ascending: false }).limit(20);
            if (top) setTopBots(top);

        } catch (err) {
            console.error('[SIMULATION] Fetch Error:', err);
        }
    };

    useEffect(() => {
        fetchData();

        // Realtime Subscription
        const channel = supabase.channel('public:tournaments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, (payload) => {
                // Refresh data on any tournament change
                fetchData();
            })
            .subscribe();

        // Also refresh every 30s just in case
        const interval = setInterval(fetchData, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    // No-ops for simulation control
    const startSimulation = () => { };
    const stopSimulation = () => { };

    return (
        <SimulationContext.Provider value={{ isRunning: true, startSimulation, stopSimulation, stats, tournaments, topBots }}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (!context) throw new Error('useSimulation must be used within a SimulationProvider');
    return context;
};
