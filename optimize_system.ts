
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("-> Cleaning up system for performance...");

    // 1. Clear excessive bots (Keep only first 50)
    const { data: bots } = await supabase.from('bots').select('id').limit(50);
    if (bots && bots.length === 50) {
        const lastId = bots[49].id;
        console.log("Retaining 50 bots, removing others...");
        const { error } = await supabase.from('bots').delete().not('id', 'in', bots.map(b => b.id));
        if (error) console.error("Bot cleanup failed:", error.message);
        else console.log("✅ Bots pruned to healthy 50.");
    }

    // 2. Clear old tournaments
    console.log("Clearing all tournaments to force fresh generation...");
    await supabase.from('tournaments').delete().neq('id', 'dummy'); // Clear all

    // 3. Trigger Fresh Generation
    console.log("Triggering fresh tick...");
    await supabase.functions.invoke('poker-simulator', { body: { action: 'tick' } });

    console.log("🎉 System reset and optimized.");
}

main();
