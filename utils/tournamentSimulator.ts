// Real-time tournament and bot simulation system (Production version / Database-Driven)
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
    private isRunning = false;
    private simulationInterval?: any;

    constructor(
        private config = {
            maxConcurrentTournaments: 150,
            simulationSpeed: 5000,
        }
    ) { }

    async seedInitialData() {
        console.log('[SIMULATOR] Checking for existing data...');
        const { count } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });

        if (count === 0) {
            console.log('[SIMULATOR] Seeding initial population (5000 bots)...');

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

            // Create 24h schedule
            await this.generateFixedSchedule();
        }
    }

    private async generateFixedSchedule() {
        console.log('[SIMULATOR] Generating 24/7 Tournament Schedule...');
        const tournaments = [];
        const now = new Date();

        // Create tournaments starting every 10 minutes for more variety
        for (let i = -12; i < 144; i++) {
            const startTime = new Date(now.getTime() + i * 10 * 60000);
            const lateRegUntil = new Date(startTime.getTime() + 30 * 60000);

            // Variety distribution
            const rand = Math.random();
            const type: GameType = rand > 0.8 ? 'tournament' : rand > 0.6 ? 'spingo' : rand > 0.4 ? 'sitgo' : 'cash';

            tournaments.push(this.generateTournamentData(type, startTime, lateRegUntil));
        }

        await supabase.from('tournaments').insert(tournaments);
    }

    private generateTournamentData(type: GameType, startTime: Date, lateRegUntil: Date) {
        const id = `t_${Math.random().toString(36).substr(2, 9)}`;
        const buyInPools = [2, 5, 10, 20, 50, 100, 215, 530, 1050];
        const buyIn = buyInPools[Math.floor(Math.random() * buyInPools.length)];

        // Determine status based on time
        const now = new Date();
        let status: TournamentStatus = 'registering';
        if (now > lateRegUntil) status = 'running';
        else if (now > startTime) status = 'late_reg';

        // Massive field for Tournaments
        const isMajor = type === 'tournament' && Math.random() > 0.7;
        const maxPlayers = type === 'cash' ? 6 : type === 'spingo' ? 3 : type === 'sitgo' ? 9 : 5000;

        return {
            id,
            name: this.generateRealisticName(type, buyIn, startTime, isMajor),
            type,
            status,
            buy_in: buyIn,
            prize_pool: 0, // Calculated dynamically by simulator
            players_count: Math.floor(Math.random() * 5),
            max_players: maxPlayers,
            scheduled_start_time: startTime.toISOString(),
            late_reg_until: lateRegUntil.toISOString(),
            current_blind_level: 1
        };
    }

    private generateRealisticName(type: GameType, buyIn: number, time: Date, isMajor?: boolean): string {
        const hour = time.getHours().toString().padStart(2, '0');
        const min = time.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hour}:${min}`;

        if (type === 'spingo') return `Jackpot Spin & Go $${buyIn}`;
        if (type === 'cash') return `High Stakes NLH ($${buyIn / 100}/$${buyIn / 50})`;
        if (type === 'sitgo') return `Turbo 9-Max Sit & Go $${buyIn}`;

        if (isMajor) return `🏆 THE MEGA MAJOR $${buyIn} [$${(buyIn * 500).toLocaleString()} GTD]`;

        const names = [
            `The Daily Big $${buyIn}`,
            `Turbo Knockout $${buyIn}`,
            `Main Event Satellite $${buyIn}`,
            `Deepstack Bounty $${buyIn}`,
            `${timeStr} Special $${buyIn}`,
            `Nightly Monster Stack $${buyIn}`
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 24/7 Platform Scheduler Active');

        this.simulationInterval = setInterval(async () => {
            await this.processSimulationTick();
            // Process eliminations and conclusions every 2 ticks to feel more steady
            if (Math.random() > 0.5) {
                await this.processGameProgression();
            }
        }, this.config.simulationSpeed);
    }

    stop() {
        this.isRunning = false;
        if (this.simulationInterval) clearInterval(this.simulationInterval);
    }

    private async processSimulationTick() {
        try {
            const now = new Date();
            const { data: activeTournaments } = await supabase
                .from('tournaments')
                .select('*')
                .neq('status', 'finished');

            if (!activeTournaments) return;

            for (const t of activeTournaments) {
                // Check if there are humans in this tournament (prioritize filling)
                const { data: participants } = await supabase.from('tournament_participants').select('user_id').eq('tournament_id', t.id);
                const hasHuman = participants?.some(p => p.user_id !== null);

                const startTime = new Date(t.scheduled_start_time);
                const lateRegUntil = new Date(t.late_reg_until);

                // Update Status based on time
                let newStatus = t.status;
                if (now > lateRegUntil && t.status !== 'running') {
                    if (t.players_count >= 2) newStatus = 'running';
                }
                else if (now > startTime && now <= lateRegUntil && t.status !== 'late_reg') {
                    newStatus = 'late_reg';
                }

                if (newStatus !== t.status) {
                    await supabase.from('tournaments').update({ status: newStatus }).eq('id', t.id);
                    t.status = newStatus;
                }

                // Fill with BOTS if registering or late_reg
                if (t.status === 'registering' || t.status === 'late_reg') {
                    const hour = now.getHours();
                    const isPeak = (hour >= 18 && hour <= 23) || (hour >= 0 && hour <= 2);
                    const trafficMultiplier = isPeak ? 4.0 : 1.5;

                    // INSTANT START FOR SNG/SPINS IF HUMAN JOINED
                    let botsToRegisterCount = 0;
                    if (hasHuman && (t.type === 'sitgo' || t.type === 'spingo')) {
                        botsToRegisterCount = t.max_players - t.players_count;
                    } else {
                        // Massive Waves for Tournaments
                        const fillingChance = hasHuman ? 1.0 : (t.type === 'tournament' ? 0.8 : 0.4);
                        if (Math.random() < fillingChance) {
                            const isMajor = t.name.includes('MAJOR');
                            const baseCount = isMajor ? 30 : (hasHuman ? 12 : 5);
                            botsToRegisterCount = Math.min(
                                Math.floor((Math.random() * baseCount + baseCount) * trafficMultiplier),
                                t.max_players - t.players_count
                            );
                        }
                    }

                    if (botsToRegisterCount > 0) {
                        const { data: availableBots } = await supabase.from('bots').select('id').limit(botsToRegisterCount);
                        if (availableBots && availableBots.length > 0) {
                            const registrationRecords = availableBots.map(bot => ({
                                tournament_id: t.id,
                                bot_id: bot.id,
                                status: 'active'
                            }));

                            await supabase.from('tournament_participants').upsert(registrationRecords, { onConflict: 'tournament_id, bot_id' });

                            // Deductions and Prize updates
                            for (const bot of availableBots) {
                                await supabase.rpc('decrement_bot_balance', { bot_id_param: bot.id, amount_param: t.buy_in });
                            }

                            const newCount = t.players_count + availableBots.length;
                            const newPrizePool = Math.floor(newCount * t.buy_in * 0.95);
                            await supabase.from('tournaments').update({
                                players_count: newCount,
                                prize_pool: t.type === 'cash' ? 0 : newPrizePool
                            }).eq('id', t.id);
                        }
                    }
                }

                // Maintain upcoming schedule
                const futureLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const latestT = activeTournaments.reduce((prev, curr) =>
                    new Date(curr.scheduled_start_time) > new Date(prev.scheduled_start_time) ? curr : prev,
                    activeTournaments[0] || { scheduled_start_time: now.toISOString() }
                );

                if (new Date(latestT.scheduled_start_time) < futureLimit) {
                    const nextTime = new Date(new Date(latestT.scheduled_start_time).getTime() + 15 * 60000);
                    const nextLateReg = new Date(nextTime.getTime() + 30 * 60000);
                    const type: GameType = Math.random() > 0.7 ? 'tournament' : 'cash';
                    await supabase.from('tournaments').insert([this.generateTournamentData(type, nextTime, nextLateReg)]);
                }
            }
        } catch (err) {
            console.error('[SIMULATOR] Tick Error:', err);
        }
    }

    private async processGameProgression() {
        try {
            const { data: runningTournaments } = await supabase
                .from('tournaments')
                .select('*')
                .eq('status', 'running');

            if (!runningTournaments) return;

            for (const t of runningTournaments) {
                // Adaptive elimination speed for massive fields
                let eliminationChance = 0.2;
                let maxToEliminate = 1;

                if (t.players_count > 1000) { eliminationChance = 0.9; maxToEliminate = 50; }
                else if (t.players_count > 500) { eliminationChance = 0.8; maxToEliminate = 30; }
                else if (t.players_count > 100) { eliminationChance = 0.6; maxToEliminate = 15; }
                else if (t.players_count > 50) { eliminationChance = 0.4; maxToEliminate = 5; }
                else if (t.players_count > 10) { eliminationChance = 0.3; maxToEliminate = 2; }

                if (Math.random() < eliminationChance && t.players_count > 3) {
                    const toEliminate = Math.min(Math.floor(Math.random() * maxToEliminate) + 1, t.players_count - 3);
                    const { data: victims } = await supabase
                        .from('tournament_participants')
                        .select('bot_id, user_id')
                        .eq('tournament_id', t.id)
                        .eq('status', 'active')
                        .is('user_id', null)
                        .limit(toEliminate);

                    if (victims && victims.length > 0) {
                        const victimIds = victims.map(v => v.bot_id);
                        await supabase
                            .from('tournament_participants')
                            .update({ status: 'eliminated' })
                            .eq('tournament_id', t.id)
                            .in('bot_id', victimIds);

                        await supabase
                            .from('tournaments')
                            .update({ players_count: t.players_count - victims.length })
                            .eq('id', t.id);
                    }
                }

                const startTime = new Date(t.scheduled_start_time);
                const durationHours = (new Date().getTime() - startTime.getTime()) / (1000 * 60 * 60);
                if (t.players_count <= 3 || durationHours > 3) {
                    await this.concludeTournament(t);
                }
            }
        } catch (err) {
            console.error('[SIMULATOR] Progression Error:', err);
        }
    }

    private async concludeTournament(tournament: any) {
        const { data: finalists } = await supabase
            .from('tournament_participants')
            .select('bot_id, user_id')
            .eq('tournament_id', tournament.id)
            .eq('status', 'active')
            .limit(3);

        if (finalists && finalists.length > 0) {
            const prizeSplits = [0.5, 0.3, 0.2];
            for (let i = 0; i < finalists.length; i++) {
                const prize = Math.floor(tournament.prize_pool * prizeSplits[i]);
                if (finalists[i].bot_id) {
                    await supabase.rpc('increment_bot_balance', {
                        bot_id_param: finalists[i].bot_id,
                        amount_param: prize
                    });
                } else if (finalists[i].user_id) {
                    await supabase.rpc('process_human_win', {
                        user_id_param: finalists[i].user_id,
                        amount_param: prize,
                        tournament_id_param: tournament.id
                    });
                }
            }
        }
        await supabase.from('tournaments').update({ status: 'finished' }).eq('id', tournament.id);
    }
}

let simulatorInstance: TournamentSimulator | null = null;

export const getTournamentSimulator = (config?: any): TournamentSimulator => {
    if (!simulatorInstance) {
        simulatorInstance = new TournamentSimulator(config);
    }
    return simulatorInstance;
};
