
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testScheduler() {
    console.log('--- TESTING SCHEDULER RPC ---');

    // Call the function we just created
    const { data, error } = await supabase.rpc('ensure_active_tournaments');

    if (error) {
        console.error('❌ RPC Call Failed:', error);
    } else {
        console.log('✅ RPC Call Successful! The WorldState Controller ran.');
        console.log('Checking for new tournaments...');

        // Check results
        const { data: tournaments } = await supabase
            .from('tournaments')
            .select('id, name, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        console.table(tournaments);
    }
}

testScheduler();
