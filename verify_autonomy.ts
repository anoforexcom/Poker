
import { supabase } from './utils/supabase';

async function verify() {
    console.log('--- VERIFYING SERVER AUTONOMY ---');

    // 1. Check if we have active games
    const { data: tourneys } = await supabase.from('tournaments')
        .select('id, name, status')
        .neq('status', 'finished')
        .limit(5);

    console.log(`Active Tournaments: ${tourneys?.length}`);

    // 2. Sample game states
    const { data: statesBefore } = await supabase.from('game_states')
        .select('tournament_id, phase, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    console.log('States now:', statesBefore?.map(s => `${s.tournament_id.substring(0, 8)}: ${s.phase} @ ${s.updated_at}`));

    console.log('Waiting 10 seconds for server tick...');
    await new Promise(r => setTimeout(r, 10000));

    const { data: statesAfter } = await supabase.from('game_states')
        .select('tournament_id, phase, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    console.log('States after 10s:', statesAfter?.map(s => `${s.tournament_id.substring(0, 8)}: ${s.phase} @ ${s.updated_at}`));

    const changed = statesAfter?.filter(after => {
        const before = statesBefore?.find(b => b.tournament_id === after.tournament_id);
        return before && before.updated_at !== after.updated_at;
    });

    if (changed && changed.length > 0) {
        console.log(`✅ SUCCESS: ${changed.length} games updated in the last 10s. The server is ticking!`);
    } else {
        console.log('⚠️ WARNING: No state updates detected yet. Wait for the 1-minute cron or check if anything is running.');
    }

    console.log('--- END VERIFICATION ---');
}

verify();
