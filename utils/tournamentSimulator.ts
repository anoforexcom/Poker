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
        console.log('[SIMULATOR] Starting data synchronization...');
        try {
            const { count: tournCount, error: tournErr } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
            const { count: botCount, error: botErr } = await supabase.from('bots').select('*', { count: 'exact', head: true });

            if (tournErr) console.error('[SIMULATOR] Error checking tournaments:', tournErr);
            if (botErr) console.error('[SIMULATOR] Error checking bots:', botErr);

            console.log(`[SIMULATOR] Current stats: ${tournCount} tournaments, ${botCount} bots.`);

            // Seed Bots if missing or insufficient
            if (botCount === null || botCount < 3000) {
                const targetCount = 3000;
                console.log(`[SIMULATOR] Population low (${botCount}/${targetCount}). Seeding bots...`);
                const needed = targetCount - (botCount || 0);
                const batchSize = 100;

                for (let i = 0; i < needed; i += batchSize) {
                    const count = Math.min(batchSize, needed - i);
                    console.log(`[SIMULATOR] Generating batch of ${count} bots (${i + (botCount || 0)}/${targetCount})...`);

                    const bots = Array.from({ length: count }).map((_, j) => {
                        const idx = (botCount || 0) + i + j;
                        return {
                            id: `bot_${idx}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // More unique
                            name: generateBotName(),
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot${idx}`,
                            balance: 5000 + Math.random() * 20000,
                            skill: 20 + Math.random() * 80,
                        };
                    });

                    const { error: upsertErr } = await supabase.from('bots').upsert(bots);
                    if (upsertErr) {
                        console.error(`[SIMULATOR] Batch upsert failed at index ${i}:`, upsertErr);
                        break; // Stop if we hit an error to avoid infinite loops or spam
                    }
                }
                console.log('[SIMULATOR] Bot seeding completed.');
            }

            // Seed Tournaments if missing
            if (tournCount === 0) {
                console.log('[SIMULATOR] No tournaments found. Generating initial schedule...');
                await this.generateFixedSchedule();
            }
        } catch (err) {
            console.error('[SIMULATOR] Fatal error during seeding:', err);
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

        console.log(`[SIMULATOR] Inserting ${tournaments.length} initial tournaments...`);
        const { data: insertedTournaments, error } = await supabase.from('tournaments').insert(tournaments).select();

        if (error) {
            console.error('[SIMULATOR] Error generating schedule:', error);
            return;
        }

        console.log(`[SIMULATOR] Successfully inserted ${insertedTournaments?.length} tournaments.`);

        // CRITICAL FIX: Insert actual participant rows for the pre-filled counts
        if (insertedTournaments && insertedTournaments.length > 0) {
            const participantsToInsert: any[] = [];
            const { data: allBots } = await supabase.from('bots').select('id').limit(3000);

            if (!allBots || allBots.length === 0) {
                console.warn('[SIMULATOR] No bots found to assign to initial tournaments.');
                return;
            }

            console.log(`[SIMULATOR] Assigning ${allBots.length} potential bots to tournaments...`);
            let botIndex = 0;

            for (const tourney of insertedTournaments) {
                if (tourney.players_count > 0) {
                    const count = tourney.players_count;
                    for (let i = 0; i < count; i++) {
                        if (botIndex >= allBots.length) botIndex = 0;
                        participantsToInsert.push({
                            tournament_id: tourney.id,
                            bot_id: allBots[botIndex].id,
                            status: 'active',
                            stack: (tourney.buy_in || 10) * 100
                        });
                        botIndex++;
                    }
                }
            }

            if (participantsToInsert.length > 0) {
                console.log(`[SIMULATOR] Inserting ${participantsToInsert.length} initial participants...`);
                const chunkSize = 1000;
                for (let i = 0; i < participantsToInsert.length; i += chunkSize) {
                    const chunk = participantsToInsert.slice(i, i + chunkSize);
                    const { error: partErr } = await supabase.from('tournament_participants').insert(chunk);
                    if (partErr) console.error('[SIMULATOR] Error inserting participants chunk:', partErr);
                }
            }
        }
    }

    private generateTournamentData(type: GameType, startTime: Date, lateRegUntil: Date) {
        const id = `t_${Math.random().toString(36).substr(2, 9)}`;
        const buyInPools = [2, 5, 10, 20, 50, 100, 215, 530, 1050];
        const buyIn = buyInPools[Math.floor(Math.random() * buyInPools.length)];

        // Determine status based on time
        const now = new Date();
        let status: TournamentStatus = 'registering';
        let initialPlayers = 0;

        if (now > lateRegUntil) {
            status = 'running';
            initialPlayers = Math.floor(Math.random() * 150) + 20;
        }
        else if (now > startTime) {
            status = 'late_reg';
            initialPlayers = Math.floor(Math.random() * 80) + 10;
        } else {
            initialPlayers = Math.floor(Math.random() * 15);
        }

        const maxPlayers = type === 'cash' ? 6 : type === 'spingo' ? 3 : type === 'sitgo' ? 9 : 5000;
        initialPlayers = Math.min(initialPlayers, maxPlayers);

        return {
            id,
            name: this.generateRealisticName(type, buyIn, startTime, type === 'tournament' && Math.random() > 0.7),
            type,
            status,
            buy_in: buyIn,
            prize_pool: initialPlayers * buyIn,
            players_count: initialPlayers,
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
        console.log('🚀 Tournament Simulator Engine Started');

        this.simulationInterval = setInterval(async () => {
            console.log('[SIMULATOR] Ticking...');
            await this.processSimulationTick();
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
                const minPlayersToStart = t.type === 'spingo' ? 3 : 2;

                if (now > lateRegUntil && t.status !== 'running') {
                    // Force start if time passed, even if empty (fill with bots below)
                    newStatus = 'running';
                }
                else if (now > startTime && now <= lateRegUntil && t.status !== 'late_reg' && t.status !== 'running') {
                    // If it's start time, we should run or be in late reg
                    // If we have enough players, run. If not, maybe late reg or fill.
                    if (t.players_count >= minPlayersToStart) {
                        newStatus = 'running';
                    } else {
                        newStatus = 'late_reg';
                    }
                }

                if (newStatus !== t.status) {
                    await supabase.from('tournaments').update({ status: newStatus }).eq('id', t.id);
                    t.status = newStatus;
                }

                // CRITICAL: Force-fill bots if we are supposed to be RUNNING but have no players
                if (newStatus === 'running' && t.players_count < minPlayersToStart) {
                    const deficit = minPlayersToStart - t.players_count + Math.floor(Math.random() * 5); // Add minimum + some extras
                    // Trigger fill logic below specifically for this case
                    t.status = 'late_reg'; // Temporarily treat as late_reg to trigger the bot filler block below
                }

                // Fill with BOTS if registering or late_reg
                if (t.status === 'registering' || t.status === 'late_reg') {
                    const hour = now.getHours();
                    const isPeak = (hour >= 18 && hour <= 23) || (hour >= 0 && hour <= 2);
                    const trafficMultiplier = isPeak ? 8.0 : 3.5; // significantly increased for ~3000 online

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
            }

            // Maintain upcoming schedule (OUTSIDE the per-tournament loop)
            const futureLimit = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12h ahead for performance

            // Get the latest scheduled start time from all tournaments (active or finished) to keep the rhythm
            const { data: latestTournaments } = await supabase
                .from('tournaments')
                .select('scheduled_start_time')
                .order('scheduled_start_time', { ascending: false })
                .limit(1);

            let latestStartTime = latestTournaments?.[0]?.scheduled_start_time
                ? new Date(latestTournaments[0].scheduled_start_time)
                : now;

            // If the schedule is in the past, jump to now
            if (latestStartTime < now) {
                latestStartTime = now;
            }

            if (latestStartTime < futureLimit) {
                const tournamentsToGenerate: any[] = [];
                // Generate enough tournaments to reach future limit (capped at 20 per tick)
                while (latestStartTime < futureLimit && tournamentsToGenerate.length < 20) {
                    const nextTime = new Date(latestStartTime.getTime() + 15 * 60000);
                    const nextLateReg = new Date(nextTime.getTime() + 30 * 60000);
                    const type: GameType = Math.random() > 0.7 ? 'tournament' : 'cash';
                    tournamentsToGenerate.push(this.generateTournamentData(type, nextTime, nextLateReg));
                    latestStartTime = nextTime;
                }

                if (tournamentsToGenerate.length > 0) {
                    await supabase.from('tournaments').insert(tournamentsToGenerate);
                    console.log(`[SIMULATOR] Generated ${tournamentsToGenerate.length} new tournaments to catch up.`);
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
