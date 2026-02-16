
import { supabase } from './utils/supabase';

async function check() {
    console.log('--- STUCK GAMES CHECK ---');

    const { data: tournaments, error: tErr } = await supabase.from('tournaments')
        .select('id, name, status, players_count, type')
        .eq('status', 'running');

    if (tErr) console.error('Tournaments Error:', tErr);
    else {
        console.log('Running Tournaments:', tournaments?.length);
        for (const t of tournaments || []) {
            const { data: state } = await supabase.from('game_states').select('id, phase').eq('tournament_id', t.id).maybeSingle();
            const { count } = await supabase.from('tournament_participants').select('*', { count: 'exact', head: true }).eq('tournament_id', t.id);

            console.log(`[${t.status}] ${t.name} (${t.id})`);
            console.log(`   -> Players: ${count} / 2 (min)`);
            console.log(`   -> GameState: ${state ? `EXISTS (${state.phase})` : 'MISSING'}`);

            if (!state && (count || 0) < 2) {
                console.log('   !!! STUCK: Needs bots to start because status is already "running" but not enough players.');
            }
        }
    }

    console.log('--- END CHECK ---');
}

check();
