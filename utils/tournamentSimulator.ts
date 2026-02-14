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
                    // Only start if at least 2 players
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
                    // 100% chance if human is waiting, otherwise normal chance
                    const fillingChance = hasHuman ? 1.0 : (t.status === 'late_reg' ? 0.2 : 0.5);
                    if (t.players_count < t.max_players && Math.random() < fillingChance) {
                        // Increase registration speed significantly if human is waiting
                        const isAlmostEmpty = t.players_count < 2;
                        const baseCount = hasHuman ? (isAlmostEmpty ? 8 : 4) : (isAlmostEmpty ? 2 : 1);
                        const botsToRegisterCount = Math.min(Math.floor(Math.random() * 5) + baseCount, t.max_players - t.players_count);

                        const { data: availableBots } = await supabase.from('bots').select('id').limit(100);
                        if (availableBots) {
                            const selectedBots = availableBots.sort(() => Math.random() - 0.5).slice(0, botsToRegisterCount);
                            const registrationRecords = selectedBots.map(bot => ({
                                tournament_id: t.id,
                                bot_id: bot.id,
                                status: 'active'
                            }));

                            await supabase.from('tournament_participants').upsert(registrationRecords, { onConflict: 'tournament_id, bot_id' });

                            const newCount = t.players_count + selectedBots.length;
                            await supabase.from('tournaments').update({
                                players_count: newCount,
                                prize_pool: t.type === 'cash' ? 0 : (newCount * t.buy_in * 0.95)
                            }).eq('id', t.id);
                        }
                    }
                }

                // Dynamic Prize Pool Sync (Ensure it always stays updated)
                if (t.type !== 'cash') {
                    const currentPrize = Math.floor(t.players_count * t.buy_in * 0.95);
                    if (Math.abs(t.prize_pool - currentPrize) > 1) {
                        await supabase.from('tournaments').update({ prize_pool: currentPrize }).eq('id', t.id);
                    }
                }

                // Randomly finish old running tournaments (3+ hours old)
                if (t.status === 'running' && (now.getTime() - startTime.getTime()) > 3 * 60 * 60 * 1000) {
                    if (Math.random() > 0.7) {
                        await supabase.from('tournaments').update({ status: 'finished' }).eq('id', t.id);
                        // Record winner logic omitted for brevity, but could pick top participant
                    }
                }
            }

            // Maintain upcoming schedule (Ensure 24h ahead always filled)
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
