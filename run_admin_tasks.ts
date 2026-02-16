
import { createClient } from '@supabase/supabase-js';

// Configuration (Copied from local_super_scheduler.ts)
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const REALISTIC_NAMES = [
    "TexasDolly", "PokerPro99", "RiverRat", "BluffMaster", "PocketRockets", "CardShark", "LuckyLuke", "ThePro",
    "FullHouse", "RoyalFlush", "BigBlind", "CheckMate", "FoldEm", "RaiseIt", "ShortStack", "HighRoller",
    "FishHook", "SharkFin", "AceHigh", "DeuceSeven", "NutFlush", "BadBeat", "TiltMaster", "Grinder",
    "Rounder", "Maverick", "PotCommitted", "AllInJoe", "SlowPlay", "BlindStealer", "ChipLeader", "BubbleBoy"
];

async function main() {
    console.log("🚀 Running Admin Tasks...");

    // 1. Rename Bots
    console.log("-> Renaming Bots...");
    const { data: bots, error: fetchError } = await supabase.from('bots').select('*');
    if (fetchError) {
        console.error("Error fetching bots:", fetchError);
    } else {
        console.log(`Found ${bots.length} bots. Updating names...`);
        for (let i = 0; i < bots.length; i++) {
            const bot = bots[i];
            const newName = REALISTIC_NAMES[i % REALISTIC_NAMES.length] + (Math.floor(i / REALISTIC_NAMES.length) + 1);
            // console.log(`Renaming ${bot.name} -> ${newName}`);
            await supabase.from('bots').update({ name: newName }).eq('id', bot.id);
        }
        console.log("✅ Bots renamed.");
    }

    // 2. Debug Stuck Games
    console.log("\n-> Debugging Stuck Games...");
    const { data: states, error: stateError } = await supabase
        .from('game_states')
        .select('id, tournament_id, current_turn_bot_id, current_turn_user_id, last_raise_amount, phase')
        .limit(10);

    if (stateError) {
        console.error("Error fetching game states:", stateError);
    } else {
        console.log("Current Game States:");
        states.forEach(s => {
            console.log(`[${s.tournament_id}] Phase: ${s.phase} | BotTurn: ${s.current_turn_bot_id} | UserTurn: ${s.current_turn_user_id}`);
        });
    }
}

main();
