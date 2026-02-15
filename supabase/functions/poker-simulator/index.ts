import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🚀 Poker Simulator Edge Function Started");

serve(async (req) => {
    try {
        const { action } = await req.json();

        if (action === 'tick') {
            await processSimulationTick();
            await processGameProgression();
            return new Response(JSON.stringify({ success: true, message: 'Tick processed' }), { headers: { "Content-Type": "application/json" } });
        }

        if (action === 'seed') {
            await seedInitialData();
            return new Response(JSON.stringify({ success: true, message: 'Seeding triggered' }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});

const SUITS = ['s', 'h', 'd', 'c'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

function createDeck(): string[] {
    const deck: string[] = [];
    for (const s of SUITS) {
        for (const v of VALUES) {
            deck.push(v + s);
        }
    }
    return deck;
}

function shuffleDeck(deck: string[]): string[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Basic Poker Hand Evaluator (Simplified for Phase 3 start)
function evaluateHandStrength(cards: string[]): number {
    // Logic to return a score for a 7-card hand (5 best)
    // This will be expanded in Phase 4. Currently returns high-card score.
    return cards.length;
}

async function seedInitialData() {
    console.log("[SIMULATOR] Starting data synchronization...");

    const { count: botCount } = await supabase.from('bots').select('*', { count: 'exact', head: true });

    if (botCount === null || botCount < 3000) {
        const targetCount = 3000;
        const needed = targetCount - (botCount || 0);
        const batchSize = 100;

        for (let i = 0; i < needed; i += batchSize) {
            const count = Math.min(batchSize, needed - i);
            const bots = Array.from({ length: count }).map((_, j) => {
                const idx = (botCount || 0) + i + j;
                return {
                    id: `bot_${idx}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: `Bot ${idx}`, // Simple name for now or port nameGenerator
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot${idx}`,
                    balance: 10000,
                    skill: 50
                };
            });
            await supabase.from('bots').upsert(bots);
        }
    }

    const { count: tournCount } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
    if (tournCount === 0) {
        // Basic schedule generation logic...
        const tournaments = [];
        const now = new Date();
        for (let i = 0; i < 24; i++) {
            const startTime = new Date(now.getTime() + i * 60 * 60000);
            tournaments.push({
                id: `t_${Math.random().toString(36).substr(2, 9)}`,
                name: `Daily Turbo $10`,
                status: 'registering',
                buy_in: 10,
                prize_pool: 0,
                players_count: 0,
                max_players: 500,
                scheduled_start_time: startTime.toISOString(),
                late_reg_until: new Date(startTime.getTime() + 30 * 60000).toISOString(),
                current_blind_level: 1
            });
        }
        await supabase.from('tournaments').insert(tournaments);
    }
}

async function processSimulationTick() {
    const now = new Date();
    const { data: activeTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'finished')
        .limit(20);

    if (!activeTournaments) return;

    for (const t of activeTournaments) {
        const startTime = new Date(t.scheduled_start_time);
        const lateRegUntil = new Date(t.late_reg_until);

        let newStatus = t.status;
        if (now > lateRegUntil && t.status !== 'running') newStatus = 'running';
        else if (now > startTime && now <= lateRegUntil && t.status !== 'late_reg' && t.status !== 'running') newStatus = 'late_reg';

        if (newStatus !== t.status) {
            await supabase.from('tournaments').update({ status: newStatus }).eq('id', t.id);
        }

        // INITIALIZE GAME STATE (Ensures all 'running' tournaments have a state)
        if (t.status === 'running' || newStatus === 'running') {
            const { data: stateCheck } = await supabase.from('game_states').select('id').eq('tournament_id', t.id).maybeSingle();
            if (!stateCheck) {
                const deck = shuffleDeck(createDeck());
                await supabase.from('game_states').insert({
                    tournament_id: t.id,
                    deck: deck,
                    phase: 'pre-flop',
                    community_cards: []
                });
            }
        }

        // Bot filling logic
        if (t.status === 'registering' || t.status === 'late_reg') {
            if (Math.random() > 0.4) {
                const { data: bot } = await supabase.from('bots').select('id').limit(1).single();
                if (bot) {
                    await supabase.from('tournament_participants').upsert({
                        tournament_id: t.id,
                        bot_id: bot.id,
                        status: 'active'
                    });
                }
            }
        }

        // Process Active Hands
        if (t.status === 'running') {
            await processTournamentHand(t);
        }
    }
}

// Professional Poker Hand Evaluator
function evaluateHand(cards: string[]): { score: number, name: string } {
    if (cards.length < 5) return { score: 0, name: 'Invalid' };

    const valueMap = '23456789TJQKA';
    const parsedCards = cards.map(c => ({
        val: valueMap.indexOf(c[0]),
        suit: c[1]
    })).sort((a, b) => b.val - a.val);

    // 1. Check Flush
    const suitsCount: any = {};
    parsedCards.forEach(c => suitsCount[c.suit] = (suitsCount[c.suit] || 0) + 1);
    const flushSuit = Object.keys(suitsCount).find(s => suitsCount[s] >= 5);
    const flushCards = flushSuit ? parsedCards.filter(c => c.suit === flushSuit).slice(0, 5) : null;

    // 2. Check Straight
    const uniqueVals = Array.from(new Set(parsedCards.map(c => c.val))).sort((a, b) => b - a);
    let straightHigh = -1;
    for (let i = 0; i <= uniqueVals.length - 5; i++) {
        if (uniqueVals[i] - uniqueVals[i + 4] === 4) {
            straightHigh = uniqueVals[i];
            break;
        }
    }
    // Ace-low straight (A,2,3,4,5)
    if (straightHigh === -1 && [12, 3, 2, 1, 0].every(v => uniqueVals.includes(v))) {
        straightHigh = 3;
    }

    // 3. Check Counts (Pairs, Trips, Quads)
    const counts: any = {};
    parsedCards.forEach(c => counts[c.val] = (counts[c.val] || 0) + 1);
    const valEntries = Object.entries(counts).map(([v, c]) => ({ val: parseInt(v), count: c as number }))
        .sort((a, b) => b.count - a.count || b.val - a.val);

    const hasQuads = valEntries[0].count === 4;
    const hasTrips = valEntries[0].count === 3;
    const hasPair = valEntries[0].count === 2;
    const hasTwoPair = valEntries[0].count === 2 && valEntries[1]?.count === 2;
    const hasFullHouse = hasTrips && valEntries[1]?.count >= 2;

    // SCORING (HandType << 24)
    if (flushCards && straightHigh !== -1 && flushCards[0].val === straightHigh) return { score: (9 << 24) + straightHigh, name: 'Straight Flush' };
    if (hasQuads) return { score: (8 << 24) + (valEntries[0].val << 4) + valEntries[1].val, name: 'Quadra' };
    if (hasFullHouse) return { score: (7 << 24) + (valEntries[0].val << 4) + valEntries[1].val, name: 'Full House' };
    if (flushCards) {
        const flushScore = flushCards.reduce((acc, c, i) => acc + (c.val << (16 - i * 4)), 0);
        return { score: (6 << 24) + flushScore, name: 'Flush' };
    }
    if (straightHigh !== -1) return { score: (5 << 24) + straightHigh, name: 'Straight' };
    if (hasTrips) return { score: (4 << 24) + (valEntries[0].val << 8) + (valEntries[1].val << 4) + valEntries[2].val, name: 'Trio' };
    if (hasTwoPair) return { score: (3 << 24) + (valEntries[0].val << 8) + (valEntries[1].val << 4) + valEntries[2].val, name: 'Dois Pares' };
    if (hasPair) return { score: (2 << 24) + (valEntries[0].val << 12) + (valEntries[1].val << 8) + (valEntries[2].val << 4) + valEntries[3].val, name: 'Par' };

    const highCardScore = parsedCards.slice(0, 5).reduce((acc, c, i) => acc + (c.val << (16 - i * 4)), 0);
    return { score: (1 << 24) + highCardScore, name: 'High Card' };
}

// Side Pot Calculation Logic
function calculateSidePots(contributions: { id: string, amount: number }[]): { amount: number, eligible: string[] }[] {
    const pots: { amount: number, eligible: string[] }[] = [];
    const sorted = [...contributions].filter(c => c.amount > 0).sort((a, b) => a.amount - b.amount);

    let previousLevel = 0;
    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const diff = current.amount - previousLevel;
        if (diff > 0) {
            const potAmount = diff * (sorted.length - i);
            const eligible = sorted.slice(i).map(p => p.id);
            pots.push({ amount: potAmount, eligible });
            previousLevel = current.amount;
        }
    }
    return pots;
}

async function processTournamentHand(tournament: any) {
    const { data: state } = await supabase
        .from('game_states')
        .select('*')
        .eq('tournament_id', tournament.id)
        .single();

    if (!state) return;

    const phases = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
    const currentIndex = phases.indexOf(state.phase);

    if (currentIndex < phases.length - 1) {
        const nextPhase = phases[currentIndex + 1];
        let community = [...state.community_cards];
        let deck = [...state.deck];

        if (nextPhase === 'flop') community.push(deck.pop()!, deck.pop()!, deck.pop()!);
        else if (nextPhase === 'turn') community.push(deck.pop()!);
        else if (nextPhase === 'river') community.push(deck.pop()!);

        await supabase.from('game_states').update({
            phase: nextPhase,
            community_cards: community,
            deck: deck
        }).eq('id', state.id);
    } else {
        // SHOWDOWN (Professional Logic)
        const { data: participants } = await supabase
            .from('tournament_participants')
            .select('*')
            .eq('tournament_id', tournament.id)
            .eq('status', 'active');

        if (participants && participants.length > 1) {
            // 1. Evaluate Hands
            const results = participants.map((p: any) => {
                const holeCards = [state.deck[0], state.deck[1]];
                const fullHand = [...state.community_cards, ...holeCards];
                const evaluation = evaluateHand(fullHand);
                return {
                    id: p.user_id || p.bot_id,
                    score: evaluation.score,
                    handName: evaluation.name,
                    contribution: 100 // Mock contribution for now
                };
            });

            // 2. Calculate Side Pots
            const sidePots = calculateSidePots(results.map(r => ({ id: r.id, amount: r.contribution })));

            // 3. Determine winners for each pot
            const winners = sidePots.map(pot => {
                const eligibleResults = results.filter(r => pot.eligible.includes(r.id));
                eligibleResults.sort((a, b) => b.score - a.score);
                return { potAmount: pot.amount, winnerId: eligibleResults[0].id, hand: eligibleResults[0].handName };
            });

            // Save Hand History
            await supabase.from('game_hand_history').insert({
                tournament_id: tournament.id,
                hand_number: Math.floor(Date.now() / 1000),
                results: {
                    pots: winners,
                    community_cards: state.community_cards,
                    total_pot: sidePots.reduce((acc, p) => acc + p.amount, 0)
                }
            });

            // Elimination Logic
            results.sort((a, b) => a.score - b.score);
            const loser = results[0];
            const participantLoser = participants.find(p => (p.user_id || p.bot_id) === loser.id);
            if (participantLoser && participantLoser.bot_id) {
                await supabase.from('tournament_participants').update({ status: 'eliminated' }).eq('id', participantLoser.id);
            }
        }

        // Start Next Hand
        const newDeck = shuffleDeck(createDeck());
        await supabase.from('game_states').update({
            phase: 'pre-flop',
            community_cards: [],
            deck: newDeck,
            current_pot: 0
        }).eq('id', state.id);
    }
}

async function processGameProgression() {
    // Simple elimination logic
    const { data: running } = await supabase.from('tournaments')
        .select('id, prize_pool')
        .eq('status', 'running')
        .limit(10);

    if (!running) return;

    for (const t of running) {
        const { data: alive } = await supabase.from('tournament_participants')
            .select('user_id, bot_id')
            .eq('tournament_id', t.id)
            .eq('status', 'active');

        if (alive && alive.length === 1) {
            const winner = alive[0];
            // Conclude tournament
            await supabase.from('tournaments').update({ status: 'finished' }).eq('id', t.id);

            // Pay winner
            if (winner.user_id) {
                await supabase.rpc('process_human_win', {
                    user_id_param: winner.user_id,
                    amount_param: t.prize_pool || 0,
                    tournament_id_param: t.id
                });
            }
        } else if (alive && alive.length > 1) { // Only eliminate if more than one player is active
            if (Math.random() > 0.7) {
                const { data: victim } = await supabase.from('tournament_participants')
                    .select('bot_id')
                    .eq('tournament_id', t.id)
                    .eq('status', 'active')
                    .is('user_id', null)
                    .limit(1)
                    .single();

                if (victim) {
                    await supabase.from('tournament_participants').update({ status: 'eliminated' }).eq('tournament_id', t.id).eq('bot_id', victim.bot_id);
                }
            }
        }
    }
}
