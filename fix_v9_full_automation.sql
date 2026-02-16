
-- ===============================================================
-- PHASE 9: FULL AUTONOMOUS AUTOMATION (V9)
-- ===============================================================

-- 1. Remove any old or stuck cron jobs (gracefully)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poker-simulation-tick') THEN
        PERFORM cron.unschedule('poker-simulation-tick');
    END IF;
END $$;

-- 2. Setup the global game loop
-- IMPORTANT: Replace 'YOUR_SUPABASE_SERVICE_ROLE_KEY' with your actual key 
-- found in Supabase Dashboard -> Project Settings -> API -> service_role (secret)
-- Also ensure the URL matches your project ID: uhykmcwgznkzehxnkrbx

SELECT cron.schedule('poker-simulation-tick', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "tick"}'::jsonb
  ) WHERE pg_try_advisory_lock(12345);
$$);

-- 3. Optional: Trigger a seed immediately via SQL to populate bots
-- This ensures the server starts filling games as soon as you run this script.
SELECT net.http_post(
  url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{"action": "seed"}'::jsonb
);

-- ===============================================================
-- NEXT STEPS FOR THE USER:
-- 1. Run "supabase functions deploy poker-simulator" in your terminal.
-- 2. Run this SQL script in the Supabase Query Editor (with your key).
-- 3. Enjoy! The server is now in control. 🚀
-- ===============================================================
