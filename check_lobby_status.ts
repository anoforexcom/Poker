
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("-> Checking Lobby Status...");

    // 1. Check Tournaments
    const { count: tCount, error: tError } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['registering', 'late_reg', 'running']);

    console.log(`Active Tournaments: ${tError ? 'Error ' + tError.message : tCount}`);

    // 2. Check Bots
    const { count: bCount, error: bError } = await supabase
        .from('bots')
        .select('*', { count: 'exact', head: true });

    console.log(`Generic Bots: ${bError ? 'Error ' + bError.message : bCount}`);

    // 3. Force Create if Empty
    if (tCount === 0) {
        console.log("⚠️ No active tournaments found. Force creating one...");
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() + 1);

        const { error: insertError } = await supabase.from('tournaments').insert({
            name: `Emergency Rescue SNG`,
            status: 'registering',
            type: 'sitgo',
            buy_in: 100,
            prize_pool: 0,
            scheduled_start_time: startTime.toISOString(),
            min_players: 6,
            max_players: 6,
            players_count: 0
        });

        if (insertError) console.error("Force creation failed:", insertError);
        else console.log("✅ Emergency tournament created.");
    }
}

main();
