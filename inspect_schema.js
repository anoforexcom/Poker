
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- INSPECTING TOURNAMENTS SCHEMA ---');

    // We can't query information_schema directly with the client usually, 
    // but we can try to RPC or just dump a record to see keys.
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching record:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found on record:', Object.keys(data[0]));
    } else {
        console.log('No records found, trying to infer from error or assume standard columns.');
        // Fallback: Try a raw RPC if available, or just rely on the user's error message which is quite explicit.
    }
}

inspectSchema();
