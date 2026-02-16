
-- ===============================================================
-- RECOVERY SCRIPT: RESET POKER DATABASE
-- Run this in the Supabase SQL Editor to clear locks and reset the lobby
-- ===============================================================

-- 1. Terminate other active sessions (if permission allows)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database() 
  AND pid <> pg_backend_pid()
  AND state = 'active';

-- 2. Clear out possibly corrupt or "zombie" data
DELETE FROM public.tournament_participants WHERE status = 'zombie' OR joined_at < NOW() - INTERVAL '2 hours';
DELETE FROM public.game_states WHERE created_at < NOW() - INTERVAL '2 hours';

-- 3. Reset the Lobby (Optional: only if tournaments are stuck)
-- DELETE FROM public.tournaments WHERE status NOT IN ('registering', 'running');

-- 4. Force fresh tournament generation
SELECT ensure_active_tournaments();

-- 5. Check status
SELECT count(*) as total_tournaments FROM public.tournaments;
