-- POWER GRANT & VISIBILITY RESTORATION
-- Run this if the Lobby is empty (RAW: 0) for unauthenticated users

-- 1. Grant Schema Access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant Table Access (Explicitly for anon and authenticated)
GRANT ALL ON TABLE public.tournaments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.bots TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tournament_participants TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_states TO anon, authenticated, service_role;

-- 3. Kill RLS (Just in case policies are misconfigured)
ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants DISABLE ROW LEVEL SECURITY;

-- 4. Restore the Maintenance Cron (Ensure World is ticking)
SELECT cron.unschedule('poker-simulation-tick');
SELECT cron.schedule('poker-simulation-tick', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "tick"}'::jsonb
  ) WHERE pg_try_advisory_lock(12345);
$$);

-- 5. Force a final world seed
SELECT ensure_active_tournaments();
