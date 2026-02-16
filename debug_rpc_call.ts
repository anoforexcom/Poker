
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('--- TEST RPC CALL ---');

    // 1. Get a user
    const { data: users } = await supabase.auth.getUser();
    // Wait, with service role I can't mimic a user calling RPC easily unless I sign in or use impersonation
    // But I can try to find a user and check their balance first.

    // Actually, I can't call RPC as a specific user with service role key in a way that `auth.uid()` works 
    // unless I mint a JWT for them.
    // However, I can check if the function exists and signature matches by trying to call it with invalid args
    // or checks system info.

    // Better: I will use the `debug_user_and_bots.ts` approach to check the *state* that causes failure.
    // Inspect balances.

    const { data: profiles } = await supabase.from('profiles').select('*');
    profiles.forEach(p => console.log(`User: ${p.id} Balance: ${p.balance}`));

    // 2. Inspect Tournaments
    const { data: tournaments } = await supabase.from('tournaments')
        .select('*')
        .eq('status', 'registering')
        .limit(1);

    if (tournaments && tournaments.length > 0) {
        const t = tournaments[0];
        console.log(`Tournament: ${t.id} BuyIn: ${t.buy_in} (Type: ${typeof t.buy_in})`);

        // If buy_in comes back as string, we must cast it.
        // Frontend likely receives it as number or string depending on client config?
    }

    console.log('\n--- VERIFYING PG_CRON ---');
    // I can't check cron logs, but I can check if bots are being added.
    const { count } = await supabase.from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .not('bot_id', 'is', null);

    console.log(`Total Bots in Tournaments: ${count}`);
}

testRpc();
