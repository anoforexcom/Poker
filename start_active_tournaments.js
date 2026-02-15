
import { createClient } from '@supabase/supabase-js';

// User's credentials
const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY'; // Service Role
const supabase = createClient(supabaseUrl, supabaseKey);

async function createActiveTournaments() {
    try {
        console.log('--- CREATING NEW TOURNAMENTS (FORCED) ---');

        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

        const tournaments = [
            {
                // Unique ID based on time
                id: `t_force_${Date.now()}_1`,
                name: "Lobby Fix Turbo",
                type: "sitgo",
                status: "registering", // CRITICAL: Must be registering
                buy_in: 100,
                prize_pool: 1000,
                players_count: 1,
                max_players: 6,
                start_time: null,
                scheduled_start_time: tenMinutesFromNow.toISOString(), // Future start
                created_at: now.toISOString(),
                current_blind_level: 1
            },
            {
                id: `t_force_${Date.now()}_2`,
                name: "Phoenix Rising",
                type: "tournament",
                status: "late_reg",
                buy_in: 500,
                prize_pool: 5000,
                players_count: 12,
                max_players: 100,
                start_time: now.toISOString(), // Already started
                scheduled_start_time: now.toISOString(),
                late_reg_until: tenMinutesFromNow.toISOString(), // But still open
                created_at: now.toISOString(),
                current_blind_level: 3
            }
        ];

        console.log('Inserting tournaments...', tournaments);
        const { data, error } = await supabase.from('tournaments').insert(tournaments).select();

        if (error) {
            console.error('❌ Failed to create tournaments:', JSON.stringify(error, null, 2));
            process.exit(1);
        } else {
            console.log('✅ Success! Created 2 new active tournaments.');
            console.log('   - Lobby Fix Turbo (Registering)');
            console.log('   - Phoenix Rising (Late Reg)');
            console.log('Inserted Data:', data);
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        process.exit(1);
    }
}

createActiveTournaments();
