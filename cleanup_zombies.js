
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
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
