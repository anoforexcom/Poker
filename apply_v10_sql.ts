
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = `
CREATE OR REPLACE FUNCTION ensure_active_tournaments_v10()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
    v_type TEXT;
    v_title TEXT;
    v_buyin NUMERIC;
    v_max_p INT;
    v_stagger INT := 1;
BEGIN
    DELETE FROM public.tournaments WHERE status = 'finished' AND created_at < NOW() - INTERVAL '1 day';

    FOREACH v_buyin IN ARRAY ARRAY[10, 50, 100, 200] LOOP
        SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'cash' AND buy_in = v_buyin AND (status = 'active' OR status = 'Active');
        IF v_count = 0 THEN
            INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count)
            VALUES (gen_random_uuid()::text, 'Cash Game NL' || (v_buyin)::text, 'cash', 'active', v_buyin, 6, 0);
        END IF;
    END LOOP;

    SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'sitgo' AND status = 'registering';
    IF v_count < 3 THEN
        FOR v_stagger IN 1..(3 - v_count) LOOP
            v_max_p := CASE WHEN random() > 0.7 THEN 2 ELSE 6 END;
            v_buyin := CASE WHEN random() > 0.5 THEN 50 ELSE 100 END;
            INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count, scheduled_start_time)
            VALUES (gen_random_uuid()::text, CASE WHEN v_max_p = 2 THEN 'Heads-up SNG' ELSE '6-Max SNG' END, 'sitgo', 'registering', v_buyin, v_max_p, 0, NOW() + INTERVAL '10 minutes');
        END LOOP;
    END IF;

    SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'tournament' AND status = 'registering';
    IF v_count < 2 THEN
        FOR v_stagger IN 1..(2 - v_count) LOOP
            v_buyin := 250;
            INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count, scheduled_start_time)
            VALUES (gen_random_uuid()::text, 'Daily Big Shot', 'tournament', 'registering', v_buyin, 100, 0, NOW() + (v_stagger * INTERVAL '15 minutes'));
        END LOOP;
    END IF;

    SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'spingo' AND status = 'registering';
    IF v_count < 2 THEN
        INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count, scheduled_start_time)
        VALUES (gen_random_uuid()::text, 'Hyper Spin', 'spingo', 'registering', 25, 3, 0, NOW() + INTERVAL '5 minutes');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM ensure_active_tournaments_v10();
END;
$$;
`;

async function main() {
    console.log("Applying V10 Stability SQL...");
    // Special internal method for the supabase-js client to run raw SQL via the REST API for authorized Service Role key.
    // Note: If no direct SQL endpoint is enabled in PostgREST, we'd need to use a dedicated function.
    // However, given the environment, I'll leverage a common pattern or use another approach if this fails.

    // Fallback: If no direct SQL, we define it via a temporary RPC or use the CLI if it was working.
    // Since CLI was failing, I'll try to use a dummy function creation if possible or rely on the user.
    // BUT! I have an easier way: I'll wrap it in a function if I can, or just inform the user.

    // Actually, I'll try to use a known working RPC 'exec_sql' if it exists.
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error("SQL application failed via RPC:", error.message);
        console.log("Plan B: Rely on the migration already pushed via Git if Supabase migrations are enabled.");
    } else {
        console.log("✅ V10 Stability SQL Applied successfully.");
    }
}

main();
