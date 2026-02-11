import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TournamentSimulator, SimulatedTournament, SimulatedBot, getTournamentSimulator } from '../utils/tournamentSimulator';

interface SimulationContextType {
    simulator: TournamentSimulator | null;
    tournaments: SimulatedTournament[];
    stats: {
        totalBots: number;
        totalTournaments: number;
        registeringTournaments: number;
        runningTournaments: number;
        finishedTournaments: number;
        totalPlayersInTournaments: number;
    };
    topBots: SimulatedBot[];
    isRunning: boolean;
    startSimulation: () => void;
    stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [simulator] = useState<TournamentSimulator>(() => getTournamentSimulator({
        initialBots: 2000, // 2000 bots iniciais
        maxBots: 10000, // Até 10000 bots
        tournamentInterval: 3 * 60 * 1000, // Novo torneio a cada 3 minutos
        simulationSpeed: 2000, // Atualizar a cada 2 segundos
        maxConcurrentTournaments: 30, // Até 30 torneios simultâneos
    }));

    const [tournaments, setTournaments] = useState<SimulatedTournament[]>([]);
    const [stats, setStats] = useState({
        totalBots: 0,
        totalTournaments: 0,
        registeringTournaments: 0,
        runningTournaments: 0,
        finishedTournaments: 0,
        totalPlayersInTournaments: 0,
    });
    const [topBots, setTopBots] = useState<SimulatedBot[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // Auto-start simulation on mount
    useEffect(() => {
        startSimulation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // Atualizar dados a cada 2 segundos
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTournaments(simulator.getActiveTournaments());
            setStats(simulator.getStats());
            setTopBots(simulator.getTopBots(20));
        }, 2000);

        return () => clearInterval(interval);
    }, [simulator, isRunning]);

    const startSimulation = () => {
        simulator.start();
        setIsRunning(true);
        console.log('🎮 Simulação iniciada!');
    };

    const stopSimulation = () => {
        simulator.stop();
        setIsRunning(false);
        console.log('⏹️ Simulação parada!');
    };

    return (
        <SimulationContext.Provider value={{
            simulator,
            tournaments,
            stats,
            topBots,
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
