import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySimulation() {
    console.log("--- SIMULATION VERIFICATION (PHASE 5) ---");

    // 0. Check ALL Tournaments
    const { data: tourneys } = await supabase.from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log("\n[LATEST 10 TOURNAMENTS]");
    if (tourneys && tourneys.length > 0) {
        tourneys.forEach(t => {
            console.log(`ID: ${t.id} | Name: ${t.name} | Status: ${t.status} | Players: ${t.players_count}/${t.max_players} | Start: ${t.scheduled_start_time}`);
        });
    } else {
        console.log("❌ NO TOURNAMENTS FOUND.");
    }
    const { data: states } = await supabase.from('game_states').select('*').limit(5);
    console.log("\n[GAME STATES]");
    if (states && states.length > 0) {
        states.forEach(s => {
            console.log(`Tournament: ${s.tournament_id} | Phase: ${s.phase} | Cards: ${s.community_cards.length}`);
        });
    } else {
        console.log("No game states found yet. (Wait for next tick)");
    }

    // 2. Check Hand History
    const { data: history } = await supabase.from('game_hand_history').select('*').order('created_at', { ascending: false }).limit(5);
    console.log("\n[HAND HISTORY]");
    if (history && history.length > 0) {
        history.forEach(h => {
            console.log(`Tournament: ${h.tournament_id} | Winner: ${h.results.winner_id} | Hand: ${h.results.hand_name}`);
        });
    } else {
        console.log("No hand history recorded yet. (Needs a showdown)");
    }
}

verifySimulation();
