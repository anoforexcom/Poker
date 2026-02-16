
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("-> Debugging Stuck Games...");
    const { data: states, error: stateError } = await supabase
        .from('game_states')
        .select('id, tournament_id, current_turn_bot_id, current_turn_user_id, last_raise_amount, phase')
        .limit(10);

    if (stateError) {
        console.error("Error fetching game states:", stateError);
    } else {
        console.log("Current Game States:");
        states.forEach(s => {
            console.log(`[${s.tournament_id}] Phase: ${s.phase} | BotTurn: ${s.current_turn_bot_id} | UserTurn: ${s.current_turn_user_id}`);
        });
    }
}

main();
