
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuyIns() {
    console.log('--- CHECKING BUY-INS AND MAX PLAYERS ---');

    const { data, error } = await supabase
        .from('tournaments')
        .select('name, status, buy_in, max_players')
        .in('status', ['registering', 'late_reg', 'Registering', 'Late Reg'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

checkBuyIns();
