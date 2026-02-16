
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

async function test() {
    try {
        console.log('Sending debug_info request...');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/poker-simulator`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ action: 'debug_info' })
        });
        const data = await res.json();
        console.log('DEBUG_RESULT:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('FETCH_ERROR:', e);
    }
    process.exit(0);
}

test();
