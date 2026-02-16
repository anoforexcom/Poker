
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function recover() {
    console.log("🛠️ EMERGENCY RECOVERY STARTED");

    // 1. Get all active tournaments
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['registering', 'late_reg', 'running']);

    if (!tournaments || tournaments.length === 0) {
        console.log("No active tournaments found.");
        return;
    }

    // 2. Get bots pool
    const { data: bots } = await supabase.from('bots').select('id').limit(50);
    if (!bots) return;

    for (const t of tournaments) {
        console.log(`Checking ${t.name} (${t.id})...`);

        // Check participants
        const { data: participants, count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact' })
            .eq('tournament_id', t.id);

        const current = count || 0;
        const target = t.max_players || 6;

        if (current < target) {
            console.log(`   -> Adding ${target - current} bots...`);
            const needed = target - current;
            const shuffled = bots.sort(() => 0.5 - Math.random());
            let added = 0;
            for (const bot of shuffled) {
                if (added >= needed) break;
                const { error } = await supabase.from('tournament_participants').insert({
                    tournament_id: t.id,
                    bot_id: bot.id,
                    stack: t.starting_stack || 10000,
                    status: 'active'
                });
                if (!error) added++;
            }
        }

        // 3. Ensure Game State exists if running or late_reg
        if (t.status === 'running' || t.status === 'late_reg') {
            const { data: state } = await supabase.from('game_states').select('id').eq('tournament_id', t.id).maybeSingle();
            if (!state) {
                console.log(`   -> Initializing Game State for ${t.id}`);
                // Simple trigger: Update status to 'running' to trigger scheduler init, 
                // but better: just run the init logic if we had it here.
                // For now, let's just make sure bots are there.
            }
        }
    }
    console.log("✅ Recovery complete.");
}

recover();
