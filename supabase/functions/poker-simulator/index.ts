import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("🚀 Poker Simulator Edge Function Started");

serve(async (req) => {
    try {
        const { action } = await req.json();

        if (action === 'tick') {
            await processSimulationTick();
            await processGameProgression();
            return new Response(JSON.stringify({ success: true, message: 'Tick processed' }), { headers: { "Content-Type": "application/json" } });
        }

        if (action === 'seed') {
            await seedInitialData();
            return new Response(JSON.stringify({ success: true, message: 'Seeding triggered' }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});

async function seedInitialData() {
    // Logic from tournamentSimulator.ts ported here...
    // (Simplified for this snippet, but would include bot seeding and initial schedule)
    console.log("Seeding data...");
}

async function processSimulationTick() {
    const now = new Date();
    const { data: activeTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'finished');

    if (!activeTournaments) return;

    for (const t of activeTournaments) {
        const startTime = new Date(t.scheduled_start_time);
        const lateRegUntil = new Date(t.late_reg_until);

        // Status logic...
        let newStatus = t.status;
        if (now > lateRegUntil && t.status !== 'running') newStatus = 'running';
        else if (now > startTime && now <= lateRegUntil && t.status !== 'late_reg' && t.status !== 'running') newStatus = 'late_reg';

        if (newStatus !== t.status) {
            await supabase.from('tournaments').update({ status: newStatus }).eq('id', t.id);
        }

        // Bot filling logic...
        if (t.status === 'registering' || t.status === 'late_reg') {
            // Logic from frontend simulator...
        }
    }
}

async function processGameProgression() {
    // Logic for eliminations and concluding tournaments...
}
