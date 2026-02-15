-- 0. Ensure Core Tables Exist (Fix for missing relations)
CREATE TABLE IF NOT EXISTS public.game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  deck TEXT[] NOT NULL,
  community_cards TEXT[] DEFAULT '{}',
  current_pot DECIMAL DEFAULT 0,
  current_turn_user_id UUID,
  current_turn_bot_id TEXT,
  phase TEXT DEFAULT 'pre-flop',
  player_states JSONB DEFAULT '{}'::jsonb, -- Added to match current code
  last_raise_amount DECIMAL DEFAULT 0,
  last_raiser_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_hand_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1. Locking Mechanism (Advisory Lock Simulation for Stateless HTTP)
CREATE TABLE IF NOT EXISTS system_locks (
    key_id text PRIMARY KEY,
    locked_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    metadata jsonb
);

-- Function to acquire lock (Atomic)
CREATE OR REPLACE FUNCTION acquire_system_lock(target_key text, duration_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    got_lock boolean;
BEGIN
    -- Delete expired locks first
    DELETE FROM system_locks WHERE key_id = target_key AND expires_at < now();

    -- Try to insert
    INSERT INTO system_locks (key_id, expires_at)
    VALUES (target_key, now() + (duration_seconds || ' seconds')::interval)
    ON CONFLICT (key_id) DO NOTHING
    RETURNING true INTO got_lock;

    RETURN COALESCE(got_lock, false);
END;
$$;

-- Function to release lock
CREATE OR REPLACE FUNCTION release_system_lock(target_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM system_locks WHERE key_id = target_key;
END;
$$;


-- 2. RNG Audit Columns
ALTER TABLE game_hand_history 
ADD COLUMN IF NOT EXISTS rng_seed text,
ADD COLUMN IF NOT EXISTS server_entropy text,
ADD COLUMN IF NOT EXISTS client_entropy text;


-- 3. Idempotent Tournament Finish
CREATE OR REPLACE FUNCTION finish_tournament_safely(t_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    UPDATE tournaments
    SET status = 'finished',
        ended_at = now()
    WHERE id = t_id AND status != 'finished'
    RETURNING to_jsonb(tournaments.*) INTO result;
    
    RETURN result; -- Returns null if already finished
END;
$$;
