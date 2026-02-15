
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('--- Database Diagnosis ---');

    const { count: bots, error: botErr } = await supabase.from('bots').select('*', { count: 'exact', head: true });
    console.log(`Bots Count: ${bots}`);
    if (botErr) console.error('Bot Error:', botErr);

    const { count: profiles, error: profErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log(`Profiles Count: ${profiles}`);
    if (profErr) console.error('Profile Error:', profErr);

    const { count: tournaments, error: tourErr } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
    console.log(`Tournaments Count: ${tournaments}`);
    if (tourErr) console.error('Tournament Error:', tourErr);

    // Test insertion
    console.log('\nTesting Bot Insertion...');
    const testBot = {
        id: `test_bot_${Date.now()}`,
        name: 'TestBot',
        avatar: 'test',
        balance: 1000
    };
    const { error: insErr } = await supabase.from('bots').insert(testBot);
    if (insErr) {
        console.error('Insertion Failed:', insErr);
    } else {
        console.log('Insertion Successful!');
        // Cleanup
        await supabase.from('bots').delete().eq('id', testBot.id);
    }
}

diagnose();
