import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TournamentSimulator, getTournamentSimulator } from '../utils/tournamentSimulator';

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
        // Tournament simulation is disabled for the new Cash Game focus.
        setStats(prev => ({
            ...prev,
            totalBots: 5,
            totalTournaments: 0,
            registeringTournaments: 0,
            runningTournaments: 0,
            finishedTournaments: 0,
            totalPlayersInTournaments: 0,
            houseProfit: 0
        }));
        setTournaments([]);
        setTopBots([]);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
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
