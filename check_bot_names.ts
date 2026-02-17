
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkBots() {
    const { data, error } = await supabase.from('bots').select('name').limit(10);
    if (error) {
        console.error('Error fetching bots:', error);
        return;
    }
    console.log('Bot names in DB:', data.map(b => b.name));

    const { data: participants, error: pError } = await supabase
        .from('tournament_participants')
        .select('bot_id, bots(name)')
        .not('bot_id', 'is', null)
        .limit(10);

    if (pError) console.error('Error fetching participants:', pError);
    else console.log('Bot names in active games:', participants.map(p => (p.bots as any)?.name));
}

checkBots();
