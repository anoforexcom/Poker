
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BOT_NAMES = [
    'Sharky99', 'WhaleHunter', 'AceInTheHole', 'VegasVibe', 'BluffMaster99',
    'RiverRat', 'GrinderPT', 'GTO_Wizard', 'FishAndChips', 'NutsCracker',
    'PocketAce', 'TheDonk', 'PokerFace_BR', 'FullHouse92', 'StackKing',
    'RoyalFlush', 'BadBeatBob', 'TiltProof', 'AcesUp', 'SetMiner',
    'TripsToWin', 'OneMoreHand', 'CashCow', 'BigStackBully', 'AggroNuts',
    'CheckRaise_Me', 'FlatCallHero', 'LimitLess_X', 'HyperTurbo', 'BubbleBoy',
    'FinalTableBound', 'MuckIt', 'FoldEquity', 'BigBlindSpecial', 'DealerButton',
    'UnderTheGun', 'HighRoller99', 'SmallStakesPro', 'SatelliteKing', 'MainEventDream',
    'LasVegasLegend', 'MonteCarloMan', 'PolderPirate', 'NordicPro', 'BrazilianStorm',
    'TokyoDrift_Ace', 'LondonCalling', 'ParisianPoker', 'BerlinGrind'
];

async function updateBots() {
    console.log("Reading bots...");
    const { data: bots, error: readError } = await supabase.from('bots').select('id');

    if (readError) {
        console.error("Error reading bots:", readError);
        return;
    }

    console.log(`Found ${bots.length} bots. Updating names...`);

    for (let i = 0; i < bots.length; i++) {
        const newName = BOT_NAMES[i % BOT_NAMES.length];
        const { error: updateError } = await supabase
            .from('bots')
            .update({ name: newName })
            .eq('id', bots[i].id);

        if (updateError) {
            console.error(`Error updating bot ${bots[i].id}:`, updateError);
        } else {
            console.log(`Updated ${bots[i].id} to ${newName}`);
        }
    }

    console.log("✅ Done.");
}

updateBots();
