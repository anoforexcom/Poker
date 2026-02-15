
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyScheduler() {
    try {
        console.log('--- APPLYING SCHEDULER FUNCTION ---');

        // Read SQL file
        const sqlPath = path.resolve('backend_scheduler.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL via RPC (or raw query if possible, but usually RPC is safer)
        // Since we can't run raw SQL via JS client easily without a helper function, 
        // we might need to rely on the dashboard or use a workaround.
        // WORKAROUND: We will use the 'exec_sql' RPC if it exists (common pattern) 
        // OR we just create the function via the Supabase Dashboard which the user might have to do.
        // BUT wait, this is a user-approved task. I'll try to use a specialized RPC call if I can, 
        // or just accept that I need the user to run it.

        // HOWEVER, I have a service role key. Can I run raw SQL? No, standard client doesn't support it.
        // I will assume there is an `exec_sql` function or similar from previous tasks.
        // Let's check if we can just create a function via the REST API? No.

        // ALTERNATIVE: I will try to use the restricted `pg_net` or similar if available, but simplest is:
        // User has to run this SQL in the dashboard SQL editor OR I can try to use a pre-existing `exec` function.

        // Let's check if `exec_sql` exists by trying to call it.
        const { error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('❌ Failed to execute SQL via RPC:', error);
            console.log('⚠️ Please copy the content of backend_scheduler.sql and run it in your Supabase SQL Editor.');
        } else {
            console.log('✅ SQL Function created successfully!');

            // Now test it
            console.log('Testing ensure_active_tournaments()...');
            const { error: runError } = await supabase.rpc('ensure_active_tournaments');
            if (runError) {
                console.error('❌ Failed to run ensure_active_tournaments:', runError);
            } else {
                console.log('✅ ensure_active_tournaments() ran successfully. Check lobby!');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

applyScheduler();
