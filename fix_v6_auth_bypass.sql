
-- ===============================================================
-- FIX V6: AUTH BYPASS SUPPORT (Supports Magic Login & Guest)
-- ===============================================================

CREATE OR REPLACE FUNCTION join_or_tick_tournament_v6(t_id TEXT, u_id_param UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), u_id_param);
    v_buy_in DECIMAL;
    v_balance DECIMAL;
    v_status TEXT;
    v_type TEXT;
    v_players_count INT;
    v_min_players INT;
BEGIN
    -- 0. Check authentication (either via JWT or manual param)
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated (No Session or ID)');
    END IF;

    -- 1. Fetch tournament info
    SELECT buy_in, status, type, COALESCE(min_players, 2) 
    INTO v_buy_in, v_status, v_type, v_min_players 
    FROM public.tournaments WHERE id = t_id;

    IF v_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- 2. Count current participants
    SELECT count(*) INTO v_players_count FROM public.tournament_participants
     WHERE tournament_id = t_id AND status = 'active';

    -- 3. CASH GAMES
    IF v_type = 'cash' THEN
        -- Bot filling
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

    -- 4. TOURNAMENTS
    IF NOT EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        IF v_status = 'finished' THEN RETURN jsonb_build_object('success', false, 'message', 'Tournament finished'); END IF;
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
    IF v_players_count >= v_min_players AND v_status = 'registering' THEN
        UPDATE public.tournaments SET status = 'running', scheduled_start_time = COALESCE(scheduled_start_time, now()) WHERE id = t_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Joined', 'players', v_players_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
