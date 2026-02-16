
-- ===============================================================
-- FIX V7: JIT PROFILES & REMOVE auth.users CONSTRAINTS
-- This allows "Magic Login" and "Guest" accounts to work without real Supabase users.
-- ===============================================================

DO $$
BEGIN
    -- 1. Remove strict auth.users constraints from profiles
    BEGIN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Could not drop profiles_id_fkey';
    END;

    -- 2. Remove strict auth.users constraints from participants
    BEGIN
        ALTER TABLE public.tournament_participants DROP CONSTRAINT IF EXISTS tournament_participants_user_id_fkey;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Could not drop tournament_participants_user_id_fkey';
    END;

    -- 3. Remove strict auth.users constraints from transactions
    BEGIN
        ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Could not drop transactions_user_id_fkey';
    END;
END $$;

-- 4. Re-link constraints to profiles (instead of auth.users) for integrity
-- (Wait: Optional, let's keep it simple and just use UUID columns for now to avoid cascading issues)

-- ===============================================================
-- FUNCTION V7: Now with JIT (Just-In-Time) Profile Creation
-- ===============================================================

CREATE OR REPLACE FUNCTION join_or_tick_tournament_v7(t_id TEXT, u_id_param UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), u_id_param);
    v_buy_in DECIMAL;
    v_balance DECIMAL;
    v_type TEXT;
    v_players_count INT;
    v_min_players INT;
BEGIN
    -- 0. Check authentication
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated (No Session or ID)');
    END IF;

    -- 1. JIT PROFILE CREATION (Critical for Magic Login)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
        INSERT INTO public.profiles (id, name, avatar_url, balance, rank)
        VALUES (
            v_user_id, 
            'Guest Player', 
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || v_user_id::text, 
            10000, 
            'Bronze'
        );
    END IF;

    -- 2. Fetch tournament info
    SELECT buy_in, type, COALESCE(min_players, 2) 
    INTO v_buy_in, v_type, v_min_players 
    FROM public.tournaments WHERE id = t_id;

    IF v_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- 3. Count current participants (Atomic)
    SELECT count(*) INTO v_players_count FROM public.tournament_participants
     WHERE tournament_id = t_id AND status = 'active';

    -- 4. CASH GAMES
    IF v_type = 'cash' THEN
        -- Bot filling (Refill up to 5)
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
            INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status) VALUES (t_id, v_user_id, 10000, 'active');
        END IF;

        UPDATE public.tournaments SET status = 'running' WHERE id = t_id AND status != 'running';
        RETURN jsonb_build_object('success', true, 'message', 'Cash game joined');
    END IF;

    -- 5. TOURNAMENTS (SNG/Scheduled)
    IF NOT EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
        IF v_balance < v_buy_in THEN RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds'); END IF;
        
        UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
        INSERT INTO public.transactions (user_id, type, amount, method, status) VALUES (v_user_id, 'buyin', v_buy_in, 'tournament', 'completed');
        INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status) VALUES (t_id, v_user_id, 10000, 'active');
    END IF;

    -- Bot filling
    SELECT count(*) INTO v_players_count FROM public.tournament_participants WHERE tournament_id = t_id AND status = 'active';
    IF v_players_count < v_min_players THEN
        INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, 10000, 'active' FROM public.bots
        WHERE id NOT IN (SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t_id)
        ORDER BY random() LIMIT (v_min_players - v_players_count) ON CONFLICT DO NOTHING;
        
        SELECT count(*) INTO v_players_count FROM public.tournament_participants WHERE tournament_id = t_id AND status = 'active';
    END IF;

    -- Start
    UPDATE public.tournaments SET players_count = v_players_count WHERE id = t_id;
    IF v_players_count >= v_min_players THEN
        UPDATE public.tournaments SET status = 'running', scheduled_start_time = COALESCE(scheduled_start_time, now()) WHERE id = t_id AND status = 'registering';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Joined', 'players', v_players_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
