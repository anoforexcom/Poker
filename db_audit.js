
const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://uhykmcwgznkzehxnkrbx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8');

async function check() {
    try {
        console.log('--- DB AUDIT START ---');

        // 1. Check Tournaments
        const { data: tours, error: tErr } = await s.from('tournaments').select('*');
        console.log('TOURNAMENTS:', { count: tours?.length || 0, error: tErr });
        if (tours && tours.length > 0) {
            console.log('First 2 tournaments:', tours.slice(0, 2).map(t => ({ id: t.id, name: t.name, status: t.status, type: t.type })));
        }

        // 2. Check Bots
        const { count: botCount, error: bErr } = await s.from('bots').select('*', { count: 'exact', head: true });
        console.log('BOTS:', { count: botCount, error: bErr });

        // 3. Check for specific emergency test
        const { data: ins, error: insErr } = await s.from('tournaments').insert({
            name: 'DIAGNOSTIC_TEST_' + Date.now(),
            status: 'registering',
            type: 'sitgo',
            buy_in: 0
        }).select();
        console.log('INSERT_TEST:', { success: !!ins, error: insErr });

        console.log('--- DB AUDIT END ---');
    } catch (e) {
        console.error('CRITICAL_FAILURE:', e);
    }
    process.exit(0);
}

check();
