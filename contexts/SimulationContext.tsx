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
    const [simulator] = useState<TournamentSimulator>(() => getTournamentSimulator());
    const [isRunning, setIsRunning] = useState(false);
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
            // Fetch Stats
            const { count: totalBots } = await supabase.from('bots').select('*', { count: 'exact', head: true });
            const { data: allTournaments } = await supabase.from('tournaments').select('*');

            if (allTournaments) {
                const regs = allTournaments.filter(t => t.status === 'registering').length;
                const runs = allTournaments.filter(t => t.status === 'running').length;
                const fins = allTournaments.filter(t => t.status === 'finished').length;
                const totalPlayers = allTournaments.reduce((acc, t) => acc + (t.players_count || 0), 0);

                setStats({
                    totalBots: totalBots || 0,
                    totalTournaments: allTournaments.length,
                    registeringTournaments: regs,
                    runningTournaments: runs,
                    finishedTournaments: fins,
                    totalPlayersInTournaments: totalPlayers,
                    houseProfit: 0 // Will update below
                });

                // Calculate HOUSE PROFIT (Human Buyins - Human Wins)
                const { data: pokerTx } = await supabase
                    .from('transactions')
                    .select('type, amount')
                    .in('type', ['poker_buyin', 'poker_win']);

                if (pokerTx) {
                    const buyins = pokerTx.filter(tx => tx.type === 'poker_buyin').reduce((sum, tx) => sum + Number(tx.amount), 0);
                    const wins = pokerTx.filter(tx => tx.type === 'poker_win').reduce((sum, tx) => sum + Number(tx.amount), 0);
                    setStats(prev => ({ ...prev, houseProfit: buyins - wins }));
                }

                // Set tournaments for list (most recent active)
                setTournaments(allTournaments
                    .filter(t => t.status !== 'finished')
                    .sort((a, b) => b.players_count - a.players_count)
                );
            }

            // Fetch Top Bots
            const { data: top } = await supabase
                .from('bots')
                .select('*')
                .order('balance', { ascending: false })
                .limit(20);

            if (top) {
                setTopBots(top.map(b => ({
                    ...b,
                    winRate: b.games_played > 0 ? b.tournaments_won / b.games_played : 0,
                    gamesPlayed: b.games_played,
                    tournamentsWon: b.tournaments_won
                })));
            }
        } catch (err) {
            console.error('[SIMULATION] Fetch Error:', err);
        }
    };

    const startSimulation = async () => {
        setIsRunning(true);
        console.log('[SIMULATION] Initializing Production Environment...');
        await simulator.seedInitialData();
        await simulator.start();
        console.log('[SIMULATION] Real-time Database Sync Active!');
        fetchData(); // Initial fetch
    };

    const stopSimulation = () => {
        simulator.stop();
        setIsRunning(false);
        console.log('[SIMULATION] Simulation Paused.');
    };

    // Auto-start and Periodic Sync
    useEffect(() => {
        startSimulation();

        const interval = setInterval(() => {
            fetchData();
        }, 3000);

        return () => {
            simulator.stop();
            clearInterval(interval);
        };
    }, []);

    return (
        <SimulationContext.Provider value={{
            isRunning,
            startSimulation,
            stopSimulation,
            stats,
            tournaments,
            topBots
        }}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};
