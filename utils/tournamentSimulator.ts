// Sistema de simulação de torneios e bots em tempo real (Versão de Produção / Database-Driven)
import { supabase } from './supabase';
import { generateBotName } from './nameGenerator';

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

export interface SimulatedTournament {
    id: string;
    name: string;
    type: GameType;
    status: 'registering' | 'running' | 'finished';
    buyIn: number;
    prizePool: number;
    playersCount: number;
    maxPlayers: number;
    startTime: string;
    blindLevel: number;
}

export class TournamentSimulator {
    private isRunning = false;
    private simulationInterval?: any;

    constructor(
        private config = {
            maxConcurrentTournaments: 100, // Increased for larger population
            simulationSpeed: 3000, // Faster sync
        }
    ) { }

    // Semear dados iniciais se o banco estiver vazio
    async seedInitialData() {
        console.log('[SIMULATOR] Checking for existing data...');
        const { count } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });

        if (count === 0) {
            console.log('[SIMULATOR] Seeding initial population (5000 bots)...');

            // 1. Criar Bots em batches
            const totalBots = 5000;
            const batchSize = 500;

            for (let i = 0; i < totalBots; i += batchSize) {
                const bots = Array.from({ length: batchSize }).map((_, j) => {
                    const idx = i + j;
                    return {
                        id: `bot_${idx}`,
                        name: generateBotName(),
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot${idx}`,
                        balance: 5000 + Math.random() * 20000,
                        skill: 20 + Math.random() * 80,
                    };
                });
                await supabase.from('bots').upsert(bots);
            }

            // 2. Criar Torneios Iniciais (Mais variedade)
            const initialTournaments = [];
            for (let i = 0; i < 20; i++) {
                initialTournaments.push(this.generateTournamentData('tournament'));
                initialTournaments.push(this.generateTournamentData('cash'));
                initialTournaments.push(this.generateTournamentData('sitgo'));
                initialTournaments.push(this.generateTournamentData('spingo'));
            }
            await supabase.from('tournaments').insert(initialTournaments);
        }
    }

    private generateTournamentData(type: GameType) {
        const id = `t_${Math.random().toString(36).substr(2, 9)}`;
        const buyInPools = [2, 5, 10, 20, 50, 100];
        const buyIn = buyInPools[Math.floor(Math.random() * buyInPools.length)];

        return {
            id,
            name: this.generateTournamentName(type),
            type,
            status: 'registering',
            buy_in: buyIn,
            prize_pool: 0,
            players_count: Math.floor(Math.random() * 5),
            max_players: type === 'cash' ? 6 : type === 'spingo' ? 3 : 18,
            blind_level: 1
        };
    }

    private generateTournamentName(type: GameType): string {
        const locations = ['Monaco', 'Vegas', 'Macau', 'Kyoto', 'London', 'Rio'];
        const suffixes = ['Daily', 'Turbo', 'Championship', 'Masters', 'Showdown'];
        if (type === 'spingo') return 'Jackpot Spin & Go';
        if (type === 'cash') return `${locations[Math.floor(Math.random() * locations.length)]} High Stakes`;
        return `${locations[Math.floor(Math.random() * locations.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 DB Simulator Started');

        this.simulationInterval = setInterval(async () => {
            await this.processSimulationTick();
        }, this.config.simulationSpeed);
    }

    stop() {
        this.isRunning = false;
        if (this.simulationInterval) clearInterval(this.simulationInterval);
    }

    private async processSimulationTick() {
        try {
            // 1. Fetch active tournaments
            const { data: activeTournaments } = await supabase
                .from('tournaments')
                .select('*')
                .neq('status', 'finished');

            if (!activeTournaments) return;

            for (const t of activeTournaments) {
                // Registering tournaments fill up with BOTS
                if (t.status === 'registering') {
                    // Fill faster if near full or just random chance
                    const fillingChance = t.players_count > 0 ? 0.6 : 0.4;
                    if (t.players_count < t.max_players && Math.random() > (1 - fillingChance)) {
                        const botsToRegisterCount = Math.min(Math.floor(Math.random() * 4) + 1, t.max_players - t.players_count);

                        // Fetch random bots that are not already in this tournament
                        const { data: availableBots } = await supabase
                            .from('bots')
                            .select('id')
                            .limit(100); // Sample pool

                        if (availableBots && availableBots.length > 0) {
                            const selectedBots = availableBots
                                .sort(() => Math.random() - 0.5)
                                .slice(0, botsToRegisterCount);

                            const registrationRecords = selectedBots.map(bot => ({
                                tournament_id: t.id,
                                bot_id: bot.id
                            }));

                            // Insert participants (handle duplicates silently via upsert or just ignore)
                            await supabase.from('tournament_participants').upsert(registrationRecords, { onConflict: 'tournament_id, bot_id' });

                            const newCount = Math.min(t.players_count + selectedBots.length, t.max_players);
                            const newPrizePool = t.type === 'spingo'
                                ? (newCount === t.max_players ? t.buy_in * (Math.random() > 0.9 ? 10 : 3) : 0)
                                : (newCount * t.buy_in * 0.9);

                            await supabase
                                .from('tournaments')
                                .update({
                                    players_count: newCount,
                                    prize_pool: Number(newPrizePool.toFixed(2))
                                })
                                .eq('id', t.id);
                        }
                    } else if (t.players_count >= t.max_players) {
                        await supabase
                            .from('tournaments')
                            .update({ status: 'running' })
                            .eq('id', t.id);
                    }
                }

                // Running tournaments slowly finish
                if (t.status === 'running' && Math.random() > 0.8) {
                    // Pick a random bot as winner
                    const { data: winnerBot } = await supabase
                        .from('bots')
                        .select('*')
                        .limit(1)
                        .single();

                    if (winnerBot) {
                        await supabase
                            .from('tournaments')
                            .update({
                                status: 'finished',
                                // Note: Schema doesn't have winner_id, but we could add it or just log it
                            })
                            .eq('id', t.id);

                        // Update bot stats
                        await supabase
                            .from('bots')
                            .update({
                                balance: Number(winnerBot.balance) + Number(t.prize_pool),
                                tournaments_won: winnerBot.tournaments_won + 1,
                                games_played: winnerBot.games_played + 1
                            })
                            .eq('id', winnerBot.id);
                    }
                }
            }

            // 2. Spawn new tournaments if low or gaps found
            const types: GameType[] = ['tournament', 'cash', 'sitgo', 'spingo'];
            const buyInRanges = [2, 10, 50, 100]; // Micro, Low, Mid, High representative buyins

            // Ensure a healthy minimum total (increased for scale)
            if (activeTournaments.length < 50) {
                const typeToFill = types[Math.floor(Math.random() * types.length)];
                const buyInToFill = buyInRanges[Math.floor(Math.random() * buyInRanges.length)];

                const newT = this.generateTournamentData(typeToFill);
                newT.buy_in = buyInToFill;
                await supabase.from('tournaments').insert([newT]);
                console.log(`[SIMULATOR] Spawning ${typeToFill} ($${buyInToFill}) to maintain density.`);
            }

            // Specific "Gap" check - ensures no filter is EVER empty
            for (const type of types) {
                const typeGames = activeTournaments.filter(t => t.type === type);

                // If any type has less than 8 games, spawn one immediately
                if (typeGames.length < 8) {
                    const newT = this.generateTournamentData(type);
                    await supabase.from('tournaments').insert([newT]);
                }

                // Check for buy-in variety within the type
                for (const range of buyInRanges) {
                    const hasMatch = typeGames.some(t => {
                        if (range === 2) return t.buy_in < 5;
                        if (range === 10) return t.buy_in >= 5 && t.buy_in < 20;
                        if (range === 50) return t.buy_in >= 20 && t.buy_in < 100;
                        return t.buy_in >= 100;
                    });

                    if (!hasMatch) {
                        const newT = this.generateTournamentData(type);
                        newT.buy_in = range;
                        await supabase.from('tournaments').insert([newT]);
                        console.log(`[SIMULATOR] Gap found! Spawning ${type} at $${range} range.`);
                    }
                }
            }

        } catch (err) {
            console.error('[SIMULATOR] Tick Error:', err);
        }
    }
}

let simulatorInstance: TournamentSimulator | null = null;

export const getTournamentSimulator = (config?: any): TournamentSimulator => {
    if (!simulatorInstance) {
        simulatorInstance = new TournamentSimulator(config);
    }
    return simulatorInstance;
};
