
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupZombies() {
    console.log('--- CLEANING UP ZOMBIE TOURNAMENTS ---');

    // Delete tournaments with status 'registering' and NULL scheduled_start_time
    // (Excluding Sit & Go if they are meant to be null? But my scheduler sets time for Sit & Go too)

    const { data: before, error: e1 } = await supabase
        .from('tournaments')
        .select('id')
        .eq('status', 'registering')
        .is('scheduled_start_time', null);

    console.log(`Found ${before?.length || 0} zombie tournaments.`);

    if (before && before.length > 0) {
        const { error } = await supabase
            .from('tournaments')
            .delete()
            .eq('status', 'registering')
            .is('scheduled_start_time', null);

        if (error) console.error('Error deleting:', error);
        else console.log('✅ Deleted zombie tournaments.');
    }
}

cleanupZombies();
