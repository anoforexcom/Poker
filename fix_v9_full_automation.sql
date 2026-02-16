
-- ===============================================================
-- FIX V9: FULL AUTOMATION & PERFORMANCE OPTIMIZATION
-- Resolves: Slow registration, failing joins, and high-latency phase transitions
-- ===============================================================

-- 1. Optimized RPC for joining tournaments
CREATE OR REPLACE FUNCTION join_or_tick_tournament_v9(t_id TEXT, u_id_param UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), u_id_param);
    v_buy_in DECIMAL;
    v_balance DECIMAL;
    v_type TEXT;
    v_players_count INT;
    v_min_players INT;
    v_initial_stack DECIMAL := 10000;
BEGIN
    -- Auth check
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- JIT Profile
    INSERT INTO public.profiles (id, name, balance) 
    VALUES (v_user_id, 'Player ' || substr(v_user_id::text, 1, 5), 10000)
    ON CONFLICT (id) DO NOTHING;

    -- 1. Fetch tournament info (lock the row to prevent race conditions during registration)
    SELECT buy_in, type, COALESCE(min_players, 2) 
    INTO v_buy_in, v_type, v_min_players 
    FROM public.tournaments WHERE id = t_id FOR UPDATE;

    IF v_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- 2. Fast Join check
    IF EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already registered');
    END IF;

    -- 3. Balance verification
    SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_balance < v_buy_in THEN 
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds'); 
    END IF;

    -- 4. Atomic Transaction
    UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
    INSERT INTO public.transactions (user_id, type, amount, method, status) 
    VALUES (v_user_id, 'buyin', v_buy_in, v_type, 'completed');
    
    INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status) 
    VALUES (t_id, v_user_id, CASE WHEN v_type = 'cash' THEN v_buy_in ELSE v_initial_stack END, 'active');

    -- 5. Sync count
    SELECT count(*) INTO v_players_count FROM public.tournament_participants
    WHERE tournament_id = t_id AND status = 'active';
    
    UPDATE public.tournaments SET players_count = v_players_count WHERE id = t_id;

    -- 6. Instant Promotion for SitGo/SpinGo if full
    IF (v_type = 'sitgo' OR v_type = 'spingo') AND v_players_count >= v_min_players THEN
        UPDATE public.tournaments SET status = 'running', scheduled_start_time = now() 
        WHERE id = t_id AND status = 'registering';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Registration successful');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
