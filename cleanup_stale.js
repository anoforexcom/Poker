
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
// Using Service Role Key for deletion
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupStale() {
    console.log('--- CLEANING UP STALE TOURNAMENTS ---');

    // Delete registering tournaments older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('tournaments')
        .delete()
        .eq('status', 'registering')
        .lt('created_at', twoHoursAgo)
        .select();

    if (error) {
        console.error('Error deleting stale tournaments:', error);
    } else {
        console.log(`Deleted ${data.length} stale tournaments.`);
        data.forEach(t => console.log(` - Deleted: ${t.name} (Created: ${t.created_at})`));
    }
}

cleanupStale();
