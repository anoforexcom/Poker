import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../utils/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface PokerTable {
    id: string;
    name: string;
    type: 'cash';
    buyIn: number;
    players: number;
    maxPlayers: number;
    status: 'active' | 'waiting';
    stakes: string;
}

interface LiveWorldContextType {
    tables: PokerTable[];
    onlinePlayers: number;
    activeTables: number;
    manualPulse: () => Promise<void>;
}

const LiveWorldContext = createContext<LiveWorldContextType | undefined>(undefined);

// Default "Single Table" for Cash Games
const INITIAL_CASH_GAME: PokerTable = {
    id: 'main_table',
    name: 'High Stakes Cash Game',
    type: 'cash',
    buyIn: 100,
    players: 4,
    maxPlayers: 6,
    status: 'active',
    stakes: '$1/$2'
};

export const LiveWorldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tables, setTables] = useState<PokerTable[]>([INITIAL_CASH_GAME]);
    const [onlinePlayers, setOnlinePlayers] = useState(1284); // Mock or simplified count

    useEffect(() => {
        // In the future, this would listen to a 'tables' collection in Firestore
        // const q = query(collection(db, 'tables'), where('type', '==', 'cash'));
        // const unsubscribe = onSnapshot(q, (snapshot) => {
        //     const loadedTables: PokerTable[] = [];
        //     snapshot.forEach(doc => loadedTables.push({ id: doc.id, ...doc.data() } as PokerTable));
        //     setTables(loadedTables.length > 0 ? loadedTables : [INITIAL_CASH_GAME]);
        // });
        // return () => unsubscribe();

        // For now, setting a small interval to simulate world activity
        const interval = setInterval(() => {
            setOnlinePlayers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const manualPulse = async () => {
        console.log('[LIVEWORLD] Pulse triggered (simplified)');
    };

    return (
        <LiveWorldContext.Provider value={{
            tables,
            onlinePlayers,
            activeTables: tables.length,
            manualPulse
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
