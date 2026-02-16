
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMTkzMiwiZXhwIjoyMDg2NDc3OTMyfQ.lCAQ2GgfamDxu3EgR9Xks2dmd5frvp0K5s9RZs9iHbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    try {
        const sql = fs.readFileSync('fix_registration_and_bots.sql', 'utf8');
        console.log('Running SQL...');

        const { error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('RPC Error:', error);
            console.log('Fallback: If exec_sql is not defined, please copy the contents of fix_registration_and_bots.sql to the Supabase SQL Editor.');
        } else {
            console.log('✅ SQL Executed Successfully via RPC.');
        }
    } catch (e) {
        console.error('Script Error:', e);
    }
}

runSql();
