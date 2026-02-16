import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import pokersolver from "https://esm.sh/pokersolver@2.1.2";
const { Hand } = pokersolver;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🚀 Poker Simulator Edge Function Started");

// LOCK & CONCURRENCY HELPERS
async function acquireLock(key: string, durationInitialMap = 60) {
    // Attempt to acquire lock via DB function
    // Since we don't have direct SQL connection for session-level advisory locks,
    // we use a table-based lock with expiration.
    const { data, error } = await supabase.rpc('acquire_system_lock', {
        target_key: key,
        duration_seconds: durationInitialMap
    });

    if (error) {
        console.error('Lock Error:', error);
        return false;
    }
    return data; // true if acquired, false if denied
}

async function releaseLock(key: string) {
    await supabase.rpc('release_system_lock', { target_key: key });
}

serve(async (req) => {
    try {
        let action = 'tick';
        let payload = {};

        try {
            const body = await req.json();
            if (body.action) action = body.action;
            payload = body;
        } catch (e) {
            // Body is empty or not JSON, default to 'tick'
            console.log('No JSON body provided, defaulting to action: tick');
        }

        // ADVISORY LOCK (Simulation Tick Only)
        // Prevent double execution of the heavy tick logic
        if (action === 'tick') {
            const hasLock = await acquireLock('poker_tick_runner', 55); // 55s expiry (cron runs every 60s)

            if (!hasLock) {
                console.warn('⚠️ Tick simulation locked by another instance. Aborting.');
                return new Response(JSON.stringify({ success: false, message: 'Locked' }), { status: 423 }); // Locked
            }

            try {
                await processSimulationTick();
                // Check if any tournament is running, if not, ensure seed
                await ensureOpenTournaments();
                await ensureBotsInTournaments();
                return new Response(JSON.stringify({ success: true, message: 'Tick processed' }), { headers: { "Content-Type": "application/json" } });
            } finally {
                await releaseLock('poker_tick_runner');
            }
        }

        if (action === 'seed') {
            await seedInitialData();
            return new Response(JSON.stringify({ success: true, message: 'Seeding triggered' }), { headers: { "Content-Type": "application/json" } });
        }

        if (action === 'player_move') {
            const hasMoved = await handlePlayerMove(payload);
            return new Response(JSON.stringify({ success: hasMoved }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    } catch (err) {
        console.error('Edge Function Error:', err);
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

function shuffleDeck(deck: string[]) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ------------------------------------------------------------------
// GAME LOGIC
// ------------------------------------------------------------------

async function handlePlayerMove(payload: any) {
    const { tournament_id, player_id, action, amount } = payload;
    console.log(`[MOVE] ${player_id} performs ${action}`);

    // Fetch Current State
    const { data: state } = await supabase.from('game_states').select('*').eq('tournament_id', tournament_id).single();
    if (!state) return false;

    // NEXT HAND ACTION
    if (action === 'next_hand') {
        // Validation: Only allow if phase is showdown
        if (state.phase !== 'showdown') return false;
        await startNewHand(tournament_id);
        return true;
    }

    // Validation: Is it this player's turn?
    const isUserTurn = state.current_turn_user_id === player_id;
    const isBotTurn = state.current_turn_bot_id === player_id;
    if (!isUserTurn && !isBotTurn) {
        console.warn(`[MOVE] Not ${player_id}'s turn`);
        return false;
    }

    const playerStates = state.player_states || {};
    const currentPlayerState = playerStates[player_id] || { is_folded: false, current_bet: 0, hole_cards: [], has_acted: false };

    // Fetch Player Stack
    const { data: participant } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament_id)
        .or(`user_id.eq.${player_id},bot_id.eq.${player_id}`)
        .single();

    if (!participant) return false;

    let newStack = participant.stack;
    let newBet = currentPlayerState.current_bet;
    let newPot = state.current_pot;
    let lastRaise = state.last_raise_amount;

    // PROCESS ACTIONS
    if (action === 'fold') {
        currentPlayerState.is_folded = true;
    } else if (action === 'check') {
        // Can only check if current bet matches
        if (newBet < lastRaise) {
            return false; // Must call or fold
        }
    } else if (action === 'call') {
        const toCall = lastRaise - newBet;
        const actualCall = Math.min(toCall, newStack);
        newStack -= actualCall;
        newBet += actualCall;
        newPot += actualCall;
    } else if (action === 'raise') {
        const totalBet = amount; // Frontend sends total amount to bet
        const added = totalBet - newBet;

        if (added > newStack) return false; // Insufficient funds
        if (totalBet < lastRaise * 2 && added < newStack) {
            // Min raise check (simplified)
            // return false; 
        }

        newStack -= added;
        newBet = totalBet;
        newPot += added;
        state.last_raise_amount = totalBet;
        state.last_raiser_id = player_id;

        // Re-open betting for others
        for (const pid in playerStates) {
            if (pid !== player_id && !playerStates[pid].is_folded) {
                playerStates[pid].has_acted = false;
            }
        }
    }

    currentPlayerState.current_bet = newBet;
    currentPlayerState.has_acted = true;
    playerStates[player_id] = currentPlayerState;

    // UPDATE DB
    await supabase.from('game_states').update({
        player_states: playerStates,
        current_pot: newPot,
        last_raise_amount: state.last_raise_amount,
        last_raiser_id: state.last_raiser_id
    }).eq('id', state.id);

    await supabase.from('tournament_participants').update({ stack: newStack }).eq('id', participant.id);

    // DETERMINE NEXT STEP
    const nextStep = await determineNextStep(tournament_id, state, playerStates);
    if (nextStep.next_player) {
        const np = nextStep.next_player;
        await supabase.from('game_states').update({
            current_turn_user_id: np.user_id || null,
            current_turn_bot_id: np.bot_id || null
        }).eq('id', state.id);
    } else if (nextStep.next_phase) {
        await advancePhase(tournament_id, state, nextStep.next_phase);
    }

    return true;
}

async function determineNextStep(tournamentId: string, state: any, playerStates: any) {
    const { data: participants } = await supabase.from('tournament_participants').select('*').eq('tournament_id', tournamentId).eq('status', 'active');

    // Sort logic (needs to match dealer rotation) - For now sort by ID
    // TODO: Implement proper seat indexing
    participants.sort((a, b) => (a.user_id || a.bot_id).localeCompare(b.user_id || b.bot_id));

    // Check if betting round complete
    const active = participants.filter(p => !playerStates[p.user_id || p.bot_id]?.is_folded);
    const idToState = (id) => playerStates[id] || { current_bet: 0, has_acted: false };

    const unacted = active.filter(p => !idToState(p.user_id || p.bot_id).has_acted);
    const unmatched = active.filter(p => idToState(p.user_id || p.bot_id).current_bet < state.last_raise_amount && (p.stack > 0)); // Stack > 0 handles all-in

    if (unacted.length === 0 && unmatched.length === 0) {
        // Round Complete!
        const phases = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
        const nextIdx = phases.indexOf(state.phase) + 1;
        return { next_phase: phases[nextIdx] || 'showdown' };
    }

    // Find Next Player
    // Start from current turn index + 1
    const currentTurnId = state.current_turn_user_id || state.current_turn_bot_id;
    let idx = participants.findIndex(p => (p.user_id || p.bot_id) === currentTurnId);
    if (idx === -1) idx = 0;

    let loops = 0;
    while (loops < participants.length) {
        idx = (idx + 1) % participants.length;
        const p = participants[idx];
        const pid = p.user_id || p.bot_id;
        const pState = playerStates[pid];

        if (!pState?.is_folded && p.stack > 0) { // Should also check if they are all-in?
            // If everyone else is all-in, we might just skip to showdown? 
            // Keep it simple: they take turn if valid
            return { next_player: p };
        }
        loops++;
    }

    return { next_phase: 'showdown' }; // Should trigger if everyone all-in
}

async function advancePhase(tournamentId: string, oldState: any, newPhase: string) {
    console.log(`[PHASE] Advancing to ${newPhase}`);

    let updates: any = {
        phase: newPhase,
        last_raise_amount: 0,
        last_raiser_id: null
    };

    const playerStates = oldState.player_states || {};
    // Reset has_acted and current_bet for new round
    for (const key in playerStates) {
        playerStates[key].current_bet = 0;
        playerStates[key].has_acted = false;
    }
    updates.player_states = playerStates;

    if (newPhase === 'showdown') {
        await supabase.from('game_states').update(updates).eq('id', oldState.id);
        await processShowdown(tournamentId, { ...oldState, ...updates });
        return;
    }

    // Deal Cards
    let deck = [...oldState.deck];
    let community = [...oldState.community_cards];

    // Burn card? (Optional, skipping for simplicity)

    if (newPhase === 'flop') {
        community.push(deck.pop()!); // Burn?
        community.push(deck.pop()!, deck.pop()!, deck.pop()!);
    } else if (newPhase === 'turn' || newPhase === 'river') {
        community.push(deck.pop()!);
    }

    updates.deck = deck;
    updates.community_cards = community;

    // Set turn to first active player (after dealer/small blind?)
    // Simplified: First active player in list
    const { data: participants } = await supabase.from('tournament_participants').select('user_id, bot_id').eq('tournament_id', tournamentId).eq('status', 'active');
    // Sort consistent with `determineNextStep`
    participants.sort((a, b) => (a.user_id || a.bot_id).localeCompare(b.user_id || b.bot_id));

    const first = participants.find(p => !playerStates[p.user_id || p.bot_id]?.is_folded);

    if (first) {
        updates.current_turn_user_id = first.user_id || null;
        updates.current_turn_bot_id = first.bot_id || null;
    }

    await supabase.from('game_states').update(updates).eq('id', oldState.id);
}

async function processShowdown(tournamentId: string, state: any) {
    console.log('[SHOWDOWN] Processing...');

    const { data: participants } = await supabase.from('tournament_participants')
        .select(`id, user_id, bot_id, bots(name), profiles:user_id(name)`)
        .eq('tournament_id', tournamentId)
        .eq('status', 'active');

    const community = state.community_cards;
    const activePlayers = participants.filter(p => !state.player_states[p.user_id || p.bot_id]?.is_folded);

    if (activePlayers.length === 0) {
        // Unexpected: everyone folded? Last player wins.
        // Usually `handlePlayerMove` detects fold-win.
        await startNewHand(tournamentId);
        return;
    }

    // Calculate Winners
    const solvedHands = activePlayers.map(p => {
        const pid = p.user_id || p.bot_id;
        const hole = state.player_states[pid].hole_cards;
        const fullHand = Hand.solve([...hole, ...community]);
        return {
            id: pid,
            name: p.bots?.name || p.profiles?.name || 'Player',
            hand: fullHand,
            hole_cards: hole
        };
    });

    const winnerHands = Hand.winners(solvedHands.map(p => p.hand));
    const winners = solvedHands.filter(p => winnerHands.includes(p.hand));

    // Distribute Logic (Simple split)
    const winAmount = Math.floor(state.current_pot / winners.length);

    // Update Balances
    for (const w of winners) {
        // Need participant ID to update stack
        const p = participants.find(part => (part.user_id || part.bot_id) === w.id);
        if (p) {
            await supabase.rpc('increment_participant_stack', { participant_id: p.id, amount: winAmount });
        }
    }

    // Record History
    const historyEntry = {
        tournament_id: tournamentId,
        hand_number: 1, // TODO: Increment
        results: {
            winners: winners.map(w => ({ id: w.id, amount: winAmount, hand_name: w.hand.name })),
            pot: state.current_pot,
            community_cards: community
        },
        recorded_at: new Date()
    };
    await supabase.from('game_hand_history').insert(historyEntry);

    // Ensure state reflects showdown results (so UI can show them)
    // We don't have a "winners" column in game_states, so we might rely on history subscription 
    // OR add it to player_states?
    // Let's just rely on the fact that phase is 'showdown' and history is inserted.

    // NOT calling startNewHand here. UI must trigger 'next_hand'.
    console.log('[SHOWDOWN] Verification Complete. Waiting for next hand.');
}

async function startNewHand(tournamentId: string) {
    console.log('[HAND] Starting New Hand for', tournamentId);
    const { data: participants } = await supabase.from('tournament_participants').select('*').eq('tournament_id', tournamentId).eq('status', 'active');

    if (!participants || participants.length < 2) return;

    participants.sort((a, b) => (a.user_id || a.bot_id).localeCompare(b.user_id || b.bot_id));

    const deck = shuffleDeck(createDeck());
    const sb = 10; const bb = 20; // TODO: Fetch from blind structure
    const ante = 0;

    // Init player states
    const playerStates: any = {};
    let pot = 0;

    // Need to rotate dealer/blinds.
    // Ideally we store "dealer_index" in tournament or game_state.
    // For now, random dealer to keep it moving.

    for (const p of participants) {
        const pid = p.user_id || p.bot_id;
        playerStates[pid] = {
            is_folded: false,
            current_bet: 0,
            has_acted: false,
            hole_cards: [deck.pop(), deck.pop()]
        };
    }

    // Post Blinds (Simplified: First two players)
    // TODO: Real rotation
    const pSB = participants[0];
    const pBB = participants[1];

    // Deduct Blinds from stacks (update DB)
    // WARNING: This needs critical locking in production.
    await supabase.rpc('increment_participant_stack', { participant_id: pSB.id, amount: -sb });
    await supabase.rpc('increment_participant_stack', { participant_id: pBB.id, amount: -bb });

    playerStates[pSB.user_id || pSB.bot_id].current_bet = sb;
    playerStates[pBB.user_id || pBB.bot_id].current_bet = bb;
    pot = sb + bb;

    // Upsert State
    const { data: existing } = await supabase.from('game_states').select('id').eq('tournament_id', tournamentId).maybeSingle();
    const stateData = {
        tournament_id: tournamentId,
        deck,
        community_cards: [],
        current_pot: pot,
        phase: 'pre-flop',
        player_states: playerStates,
        last_raise_amount: bb,
        last_raiser_id: null,
        current_turn_user_id: participants[2]?.user_id || (participants[2] ? null : participants[0].user_id) || null,
        current_turn_bot_id: participants[2]?.bot_id || (participants[2] ? null : participants[0].bot_id) || null
    };

    // If only 2 players, SB is dealer, BB is first to act? Or SB acts first?
    // Heads up: Dealer is SB. SB acts first pre-flop.
    // Logic above is for 3+ players roughly.

    if (existing) await supabase.from('game_states').update(stateData).eq('id', existing.id);
    else await supabase.from('game_states').insert(stateData);
}

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

async function seedInitialData() {
    // ... (Keep existing seed logic if needed, or remove)
}

async function processSimulationTick() {
    // 1. Start Scheduled Tournaments
    const now = new Date();
    const { data: dueTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'registering')
        .lte('scheduled_start_time', now.toISOString());

    if (dueTournaments && dueTournaments.length > 0) {
        console.log(`[SCHEDULER] Found ${dueTournaments.length} tournaments to start.`);
        for (const t of dueTournaments) {
            console.log(`[START] Starting tournament ${t.name} (${t.id})`);
            // Update status to running
            await supabase.from('tournaments').update({ status: 'running' }).eq('id', t.id);
            // Initialize first hand
            await startNewHand(t.id);
        }
    }

    // 2. Process Running Tournaments (Bot Moves)
    const { data: activeTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'finished')
        .limit(20);

    if (!activeTournaments) return;

    for (const t of activeTournaments) {
        if (t.status === 'running' || t.status === 'late_reg') {
            let movesThisTick = 0;
            const maxMoves = 15; // Move up to 15 times per tick to keep it fast

            while (movesThisTick < maxMoves) {
                const { data: state } = await supabase.from('game_states').select('*').eq('tournament_id', t.id).maybeSingle();

                if (!state) {
                    await startNewHand(t.id);
                    // After starting a hand, we break to wait for the next tick/refresh
                    break;
                } else if (state.current_turn_bot_id) {
                    await handleBotMove(t.id, state.current_turn_bot_id, state);
                    movesThisTick++;
                } else {
                    // Not a bot turn (human's turn or transition)
                    break;
                }
            }
        }
    }

    // 3. Ensure Bots are filling up tournaments
    await ensureBotsInTournaments();
}

async function ensureOpenTournaments() {
    // Call the SQL logic which maintains 4 registering tournaments
    const { error } = await supabase.rpc('ensure_active_tournaments');
    if (error) {
        console.error('Failed to run ensure_active_tournaments RPC:', error);

        // Fallback: If RPC fails, keep at least one alive
        const { count } = await supabase
            .from('tournaments')
            .select('*', { count: 'exact', head: true })
            .in('status', ['registering', 'late_reg', 'running']);

        if (count === 0) {
            console.log('Fallback: Creating 1 emergency tournament.');
            const startTime = new Date();
            startTime.setMinutes(startTime.getMinutes() + 2);
            await supabase.from('tournaments').insert({
                name: `Emergency Sit & Go ${Math.floor(Math.random() * 1000)}`,
                status: 'registering',
                type: 'sit_and_go',
                buy_in: 100,
                prize_pool: 0,
                scheduled_start_time: startTime.toISOString(),
                min_players: 2,
                max_players: 6,
                players_count: 0
            });
        }
    } else {
        console.log('✅ ensure_active_tournaments RPC executed.');
    }
}

async function handleBotMove(tournamentId: string, botId: string, state: any) {
    const playerState = state.player_states[botId];
    if (!playerState) return;

    const currentBet = state.last_raise_amount || 0;
    const myBet = playerState.current_bet || 0;
    const toCall = currentBet - myBet;

    // Basic Logic
    let action = 'call';
    let amount = 0;

    // Random Key for audit
    // In a real RNG engine, we'd generate this securely
    const decisionRng = Math.random();

    // Randomly Raise
    if (decisionRng > 0.8 && toCall < 200) {
        action = 'raise';
        amount = currentBet + 40; // min raise
    } else if (toCall > 500) {
        // Fold if expensive (random)
        if (Math.random() > 0.5) action = 'fold';
    }

    if (action === 'call' && toCall === 0) action = 'check';

    await handlePlayerMove({
        tournament_id: tournamentId,
        player_id: botId,
        action,
        amount
    });
}

async function ensureBotsInTournaments() {
    console.log('[BOTS] Checking for bots population needs...');
    // Increased limit to handle more concurrent tournaments
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*')
        .or('status.eq.registering,status.eq.late_reg,status.eq.running')
        .order('scheduled_start_time', { ascending: true })
        .limit(10);

    if (!tournaments || tournaments.length === 0) return;

    const { data: bots } = await supabase.from('bots').select('id').limit(50);
    if (!bots || bots.length === 0) return;

    for (const t of tournaments) {
        const targetPlayers = t.max_players || 6;

        const { count, error } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', t.id);

        if (error) continue;

        const current = count || 0;
        if (current < targetPlayers) {
            const needed = targetPlayers - current;

            const isUrgent = new Date(t.scheduled_start_time).getTime() - Date.now() < 30000; // More aggressive: 30s
            const isFastType = t.type === 'sitgo' || t.type === 'spingo' || t.status === 'running';

            const toAdd = (isUrgent || isFastType) ? needed : Math.min(needed, 2);

            if (toAdd > 0) {
                console.log(`[BOTS] Filling ${t.name}: adding ${toAdd} bots (Target: ${targetPlayers})`);
                const shuffled = bots.sort(() => 0.5 - Math.random());
                let added = 0;

                for (const bot of shuffled) {
                    if (added >= toAdd) break;
                    const { error: insertError } = await supabase.from('tournament_participants').insert({
                        tournament_id: t.id,
                        bot_id: bot.id,
                        stack: t.starting_stack || 10000,
                        status: 'active'
                    });
                    if (!insertError) added++;
                }
            }
        }
    }
}
