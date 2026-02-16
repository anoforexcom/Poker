
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("🚀 Force Starting Lobby...");

    const types = [
        { name: 'Turbo SNG', type: 'sitgo', buyIn: 50, players: 6 },
        { name: 'Sunday Million', type: 'tournament', buyIn: 250, players: 100 },
        { name: 'Hyper Spin', type: 'spingo', buyIn: 25, players: 3 },
        { name: 'Cash Game NL100', type: 'cash', buyIn: 100, players: 6 }
    ];

    for (const t of types) {
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() + 1);

        const { error } = await supabase.from('tournaments').insert({
            name: t.name,
            status: t.type === 'cash' ? 'active' : 'registering',
            type: t.type,
            buy_in: t.buyIn,
            prize_pool: 0,
            scheduled_start_time: startTime.toISOString(),
            min_players: 2,
            max_players: t.players,
            players_count: 0
        });

        if (error) console.error(`Failed to create ${t.name}:`, error.message);
        else console.log(`✅ Created: ${t.name}`);
    }

    console.log("🎉 Lobby replenished.");
}

main();
