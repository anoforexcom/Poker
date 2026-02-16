
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
// Temporary key for debugging
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFinished() {
    console.log('--- EMERGENCY DEBUG: FINISHED TOURNAMENTS ---');

    // Get last 10 tournaments
    const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('--- RECENT TOURNAMENTS ---');
    console.dir(tournaments, { depth: null });

    // Check for specific finished ones
    const finished = tournaments.filter(t => t.status.toLowerCase() === 'finished');
    if (finished.length > 0) {
        console.log(`\n⚠️ FOUND ${finished.length} FINISHED TOURNAMENTS!`);
        console.log('Sample Finished:', finished[0]);
    } else {
        console.log('\n✅ No tournaments in "finished" state found in top 10.');
    }
}

debugFinished();
