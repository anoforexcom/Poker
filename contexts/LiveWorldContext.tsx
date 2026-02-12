import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    activeTables: number;
    tournaments: Tournament[];
    registerForTournament: (id: string) => void;
}

const LiveWorldContext = createContext<LiveWorldContextType | undefined>(undefined);

const TOURNAMENT_TEMPLATES = [
    { name: "Sunday Million", buyIn: 109, maxPlayers: 10000, gameType: "NL Hold'em" },
    { name: "Daily Bigs", buyIn: 55, maxPlayers: 2000, gameType: "NL Hold'em" },
    { name: "Omadness", buyIn: 22, maxPlayers: 500, gameType: "PLO" },
    { name: "Hyper Turbo", buyIn: 11, maxPlayers: 1000, gameType: "NL Hold'em" },
    { name: "Bounty Builder", buyIn: 33, maxPlayers: 1500, gameType: "KO" },
    { name: "Micro Millions", buyIn: 2.20, maxPlayers: 5000, gameType: "NL Hold'em" },
];

export const LiveWorldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial Random State
    const [onlinePlayers, setOnlinePlayers] = useState(4120);
    const [activeTables, setActiveTables] = useState(842);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    // Initialize Tournaments
    useEffect(() => {
        const initialTournaments: Tournament[] = Array.from({ length: 8 }).map((_, i) => createRandomTournament(i));
        setTournaments(initialTournaments);
    }, []);

    // Simulation Heartbeat
    useEffect(() => {
        const mainTimer = setInterval(() => {
            setTournaments(prev => {
                const updatedTournaments = prev.map(t => {
                    // Logic for Tournament Lifecycle

                    // REGISTERING -> Fills up
                    if (t.status === 'Registering' || t.status === 'Late Reg') {
                        const newPlayers = Math.min(t.maxPlayers, t.players + Math.floor(Math.random() * 5));
                        let newStatus = t.status;

                        // If full, start running
                        if (newPlayers >= t.maxPlayers) {
                            newStatus = 'Running';
                        }
                        // Increase prize pool as players join
                        const newPrizePool = newPlayers * t.buyIn * 0.9;

                        return { ...t, players: newPlayers, status: newStatus, prizePool: newPrizePool };
                    }

                    // RUNNING -> Players drop out, progress increases
                    if (t.status === 'Running' || t.status === 'Final Table') {
                        const newProgress = Math.min(100, t.progress + (Math.random() * 2));
                        const playersDrop = Math.floor(Math.random() * 3); // 0-2 players bust
                        const newPlayers = Math.max(2, t.players - playersDrop);

                        let newStatus = t.status;
                        if (newPlayers <= 9 && t.status === 'Running') newStatus = 'Final Table';
                        if (newPlayers <= 1) newStatus = 'Finished';

                        return { ...t, players: newPlayers, status: newStatus, progress: newProgress };
                    }

                    // FINISHED -> Remove eventually (logic handled in next step to replace)
                    return t;
                }).filter(t => {
                    // Remove finished tournaments occasionally to make room for new ones
                    if (t.status === 'Finished' && Math.random() > 0.95) return false;
                    return true;
                });

                // Calculate Derived Global Stats
                const tournamentPlayers = updatedTournaments.reduce((acc, t) => acc + t.players, 0);
                const cashGamePlayers = Math.floor(Math.random() * 1000) + 500; // Mock cash game players
                const totalOnline = tournamentPlayers + cashGamePlayers;
                const totalTables = Math.ceil(cashGamePlayers / 6) + Math.ceil(tournamentPlayers / 9);

                setOnlinePlayers(totalOnline);
                setActiveTables(totalTables);

                return updatedTournaments;

            });
        }, 2000); // Update every 2 seconds

        // Spawner: Add new tournaments if list gets small
        const spawnerTimer = setInterval(() => {
            setTournaments(prev => {
                if (prev.length < 5) {
                    return [...prev, createRandomTournament(Date.now())];
                }
                return prev;
            })
        }, 5000);

        return () => {
            clearInterval(mainTimer);
            clearInterval(spawnerTimer);
        };
    }, []);

    const createRandomTournament = (idSeed: number): Tournament => {
        const template = TOURNAMENT_TEMPLATES[Math.floor(Math.random() * TOURNAMENT_TEMPLATES.length)];
        const statusRoll = Math.random();
        let status: TournamentStatus = 'Registering';
        let progress = 0;
        let players = Math.floor(Math.random() * 100);

        if (statusRoll > 0.7) {
            status = 'Running';
            progress = Math.floor(Math.random() * 80);
            players = Math.floor(template.maxPlayers * 0.8);
        } else if (statusRoll > 0.95) {
            status = 'Finished';
            progress = 100;
            players = 1;
        }

        return {
            id: `tourn-${idSeed}-${Math.random()}`,
            name: template.name,
            gameType: template.gameType,
            buyIn: template.buyIn,
            prizePool: players * template.buyIn * 0.9,
            players: players,
            maxPlayers: template.maxPlayers,
            status: status,
            startTime: 'Now',
            progress: progress,
            type: ['tournament', 'cash', 'sitgo', 'spingo'][Math.floor(Math.random() * 4)] as any
        };
    };

    const registerForTournament = (tournamentId: string) => {
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                return { ...t, players: t.players + 1 };
            }
            return t;
        }));
    };

    return (
        <LiveWorldContext.Provider value={{ onlinePlayers, activeTables, tournaments, registerForTournament }}>
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
