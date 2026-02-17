CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION trigger_reactive_poker_engine()
RETURNS TRIGGER AS $$
DECLARE
    service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY'; 
    func_url TEXT := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator';
BEGIN
    IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
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

DROP TRIGGER IF EXISTS tr_reactive_engine ON public.game_states;
CREATE TRIGGER tr_reactive_engine
AFTER INSERT OR UPDATE ON public.game_states
FOR EACH ROW EXECUTE FUNCTION trigger_reactive_poker_engine();

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
