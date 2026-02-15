const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';

async function checkStatus() {
    console.log("Checking Phase 3 Database State...");

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    };

    try {
        // 1. Check Game States
        const resStates = await fetch(`${SUPABASE_URL}/rest/v1/game_states?select=*&limit=3`, { headers });
        const states = await resStates.json();
        console.log("\n[GAME STATES]:", states.length > 0 ? states.map(s => `${s.tournament_id}: ${s.phase}`) : "None found yet.");

        // 2. Check Hand History
        const resHist = await fetch(`${SUPABASE_URL}/rest/v1/game_hand_history?select=*&limit=3`, { headers });
        const history = await resHist.json();
        console.log("\n[HAND HISTORY]:", history.length > 0 ? history.map(h => `${h.tournament_id}: ${h.results.hand_name}`) : "No hands concluded yet.");

        // 3. Check Tournament Counts
        const resT = await fetch(`${SUPABASE_URL}/rest/v1/tournaments?status=eq.running&select=id`, { headers });
        const running = await resT.json();
        console.log("\n[RUNNING TOURNAMENTS]:", Array.isArray(running) ? running.length : "Error fetching");

    } catch (err) {
        console.error("Verification failed:", err.message);
    }
}

checkStatus();
