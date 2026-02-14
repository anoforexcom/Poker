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

        // Create tournaments starting every 15 minutes for the next 24 hours
        for (let i = -4; i < 96; i++) { // From 1 hour ago to 24 hours ahead
            const startTime = new Date(now.getTime() + i * 15 * 60000);
            const lateRegUntil = new Date(startTime.getTime() + 30 * 60000); // 30 mins late reg

            const type: GameType = i % 4 === 0 ? 'tournament' : i % 4 === 1 ? 'cash' : i % 4 === 2 ? 'sitgo' : 'spingo';

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

        return {
            id,
            name: this.generateRealisticName(type, buyIn, startTime),
            type,
            status,
            buy_in: buyIn,
            prize_pool: type === 'cash' ? 0 : (Math.floor(Math.random() * 10 + 5) * buyIn * 0.95),
            players_count: Math.floor(Math.random() * 10),
            max_players: type === 'cash' ? 6 : type === 'spingo' ? 3 : 9999, // 9999 = Unlimited for Tournaments
            scheduled_start_time: startTime.toISOString(),
            late_reg_until: lateRegUntil.toISOString(),
            current_blind_level: 1
        };
    }

    private generateRealisticName(type: GameType, buyIn: number, time: Date): string {
        const hour = time.getHours().toString().padStart(2, '0');
        const min = time.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hour}:${min}`;

        if (type === 'spingo') return `Jackpot Spin & Go $${buyIn}`;
        if (type === 'cash') return `High Stakes NLH ($${buyIn / 100}/$${buyIn / 50})`;

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
                    // Time-of-day Traffic Simulation (Peak vs Off-Peak)
                    const hour = now.getHours();
                    const isPeak = (hour >= 18 && hour <= 23) || (hour >= 0 && hour <= 2); // 6pm to 2am peak
                    const trafficMultiplier = isPeak ? 2.5 : 1.0;

                    const fillingChance = hasHuman ? 1.0 : ((t.status === 'late_reg' ? 0.2 : 0.4) * trafficMultiplier);
                    if (t.players_count < t.max_players && Math.random() < fillingChance) {
                        const isAlmostEmpty = t.players_count < 2;
                        const baseCount = hasHuman ? (isAlmostEmpty ? 8 : 4) : (isAlmostEmpty ? 2 : 1);
                        const botsToRegisterCount = Math.min(
                            Math.floor((Math.random() * 5 + baseCount) * trafficMultiplier),
                            t.max_players - t.players_count
                        );

                        const { data: availableBots } = await supabase.from('bots').select('id').limit(100);
                        if (availableBots) {
                            const selectedBots = availableBots.sort(() => Math.random() - 0.5).slice(0, botsToRegisterCount);
                            const registrationRecords = selectedBots.map(bot => ({
                                tournament_id: t.id,
                                bot_id: bot.id,
                                status: 'active'
                            }));

                            await supabase.from('tournament_participants').upsert(registrationRecords, { onConflict: 'tournament_id, bot_id' });

                            // DEDUCT BUY-INS FROM BOTS
                            for (const bot of selectedBots) {
                                await supabase.rpc('decrement_bot_balance', { bot_id_param: bot.id, amount_param: t.buy_in });
                            }

                            const newCount = t.players_count + selectedBots.length;
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
                const eliminationChance = t.players_count > 50 ? 0.8 : (t.players_count > 10 ? 0.4 : 0.2);

                if (Math.random() < eliminationChance && t.players_count > 3) {
                    const toEliminate = Math.min(Math.floor(Math.random() * 3) + 1, t.players_count - 3);
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
                if (t.players_count <= 3 || durationHours > 2) {
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
                    await supabase.rpc('increment_profile_balance', {
                        user_id_param: finalists[i].user_id,
                        amount_param: prize
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
