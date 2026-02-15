
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- CHECKING TOURNAMENTS ---');
    const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Latest Tournaments:');
        console.table(data);
    }
}

check();
