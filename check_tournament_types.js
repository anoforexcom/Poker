
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    console.log('--- CHECKING ACTIVE TOURNAMENT TYPES ---');

    const { data, error } = await supabase
        .from('tournaments')
        .select('name, type, status, scheduled_start_time')
        .in('status', ['registering', 'late_reg', 'Registering', 'Late Reg'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

checkTypes();
