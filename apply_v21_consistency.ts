
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhykmcwgznkzehxnkrbx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeWttY3dnem5remVoeG5rcmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MzIsImV4cCI6MjA4NjQ3NzkzMn0.GB0GNuTql29hM7u8Hyh8TSvRq24xMAb_jl36FEsfXq8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = `
-- 1. AUTOMATIC PLAYERS_COUNT SYNC
CREATE OR REPLACE FUNCTION sync_tournament_players_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE tournaments 
        SET players_count = (SELECT count(*) FROM tournament_participants WHERE tournament_id = NEW.tournament_id)
        WHERE id = NEW.tournament_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE tournaments 
        SET players_count = (SELECT count(*) FROM tournament_participants WHERE tournament_id = OLD.tournament_id)
        WHERE id = OLD.tournament_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_players_count ON tournament_participants;
CREATE TRIGGER tr_sync_players_count
AFTER INSERT OR DELETE ON tournament_participants
FOR EACH ROW EXECUTE PROCEDURE sync_tournament_players_count();

-- 2. SECURE REGISTRATION RPC (Status Check)
CREATE OR REPLACE FUNCTION join_or_tick_tournament_v9(
    t_id TEXT,
    u_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
    v_buyin NUMERIC;
    v_balance BIGINT;
    v_count INT;
    v_max INT;
BEGIN
    SELECT status, buy_in, max_players, players_count 
    INTO v_status, v_buyin, v_max, v_count
    FROM public.tournaments WHERE id = t_id;

    IF v_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    IF v_status NOT IN ('registering', 'late_reg', 'active', 'Running', 'running') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration closed (Status: ' || v_status || ')');
    END IF;

    IF v_count >= v_max AND v_status = 'registering' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament full');
    END IF;

    SELECT balance INTO v_balance FROM public.profiles WHERE id = u_id_param;
    IF v_balance < v_buyin THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds');
    END IF;

    INSERT INTO tournament_participants (tournament_id, user_id, status)
    VALUES (t_id, u_id_param, 'active')
    ON CONFLICT DO NOTHING;

    UPDATE profiles SET balance = balance - v_buyin WHERE id = u_id_param;

    RETURN jsonb_build_object('success', true, 'message', 'Registered successfully');
END;
$$;
`;

async function main() {
    console.log("Applying V21 Consistency SQL...");
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error("SQL application failed:", error.message);
    } else {
        console.log("✅ V21 Consistency SQL Applied successfully.");
    }
}

main();
