
import { supabase } from './utils/supabase';

async function checkColumns() {
    const { data, error } = await supabase.rpc('debug_get_columns', { t_name: 'tournament_participants' });
    if (error) {
        // Fallback: try raw query if RPC fails (though RPC is preferred)
        console.error('Error fetching columns:', error);
    } else {
        console.log('Columns for tournament_participants:', data);
    }
}

checkColumns();
