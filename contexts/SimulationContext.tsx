import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SimulationContextType {
    isRunning: boolean;
    startSimulation: () => void;
    stopSimulation: () => void;
    stats: {
        totalBots: number;
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
        houseProfit: 0
    });
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [topBots, setTopBots] = useState<any[]>([]);

    const fetchData = async () => {
        // Mocking real traffic based on the 3000 bot population
        setStats(prev => ({
            ...prev,
            totalBots: 3000,
            houseProfit: 0
        }));
        setTournaments([
            { id: '1', name: 'Micro Stakes', players: 9, maxPlayers: 9, status: 'running' },
            { id: '2', name: 'High Roller', players: 6, maxPlayers: 9, status: 'running' },
            { id: '3', name: 'Turbo Spin', players: 3, maxPlayers: 3, status: 'registering' },
        ]);
        setTopBots([
            { name: 'TexasPro', winnings: 1250000 },
            { name: 'RiverShark', winnings: 980000 },
            { name: 'AceCollector', winnings: 750000 },
        ]);
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
