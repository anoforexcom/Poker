// @ts-nocheck
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
    const res = await supabase.rpc('acquire_system_lock', {
        target_key: key,
        duration_seconds: durationInitialMap
    });
    if (!res || res.error) {
        if (res?.error) console.error('Lock Error:', res.error);
        return false;
    }
    return res.data;
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
            console.log('No JSON body provided, defaulting to action: tick');
        }

        if (action === 'tick') {
            const hasLock = await acquireLock('poker_tick_runner', 50);

            if (!hasLock) {
                console.warn('⚠️ Tick simulation locked by another instance. Aborting.');
                return new Response(JSON.stringify({ success: false, message: 'Locked' }), { status: 423 });
            }

            try {
                await processSimulationTick();
                await ensureOpenTournaments();
                await ensureBotsInTournaments();
                return new Response(JSON.stringify({ success: true, message: 'Tick processed' }));
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
            if (hasMoved && payload.tournament_id) {
                // REACTIVE ENGINE: Advance the target tournament immediately
                // Note: We don't use the global lock here to allow parallel games
                await processSimulationTick(payload.tournament_id);
            }
            return new Response(JSON.stringify({ success: hasMoved }));
        }

        if (action === 'debug_info') {
            const { count: tCount, error: tErr } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
            const { count: bCount, error: bErr } = await supabase.from('bots').select('*', { count: 'exact', head: true });
            const { data: latest } = await supabase.from('tournaments').select('*').limit(5).order('created_at', { ascending: false });
            return new Response(JSON.stringify({
                tournaments: { count: tCount, error: tErr, latest: latest || [] },
                bots: { count: bCount, error: bErr }
            }), { headers: { "Content-Type": "application/json" } });
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

async function handlePlayerMove(payload: any) {
    const { tournament_id, player_id, action, amount } = payload;
    console.log(`[MOVE] ${player_id} performs ${action}`);

    const { data: state } = await supabase.from('game_states').select('*').eq('tournament_id', tournament_id).single();
    if (!state) return false;

    if (action === 'next_hand') {
        if (state.phase !== 'showdown') return false;
        await startNewHand(tournament_id);
        return true;
    }

    const isUserTurn = state.current_turn_user_id === player_id;
    const isBotTurn = state.current_turn_bot_id === player_id;
    if (!isUserTurn && !isBotTurn) {
        console.warn(`[MOVE] Not ${player_id}'s turn`);
        return false;
    }

    const playerStates = state.player_states || {};
    const currentPlayerState = playerStates[player_id] || { is_folded: false, current_bet: 0, hole_cards: [], has_acted: false };

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

    if (action === 'fold') {
        currentPlayerState.is_folded = true;
    } else if (action === 'check') {
        if (newBet < lastRaise) return false;
    } else if (action === 'call') {
        const toCall = lastRaise - newBet;
        const actualCall = Math.min(toCall, newStack);
        newStack -= actualCall;
        newBet += actualCall;
        newPot += actualCall;
    } else if (action === 'raise') {
        const totalBet = amount;
        const added = totalBet - newBet;
        if (added > newStack) return false;
        newStack -= added;
        newBet = totalBet;
        newPot += added;
        state.last_raise_amount = totalBet;
        state.last_raiser_id = player_id;
        for (const pid in playerStates) {
            if (pid !== player_id && !playerStates[pid].is_folded) {
                playerStates[pid].has_acted = false;
            }
        }
    }

    currentPlayerState.current_bet = newBet;
    currentPlayerState.has_acted = true;
    playerStates[player_id] = currentPlayerState;

    // IMMEDIATE STATE UPDATE FOR INTEGRITY
    state.player_states = playerStates;
    state.current_pot = newPot;

    await supabase.from('game_states').update({
        player_states: playerStates,
        current_pot: newPot,
        last_raise_amount: state.last_raise_amount,
        last_raiser_id: state.last_raiser_id
    }).eq('id', state.id);

    await supabase.from('tournament_participants').update({ stack: newStack }).eq('id', participant.id);

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
    participants.sort((a, b) => (a.user_id || a.bot_id).localeCompare(b.user_id || b.bot_id));

    const active = participants.filter(p => !playerStates[p.user_id || p.bot_id]?.is_folded);
    const idToState = (id) => playerStates[id] || { current_bet: 0, has_acted: false };

    const unacted = active.filter(p => !idToState(p.user_id || p.bot_id).has_acted);
    const unmatched = active.filter(p => idToState(p.user_id || p.bot_id).current_bet < state.last_raise_amount && (p.stack > 0));

    if (unacted.length === 0 && unmatched.length === 0) {
        const phases = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
        const nextIdx = phases.indexOf(state.phase) + 1;
        return { next_phase: phases[nextIdx] || 'showdown' };
    }

    const currentTurnId = state.current_turn_user_id || state.current_turn_bot_id;
    let idx = participants.findIndex(p => (p.user_id || p.bot_id) === currentTurnId);
    if (idx === -1) idx = 0;

    let loops = 0;
    while (loops < participants.length) {
        idx = (idx + 1) % participants.length;
        const p = participants[idx];
        const pid = p.user_id || p.bot_id;
        const pState = playerStates[pid];
        if (!pState?.is_folded && p.stack > 0) {
            return { next_player: p };
        }
        loops++;
    }
    return { next_phase: 'showdown' };
}

async function advancePhase(tournamentId: string, oldState: any, newPhase: string) {
    let updates: any = { phase: newPhase, last_raise_amount: 0, last_raiser_id: null };
    const playerStates = oldState.player_states || {};
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

    let deck = [...oldState.deck];
    let community = [...oldState.community_cards];

    if (newPhase === 'flop') {
        deck.pop(); // Burn
        community.push(deck.pop()!, deck.pop()!, deck.pop()!);
    } else if (newPhase === 'turn' || newPhase === 'river') {
        deck.pop(); // Burn
        community.push(deck.pop()!);
    }

    updates.deck = deck;
    updates.community_cards = community;

    const { data: participants } = await supabase.from('tournament_participants').select('user_id, bot_id').eq('tournament_id', tournamentId).eq('status', 'active');
    participants.sort((a, b) => (a.user_id || a.bot_id).localeCompare(b.user_id || b.bot_id));
    const first = participants.find(p => !playerStates[p.user_id || p.bot_id]?.is_folded);

    if (first) {
        updates.current_turn_user_id = first.user_id || null;
        updates.current_turn_bot_id = first.bot_id || null;
    }

    await supabase.from('game_states').update(updates).eq('id', oldState.id);
}

async function processShowdown(tournamentId: string, state: any) {
    const { data: participants } = await supabase.from('tournament_participants')
        .select(`id, user_id, bot_id, bots(name), profiles:user_id(name)`)
        .eq('tournament_id', tournamentId)
        .eq('status', 'active');

    const community = state.community_cards;
    const activePlayers = participants.filter(p => !state.player_states[p.user_id || p.bot_id]?.is_folded);

    if (activePlayers.length === 0) {
        await startNewHand(tournamentId);
        return;
    }

    const solvedHands = activePlayers.map(p => {
        const pid = p.user_id || p.bot_id;
        const hole = state.player_states[pid].hole_cards;
        const fullHand = Hand.solve([...hole, ...community]);
        return { id: pid, name: p.bots?.name || p.profiles?.name || 'Player', hand: fullHand, hole_cards: hole };
    });

    const winnerHands = Hand.winners(solvedHands.map(p => p.hand));
    const winners = solvedHands.filter(p => winnerHands.includes(p.hand));
    const winAmount = Math.floor(state.current_pot / winners.length);

    for (const w of winners) {
        const p = participants.find(part => (part.user_id || part.bot_id) === w.id);
        if (p) await supabase.rpc('increment_participant_stack', { participant_id: p.id, amount: winAmount });
    }

    const historyEntry = {
        tournament_id: tournamentId,
        hand_number: 1,
        results: {
            winners: winners.map(w => ({ id: w.id, amount: winAmount, hand_name: w.hand.name })),
            pot: state.current_pot,
            community_cards: community
        },
        recorded_at: new Date()
    };
    await supabase.from('game_hand_history').insert(historyEntry);
    console.log('[SHOWDOWN] Verification Complete. Waiting for next hand.');
}

async function startNewHand(tournamentId: string) {
    console.log('[HAND] Starting New Hand for', tournamentId);

    const { data: allParticipants } = await supabase.from('tournament_participants').select('*').eq('tournament_id', tournamentId).eq('status', 'active');

    if (!allParticipants || allParticipants.length < 2) return;

    // ELIMINATION CHECK
    for (const p of allParticipants) {
        if (p.stack <= 0) {
            console.log(`[ELIMINATION] Player ${p.user_id || p.bot_id} is out!`);
            await supabase.from('tournament_participants').update({ status: 'eliminated' }).eq('id', p.id);
        }
    }

    const { data: activeParticipants } = await supabase.from('tournament_participants').select('*').eq('tournament_id', tournamentId).eq('status', 'active');

    if (!activeParticipants || activeParticipants.length < 2) {
        if (activeParticipants && activeParticipants.length === 1) {
            const winner = activeParticipants[0];
            await supabase.from('tournaments').update({
                status: 'finished',
                winner_id: winner.user_id || null,
                winner_bot_id: winner.bot_id || null
            }).eq('id', tournamentId);
        }
        return;
    }

    const { data: existing } = await supabase.from('game_states').select('*').eq('tournament_id', tournamentId).maybeSingle();
    activeParticipants.sort((a, b) => (a.user_id || a.bot_id).localeCompare(b.user_id || b.bot_id));

    let dealerIdx = existing?.dealer_index !== undefined ? (existing.dealer_index + 1) % activeParticipants.length : 0;
    const deck = shuffleDeck(createDeck());
    const sb = 10; const bb = 20;

    const playerStates: any = {};
    for (const p of activeParticipants) {
        const pid = p.user_id || p.bot_id;
        playerStates[pid] = {
            is_folded: false,
            current_bet: 0,
            has_acted: false,
            hole_cards: [deck.pop(), deck.pop()]
        };
    }

    const sbIdx = (dealerIdx + 1) % activeParticipants.length;
    const bbIdx = (dealerIdx + 2) % activeParticipants.length;
    const firstActIdx = (dealerIdx + 3) % activeParticipants.length;

    const pSB = activeParticipants[sbIdx];
    const pBB = activeParticipants[bbIdx];
    const pFirst = activeParticipants[firstActIdx];

    await supabase.rpc('increment_participant_stack', { participant_id: pSB.id, amount: -sb });
    await supabase.rpc('increment_participant_stack', { participant_id: pBB.id, amount: -bb });

    playerStates[pSB.user_id || pSB.bot_id].current_bet = sb;
    playerStates[pBB.user_id || pBB.bot_id].current_bet = bb;

    const stateData = {
        tournament_id: tournamentId,
        deck,
        community_cards: [],
        current_pot: sb + bb,
        phase: 'pre-flop',
        player_states: playerStates,
        last_raise_amount: bb,
        last_raiser_id: null,
        dealer_index: dealerIdx,
        current_turn_user_id: pFirst.user_id || null,
        current_turn_bot_id: pFirst.bot_id || null
    };

    if (existing) await supabase.from('game_states').update(stateData).eq('id', existing.id);
    else await supabase.from('game_states').insert(stateData);
}

async function processSimulationTick(targetTournamentId?: string) {
    const now = new Date();

    // 1. Handle starting tournaments
    if (!targetTournamentId) {
        const { data: dueTournaments } = await supabase.from('tournaments')
            .select('*').eq('status', 'registering').lte('scheduled_start_time', now.toISOString());

        if (dueTournaments) {
            for (const t of dueTournaments) {
                await supabase.from('tournaments').update({ status: 'running' }).eq('id', t.id);
                await startNewHand(t.id);
            }
        }
    }

    // 2. Handle game progression (Bot moves)
    const query = supabase.from('tournaments').select('*').neq('status', 'finished');
    if (targetTournamentId) {
        query.eq('id', targetTournamentId);
    } else {
        query.limit(20);
    }

    const { data: activeTournaments } = await query;

    if (activeTournaments) {
        const tickStart = Date.now();
        for (const t of activeTournaments) {
            if (t.status === 'running' || t.status === 'late_reg') {
                let moves = 0;
                while (moves < 100) {
                    // Safety: Avoid infinite loops and edge function timeouts
                    if (Date.now() - tickStart > (targetTournamentId ? 10000 : 45000)) break;

                    const { data: state } = await supabase.from('game_states').select('*').eq('tournament_id', t.id).maybeSingle();
                    if (!state) { await startNewHand(t.id); break; }
                    if (state.phase === 'showdown') {
                        // For real-time feel, if it's all bots or we've waited 3s, auto-start next hand
                        const { data: activeParts } = await supabase.from('tournament_participants').select('*').eq('tournament_id', t.id).eq('status', 'active');
                        const hasHuman = activeParts?.some(p => p.user_id !== null);

                        if (!hasHuman) {
                            console.log(`[AUTO-SHOWDOWN] No humans in ${t.id}. Starting next hand.`);
                            await startNewHand(t.id);
                        }
                        break;
                    }

                    if (state.current_turn_bot_id) {
                        console.log(`[BOT-TICK] Acting for bot ${state.current_turn_bot_id} in ${t.id}`);
                        const botSuccess = await handleBotMove(t.id, state.current_turn_bot_id, state);
                        if (!botSuccess) {
                            console.error(`[BOT-FAIL] Bot ${state.current_turn_bot_id} failed to move. Skipping.`);
                            break;
                        }
                        moves++;
                    } else if (state.current_turn_user_id) {
                        // It's a user's turn - engine waits for their move
                        break;
                    } else {
                        // Paradoxical state: No turn owner. Fix it.
                        console.warn(`[ENGINE-RECOVERY] No turn owner in ${t.id}. Restarting hand logic.`);
                        await startNewHand(t.id);
                        break;
                    }
                }
            }
        }
    }
}

async function ensureOpenTournaments() {
    const res = await supabase.rpc('ensure_active_tournaments');
    if (!res || res.error) {
        if (res?.error) console.error('ensure_active_tournaments RPC error:', res.error);
        const { count } = await supabase.from('tournaments')
            .select('*', { count: 'exact', head: true })
            .in('status', ['registering', 'late_reg', 'running']);
        if (count === 0) {
            const startTime = new Date();
            startTime.setMinutes(startTime.getMinutes() + 2);
            await supabase.from('tournaments').insert({
                name: `Sit & Go #${Math.floor(Math.random() * 1000)}`,
                status: 'registering', type: 'sitgo', buy_in: 100,
                scheduled_start_time: startTime.toISOString(), min_players: 2, max_players: 6
            });
        }
    }
}

async function handleBotMove(tournamentId: string, botId: string, state: any) {
    const ps = state.player_states[botId];
    if (!ps) return false;
    const toCall = (state.last_raise_amount || 0) - (ps.current_bet || 0);
    let action = 'call';
    let amount = 0;
    const rng = Math.random();
    if (rng > 0.8 && toCall < 200) { action = 'raise'; amount = (state.last_raise_amount || 0) + 40; }
    else if (toCall > 500 && Math.random() > 0.5) action = 'fold';
    if (action === 'call' && toCall === 0) action = 'check';

    const success = await handlePlayerMove({ tournament_id: tournamentId, player_id: botId, action, amount });
    if (!success) {
        if (action === 'raise') {
            return await handlePlayerMove({ tournament_id: tournamentId, player_id: botId, action: toCall === 0 ? 'check' : 'call', amount: 0 });
        } else {
            return await handlePlayerMove({ tournament_id: tournamentId, player_id: botId, action: 'fold', amount: 0 });
        }
    }
    return true;
}

async function ensureBotsInTournaments() {
    const { data: ts } = await supabase.from('tournaments').select('*')
        .or('status.eq.registering,status.eq.late_reg,status.eq.running,status.eq.active').limit(10);
    if (!ts) return;
    const resBots = await supabase.from('bots').select('id').limit(50);
    const bots = resBots?.data;
    if (!bots || bots.length === 0) return;
    for (const t of ts) {
        const { count } = await supabase.from('tournament_participants').select('*', { count: 'exact', head: true }).eq('tournament_id', t.id);
        const needed = (t.max_players || 6) - (count || 0);
        const isFast = t.type === 'cash' || t.status === 'running' || t.status === 'active' || (new Date(t.scheduled_start_time).getTime() - Date.now() < 30000);
        const toAdd = isFast ? needed : Math.min(needed, 2);
        if (toAdd > 0) {
            const shuffled = bots.sort(() => 0.5 - Math.random());
            let added = 0;
            for (const bot of shuffled) {
                if (added >= toAdd) break;
                const { error } = await supabase.from('tournament_participants').insert({
                    tournament_id: t.id, bot_id: bot.id, stack: t.starting_stack || 10000, status: 'active'
                });
                if (!error) added++;
            }
        }
    }
}

async function seedInitialData() {
    // Left empty or keep original logic
}
