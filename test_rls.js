
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

// Use the ANON key, just like the frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
    console.log('--- TESTING RLS WITH ANON KEY ---');

    // Attempt to fetch tournaments
    const { data, error } = await supabase
        .from('tournaments')
        .select('name, status')
        .in('status', ['registering', 'late_reg', 'Registering', 'Late Reg']);

    if (error) {
        console.error('❌ Error fetching tournaments:', error);
    } else {
        console.log(`✅ Fetched ${data.length} tournaments.`);
        console.table(data);
    }
}

testRLS();
