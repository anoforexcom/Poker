
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('--- CHECKING TOURNAMENTS TABLE COLUMNS ---');

    // Introspection query unlikely to work with standard client unless exposed.
    // However, we can try to insert a dummy record with NULL created_by and see the error message.

    try {
        const { error } = await supabase.from('tournaments').insert({
            name: "TEST_NULL_CREATED_BY",
            type: "sitgo",
            status: "finished",
            buy_in: 0,
            scheduled_start_time: new Date().toISOString(),
            created_by: null // Explicitly NULL
        });

        if (error) {
            console.log('Insert with NULL created_by FAILED:', error.message);
        } else {
            console.log('Insert with NULL created_by SUCCEEDED (it is nullable!)');
            // Clean up
            await supabase.from('tournaments').delete().eq('name', "TEST_NULL_CREATED_BY");
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkColumns();
