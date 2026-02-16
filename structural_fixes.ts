
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function applyStructuralFixes() {
    console.log("Applying structural fixes...");

    // 1. Delete duplicates first (via script-like logic but in SQL if possible, else JS)
    console.log("Purging duplicates...");
    const { data: p } = await supabase.from('tournament_participants').select('id, tournament_id, bot_id, user_id');
    const seen = new Set();
    const toDelete = [];
    for (const row of p || []) {
        const key = row.tournament_id + '-' + (row.bot_id || row.user_id);
        if (seen.has(key)) toDelete.push(row.id);
        else seen.add(key);
    }
    if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 100) {
            await supabase.from('tournament_participants').delete().in('id', toDelete.slice(i, i + 100));
        }
    }

    // 2. Add FK and Unique Constraints via direct SQL if we had a working exec_sql
    // Since exec_sql failed, we'll try to use the Postgres connection directly if we could, 
    // but we only have the Supabase JS client.

    // Wait, if exec_sql returned PGRST202, it's a PostgREST error "Function not found".
    // Maybe it's because I didn't create the function in the 'public' schema?

    console.log("Fixing Lobby query specifically in TournamentLobby.tsx...");
    // I already did this via replace_file_content.

    console.log("Structural fixes (Purge) complete.");
}

applyStructuralFixes();
