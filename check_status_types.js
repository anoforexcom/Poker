
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGameStatuses() {
    console.log('--- CHECKING GAME STATUSES ---');

    // Check distinct statuses by type
    const { data, error } = await supabase
        .from('tournaments')
        .select('name, type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

checkGameStatuses();
