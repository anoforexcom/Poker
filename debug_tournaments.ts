
import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';
// dotenv.config();

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournaments() {
    console.log('Checking tournaments...');
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'finished')
        .order('scheduled_start_time', { ascending: true });

    if (error) {
        console.error('Error fetching tournaments:', error);
        return;
    }

    console.log(`Found ${data.length} active tournaments.`);
    data.forEach(t => {
        console.log(`- [${t.status}] ${t.name} (Start: ${t.scheduled_start_time})`);
    });

    if (data.length === 0) {
        console.log('No active tournaments found. Attempting to seed...');
        // logic to seed if needed, or just report
    }
}

checkTournaments();
