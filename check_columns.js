
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
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
