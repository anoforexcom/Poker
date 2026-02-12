import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TournamentSimulator, getTournamentSimulator } from '../utils/tournamentSimulator';

interface SimulationContextType {
    isRunning: boolean;
    startSimulation: () => void;
    stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [simulator] = useState<TournamentSimulator>(() => getTournamentSimulator());
    const [isRunning, setIsRunning] = useState(false);

    const startSimulation = async () => {
        setIsRunning(true);
        console.log('[SIMULATION] Initializing Production Environment...');
        await simulator.seedInitialData();
        await simulator.start();
        console.log('[SIMULATION] Real-time Database Sync Active!');
    };

    const stopSimulation = () => {
        simulator.stop();
        setIsRunning(false);
        console.log('[SIMULATION] Simulation Paused.');
    };

    // Auto-start on mount (Production sync mode)
    useEffect(() => {
        startSimulation();
        return () => {
            simulator.stop();
        };
    }, []);

    return (
        <SimulationContext.Provider value={{
            isRunning,
            startSimulation,
            stopSimulation,
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
