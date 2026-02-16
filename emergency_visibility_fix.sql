-- EMERGENCY VISIBILITY & RLS FIX
-- Run this if the Lobby is empty even though tournaments exist in the DB

-- 1. Ensure RLS allows SELECT for everyone (anon) on key tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select tournaments" ON public.tournaments;
CREATE POLICY "Allow anon select tournaments" ON public.tournaments FOR SELECT USING (true);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select bots" ON public.bots;
CREATE POLICY "Allow anon select bots" ON public.bots FOR SELECT USING (true);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select participants" ON public.tournament_participants;
CREATE POLICY "Allow anon select participants" ON public.tournament_participants FOR SELECT USING (true);

-- 2. Repair any potential naming mismatches in the DB
UPDATE public.tournaments SET type = 'tournament' WHERE type = 'Tournament';
UPDATE public.tournaments SET type = 'sitgo' WHERE type = 'Sit&Go' OR type = 'sit_and_go';

-- 3. Force a fresh replenishment
SELECT ensure_active_tournaments();
