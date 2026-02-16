
import { supabase } from './utils/supabase';

async function debugState() {
    console.log('--- DEBUG START ---');

    // 1. Check Tournaments
    const { data: tournaments, error: tErr } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'finished')
        .order('created_at', { ascending: false });

    if (tErr) console.error('Tournaments Error:', tErr);
    else console.log('Active Tournaments:', tournaments?.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        players: t.players_count,
        min: t.min_players,
        start: t.scheduled_start_time
    })));

    // 2. Check Game States
    const { data: states, error: sErr } = await supabase
        .from('game_states')
        .select('id, tournament_id, phase, player_states');

    if (sErr) console.error('States Error:', sErr);
    else console.log('Game States:', states?.map(s => ({
        id: s.id,
        t_id: s.tournament_id,
        phase: s.phase,
        players: Object.keys(s.player_states || {}).length
    })));

    // 3. Check for specific stuck tournaments
    if (tournaments && tournaments.length > 0) {
        const firstId = tournaments[0].id;
        const { count: partCount } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', firstId);
        console.log(`Participants for ${firstId}:`, partCount);
    }

    console.log('--- DEBUG END ---');
}

debugState();
