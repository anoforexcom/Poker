
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
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
