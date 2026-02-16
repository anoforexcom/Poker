
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function purgeAndPrune() {
    console.log("Purging excess participants...");
    const { data: tournaments } = await supabase.from('tournaments').select('id, max_players');

    for (const t of tournaments || []) {
        const target = t.max_players || 6;
        const { data: participants } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', t.id)
            .order('joined_at', { ascending: true });

        if (participants && participants.length > target) {
            const excess = participants.slice(target);
            console.log(`Tournament ${t.id} has ${participants.length}/${target}. Pruning ${excess.length}...`);
            const ids = excess.map(p => p.id);
            for (let i = 0; i < ids.length; i += 100) {
                await supabase.from('tournament_participants').delete().in('id', ids.slice(i, i + 100));
            }
        }
    }
    console.log("Pruning complete.");
}

purgeAndPrune();
