
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimes() {
    console.log('--- CHECKING TOURNAMENT TIMES ---');
    console.log('Current Server Time (approx):', new Date().toISOString());

    const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, scheduled_start_time, created_at')
        .in('status', ['registering', 'late_reg', 'Registering', 'Late Reg'])
        .order('scheduled_start_time', { ascending: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

checkTimes();
