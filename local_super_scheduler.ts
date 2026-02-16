
import { createClient } from '@supabase/supabase-js';
// Configuration
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🚀 LOCAL SUPER SCHEDULER STARTED");
console.log("   -> Monitoring Tournaments...");
console.log("   -> Auto-Starting Games...");
console.log("   -> Populating Bots...");

// Main Loop
async function tick() {
    try {
        await processTournamentStarts();
        await ensureBotsInTournaments();
        // await processRunningGames(); // Optional: if games rely on backend tick for moves
    } catch (e) {
        console.error("Critical Error in Tick:", e);
    }
}

// 1. Start Scheduled Tournaments
async function processTournamentStarts() {
    const now = new Date();
    const { data: dueTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .or('status.eq.registering,status.eq.late_reg')
        .lte('scheduled_start_time', now.toISOString());

    if (dueTournaments && dueTournaments.length > 0) {
        console.log(`[START] Found ${dueTournaments.length} tournaments to start.`);
        for (const t of dueTournaments) {
            console.log(`   -> Starting ${t.name} (${t.id})`);

            // Use 'late_reg' if within late registration window
            const hasLateReg = t.late_reg_until && new Date(t.late_reg_until) > now;
            const nextStatus = hasLateReg ? 'late_reg' : 'running';

            const { error } = await supabase.from('tournaments')
                .update({ status: nextStatus })
                .eq('id', t.id);

            if (!error) {
                await initGame(t.id);
            }
        }
    }

    // New: Check for 'running' or 'late_reg' that don't have a game state yet
    const { data: activeTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['running', 'late_reg']);

    if (activeTournaments) {
        for (const t of activeTournaments) {
            // Check if late reg expired
            if (t.status === 'late_reg' && t.late_reg_until && new Date(t.late_reg_until) <= now) {
                await supabase.from('tournaments').update({ status: 'running' }).eq('id', t.id);
            }
            await initGame(t.id);
        }
    }
}

// 2. Ensure Bots
async function ensureBotsInTournaments() {
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*')
        .or('status.eq.registering,status.eq.late_reg,status.eq.running')
        .order('scheduled_start_time', { ascending: true })
        .limit(5);

    if (!tournaments || tournaments.length === 0) return;

    // Get bots
    const { data: bots } = await supabase.from('bots').select('id').limit(50);
    if (!bots || bots.length === 0) return;

    for (const t of tournaments) {
        const targetPlayers = t.max_players === 6 ? 6 : 9;

        const { count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', t.id);

        const current = count || 0;

        // Urgent if starting soon or running
        const isUrgent = new Date(t.scheduled_start_time).getTime() - Date.now() < 60000 || t.status === 'running';

        if (current < targetPlayers) {
            const needed = targetPlayers - current;
            // Add aggressively if urgent
            const toAdd = isUrgent ? needed : Math.min(needed, Math.floor(Math.random() * 2) + 1);

            if (toAdd > 0) {
                console.log(`[BOTS] Adding ${toAdd} bots to ${t.name}`);
                const shuffled = bots.sort(() => 0.5 - Math.random());
                let added = 0;

                for (const bot of shuffled) {
                    if (added >= toAdd) break;
                    await supabase.from('tournament_participants').insert({
                        tournament_id: t.id,
                        bot_id: bot.id,
                        stack: t.starting_stack || 10000,
                        status: 'active'
                    }); // Ignore error
                    added++;
                }
            }
        }
    }
}

// Helper: Init Game (Simple Version)
async function initGame(tournamentId) {
    // Check if state exists
    const { data: existing } = await supabase.from('game_states').select('id').eq('tournament_id', tournamentId).maybeSingle();
    if (existing) return;

    console.log(`[GAME] Initializing State for ${tournamentId}`);

    // Get participants
    const { data: participants } = await supabase.from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'active');

    if (!participants || participants.length < 2) {
        console.warn(`[GAME] Not enough players to start ${tournamentId}`);
        return;
    }

    // Shuffle and Deal (Simplified)
    const SUITS = ['s', 'h', 'd', 'c'];
    const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const s of SUITS) for (const v of VALUES) deck.push(v + s);

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const playerStates = {};
    const sb = 10; const bb = 20;

    participants.forEach(p => {
        const pid = p.user_id || p.bot_id;
        playerStates[pid] = {
            is_folded: false,
            current_bet: 0,
            has_acted: false,
            hole_cards: [deck.pop(), deck.pop()]
        };
    });

    // Blinds (First 2)
    // Warning: No strict rotation here, just taking first 2
    const p1 = participants[0];
    const p2 = participants[1];
    const pid1 = p1.user_id || p1.bot_id;
    const pid2 = p2.user_id || p2.bot_id;

    playerStates[pid1].current_bet = sb;
    playerStates[pid2].current_bet = bb;

    // Insert State
    await supabase.from('game_states').insert({
        tournament_id: tournamentId,
        deck: deck,
        community_cards: [],
        current_pot: sb + bb,
        phase: 'pre-flop',
        player_states: playerStates,
        last_raise_amount: bb,
        current_turn_user_id: participants[2]?.user_id || (participants[2] ? null : participants[0].user_id),
        current_turn_bot_id: participants[2]?.bot_id || (participants[2] ? null : participants[0].bot_id)
    });
}


// Run every 5 seconds
setInterval(tick, 5000);
tick(); // First run
