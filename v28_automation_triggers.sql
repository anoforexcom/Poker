-- ALWAYS-ON AUTOMATION: SERVER-SIDE ENGINE
-- This script makes the game reactive without needing a terminal.

-- 1. EXTENSIONS (Must be enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. SECURE SERVICE ROLE VAULT (Optional but recommended)
-- For now, we will guide the user to replace the key in the trigger.

-- 3. REACTIVE TRIGGER FUNCTION
-- This wakes up the simulator immediately after any state change.
CREATE OR REPLACE FUNCTION trigger_reactive_poker_engine()
RETURNS TRIGGER AS $$
DECLARE
    service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY'; -- ATENÇÃO: Substituir pela Service Role Key real
    func_url TEXT := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator';
BEGIN
    -- Only trigger if the turn owner changed or phase changed to avoid infinite loops
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.current_turn_bot_id IS DISTINCT FROM NEW.current_turn_bot_id OR 
            OLD.current_turn_user_id IS DISTINCT FROM NEW.current_turn_user_id OR
            OLD.phase IS DISTINCT FROM NEW.phase OR
            OLD.updated_at IS DISTINCT FROM NEW.updated_at) THEN
            
            PERFORM net.http_post(
                url := func_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || service_role_key
                ),
                body := jsonb_build_object(
                    'action', 'tick',
                    'tournament_id', NEW.tournament_id
                )
            );
        END IF;
    END IF;

    -- Also trigger on new game states (start of hand)
    IF (TG_OP = 'INSERT') THEN
        PERFORM net.http_post(
            url := func_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := jsonb_build_object(
                'action', 'tick',
                'tournament_id', NEW.tournament_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. BIND TRIGGER
DROP TRIGGER IF EXISTS tr_reactive_engine ON public.game_states;
CREATE TRIGGER tr_reactive_engine
AFTER INSERT OR UPDATE ON public.game_states
FOR EACH ROW EXECUTE FUNCTION trigger_reactive_poker_engine();

-- 5. RELIABLE MAINTENANCE CRON
-- This ensures the ecosystem keeps ticking even without moves.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poker-heartbeat') THEN PERFORM cron.unschedule('poker-heartbeat'); END IF;
END $$;

SELECT cron.schedule('poker-heartbeat', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "tick"}'::jsonb
  );
$$);
