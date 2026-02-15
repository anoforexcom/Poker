// Real-time tournament and bot simulation system (Production version / Database-Driven)
import { supabase } from './supabase';

export interface SimulatedBot {
    id: string;
    name: string;
    avatar: string;
    balance: number;
    gamesPlayed: number;
    tournamentsWon: number;
    skill: number;
}

export type GameType = 'tournament' | 'cash' | 'sitgo' | 'spingo';
export type TournamentStatus = 'registering' | 'late_reg' | 'running' | 'finished';

export interface SimulatedTournament {
    id: string;
    name: string;
    type: GameType;
    status: TournamentStatus;
    buyIn: number;
    prizePool: number;
    playersCount: number;
    maxPlayers: number;
    scheduledStartTime: string;
    lateRegUntil: string;
    currentBlindLevel: number;
}

export class TournamentSimulator {
    // Deprecated: Logic moved to Supabase Edge Function (poker-simulator)
    constructor(private config?: any) { }

    async seedInitialData() { console.log('Simulator is now server-side.'); }
    async start() { console.log('Simulator is now server-side.'); }
    stop() { }
}

let simulatorInstance: TournamentSimulator | null = null;

export const getTournamentSimulator = (config?: any): TournamentSimulator => {
    if (!simulatorInstance) {
        simulatorInstance = new TournamentSimulator(config);
    }
    return simulatorInstance;
};
