
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('--- CLEANING ZOMBIE TOURNAMENTS ---');

    // 1. Delete Running tournaments with 0 players
    const { error: err1 } = await supabase
        .from('tournaments')
        .delete()
        .eq('status', 'running')
        .eq('players_count', 0);

    if (err1) console.error('Error deleting zombies:', err1);
    else console.log('✅ Deleted "Running" tournaments with 0 players.');

    // 2. Delete ALL finished tournaments (to clear the view for the user)
    // This is drastic but necessary to prove it works.
    const { error: err2 } = await supabase
        .from('tournaments')
        .delete()
        .eq('status', 'finished');

    if (err2) console.error('Error deleting finished:', err2);
    else console.log('✅ Deleted ALL "Finished" tournaments.');

    // 3. Trigger fresh generation
    console.log('Triggering generation...');
    const { error: rpcError } = await supabase.rpc('ensure_active_tournaments');

    if (rpcError) console.error('RPC Error:', rpcError);
    else console.log('✅ RPC ensure_active_tournaments executed.');
}

cleanup();
