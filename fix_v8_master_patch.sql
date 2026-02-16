
-- ===============================================================
-- FIX V8: MASTER SCHEMA PATCH & RPC UPGRADE
-- Resolves: Missing 'stack' column, FK violations, and JIT Profiles
-- ===============================================================

DO $$
BEGIN
    -- 1. Ensure 'stack' column exists in tournament_participants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tournament_participants' AND column_name = 'stack'
    ) THEN
        ALTER TABLE public.tournament_participants ADD COLUMN stack DECIMAL DEFAULT 0;
    END IF;

    -- 2. Decouple from auth.users (to support test/guest accounts)
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.tournament_participants DROP CONSTRAINT IF EXISTS tournament_participants_user_id_fkey;
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

    -- 3. Ensure profiles table has correct structure for JIT
    -- (Nothing to change here, just ensuring it's ready)
END $$;

-- 4. RPC VERSION 8: Optimized with JIT and Schema Safety
CREATE OR REPLACE FUNCTION join_or_tick_tournament_v8(t_id TEXT, u_id_param UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), u_id_param);
    v_buy_in DECIMAL;
    v_balance DECIMAL;
    v_type TEXT;
    v_players_count INT;
    v_min_players INT;
    v_initial_stack DECIMAL := 10000; -- Default stack for tournaments
BEGIN
    -- 0. Auth check
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- 1. JIT Profile (Ensures user exists for transactions)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
        INSERT INTO public.profiles (id, name, balance) 
        VALUES (v_user_id, 'Player ' || substr(v_user_id::text, 1, 5), 10000);
    END IF;

    -- 2. Fetch tournament info
    SELECT buy_in, type, COALESCE(min_players, 2) 
    INTO v_buy_in, v_type, v_min_players 
    FROM public.tournaments WHERE id = t_id;

    IF v_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- 3. Current count
    SELECT count(*) INTO v_players_count FROM public.tournament_participants
     WHERE tournament_id = t_id AND status = 'active';

    -- 4. CASH GAMES
    IF v_type = 'cash' THEN
        -- Auto-fill bots (aim for 5 players total)
        INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, 10000, 'active' FROM public.bots
        WHERE id NOT IN (SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t_id)
        ORDER BY random() LIMIT GREATEST(0, 5 - v_players_count) ON CONFLICT DO NOTHING;

        -- Register human
        IF NOT EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
            SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
            IF v_balance < v_buy_in THEN RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds'); END IF;
            
            UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
            INSERT INTO public.transactions (user_id, type, amount, method, status) VALUES (v_user_id, 'buyin', v_buy_in, 'cash', 'completed');
            INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status) VALUES (t_id, v_user_id, v_buy_in, 'active');
        END IF;

        UPDATE public.tournaments SET status = 'running' WHERE id = t_id AND status != 'running';
        RETURN jsonb_build_object('success', true, 'message', 'Cash game active');
    END IF;

    -- 5. TOURNAMENTS
    IF NOT EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
        IF v_balance < v_buy_in THEN RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds'); END IF;
        
        UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
        INSERT INTO public.transactions (user_id, type, amount, method, status) VALUES (v_user_id, 'buyin', v_buy_in, 'tournament', 'completed');
        INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status) VALUES (t_id, v_user_id, v_initial_stack, 'active');
    END IF;

    -- Fill bots if needed
    SELECT count(*) INTO v_players_count FROM public.tournament_participants WHERE tournament_id = t_id AND status = 'active';
    IF v_players_count < v_min_players THEN
        INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, v_initial_stack, 'active' FROM public.bots
        WHERE id NOT IN (SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t_id)
        ORDER BY random() LIMIT (v_min_players - v_players_count) ON CONFLICT DO NOTHING;
    END IF;

    -- Sync and Start
    UPDATE public.tournaments SET players_count = v_players_count WHERE id = t_id;
    IF v_players_count >= v_min_players THEN
        UPDATE public.tournaments SET status = 'running', scheduled_start_time = COALESCE(scheduled_start_time, now()) WHERE id = t_id AND status = 'registering';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Joined');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
