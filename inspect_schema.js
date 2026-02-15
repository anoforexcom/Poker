
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
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
