
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("=== SYSTEM DIAGNOSTIC ===");

    // 1. Check Profiles
    const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log("Profiles in DB:", profileCount);

    // 2. Check Bots
    const { count: botCount } = await supabase.from('bots').select('*', { count: 'exact', head: true });
    console.log("Bots in DB:", botCount);

    // 3. Check Active Tournaments
    const { data: tournaments, error: tErr } = await supabase
        .from('tournaments')
        .select('name, status, type')
        .in('status', ['registering', 'late_reg', 'running', 'active', 'Registering', 'Running']);

    console.log("Active/Registering Tournaments:", tournaments?.length || 0);
    if (tournaments) {
        tournaments.forEach(t => console.log(` - [${t.status}] ${t.name} (${t.type})`));
    }

    // 4. Try to invoke the RPC
    console.log("Testing RPC 'ensure_active_tournaments'...");
    const { error: rpcErr } = await supabase.rpc('ensure_active_tournaments');
    if (rpcErr) {
        console.error("RPC FAILED (V10 might not be applied):", rpcErr.message);
    } else {
        console.log("✅ RPC 'ensure_active_tournaments' is alive and working.");
    }

    // 5. Check Sample Bots (to see if rename finished)
    const { data: sampleBots } = await supabase.from('bots').select('name').limit(5);
    console.log("Sample Bot Names:", sampleBots?.map(b => b.name).join(", "));
}

main();
