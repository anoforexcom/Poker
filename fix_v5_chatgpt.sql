
-- ===============================================================
-- FIX V5: CASH GAMES ALWAYS ACTIVE + ROBUST JOIN
-- (User Provided - Optimized for Cash/SNG/MTT)
-- ===============================================================

-- 1. Ensure Columns Exist
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS min_players INT DEFAULT 2;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 9999;

-- 2. The V5 Function
CREATE OR REPLACE FUNCTION join_or_tick_tournament_v5(t_id TEXT)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_buy_in DECIMAL;
    v_balance DECIMAL;
    v_status TEXT;
    v_type TEXT;
    v_players_count INT;
    v_min_players INT;
    v_max_players INT;
BEGIN
    -- 0. Check authentication
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- 1. Fetch tournament info
    SELECT buy_in, status, type, min_players, max_players 
    INTO v_buy_in, v_status, v_type, v_min_players, v_max_players 
    FROM public.tournaments WHERE id = t_id;

    IF v_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- Defaults if null
    v_min_players := COALESCE(v_min_players, 2);

    -- 2. Count current participants
    SELECT count(*) INTO v_players_count FROM public.tournament_participants
     WHERE tournament_id = t_id AND status = 'active';

    -- 3. CASH GAMES (Always Running + Min Bots)
    IF v_type = 'cash' THEN
        -- Ensure at least 5 bots per table (or v_min_players if higher)
        INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, 10000, 'active'
        FROM public.bots
        WHERE id NOT IN (
            SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t_id AND bot_id IS NOT NULL
        )
        ORDER BY random()
        LIMIT GREATEST(0, 5 - v_players_count) 
        ON CONFLICT DO NOTHING;

        -- Register human if not already
        IF NOT EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
            SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
            IF v_balance < v_buy_in THEN
                RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds');
            END IF;

            -- Deduct buy-in and Add
            UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
            INSERT INTO public.transactions (user_id, type, amount, method, status)
            VALUES (v_user_id, 'buyin', v_buy_in, 'cash_game', 'completed');

            INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status)
            VALUES (t_id, v_user_id, 10000, 'active'); -- Cash game stack = 100 buyins? Or buyin? Using 10k fixed for now as per previous logic
        END IF;

        -- Ensure tournament status is running
        UPDATE public.tournaments SET status = 'running' WHERE id = t_id AND status != 'running';

        RETURN jsonb_build_object('success', true, 'message', 'Cash game joined');
    END IF;

    -- 4. REGULAR TOURNAMENTS (SNG, MTT, SPIN)
    IF NOT EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        IF v_status = 'finished' THEN
             RETURN jsonb_build_object('success', false, 'message', 'Tournament finished');
        END IF;
        
        SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
        IF v_balance < v_buy_in THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds');
        END IF;

        -- Deduct & Add
        UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
        INSERT INTO public.transactions (user_id, type, amount, method, status)
        VALUES (v_user_id, 'buyin', v_buy_in, 'tournament', 'completed');

        INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status)
        VALUES (t_id, v_user_id, 10000, 'active');
    END IF;

    -- 5. Auto-Fill Bots (If below min players)
    -- Modified to ALWAYS fill if below min, to ensure start.
    SELECT count(*) INTO v_players_count FROM public.tournament_participants WHERE tournament_id = t_id AND status = 'active';
    
    IF v_players_count < v_min_players THEN
        INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, 10000, 'active'
        FROM public.bots
        WHERE id NOT IN (SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t_id AND bot_id IS NOT NULL)
        ORDER BY random()
        LIMIT (v_min_players - v_players_count)
        ON CONFLICT DO NOTHING;
        
        -- Update count
        SELECT count(*) INTO v_players_count FROM public.tournament_participants WHERE tournament_id = t_id AND status = 'active';
    END IF;

    -- 6. Start if ready
    UPDATE public.tournaments SET players_count = v_players_count WHERE id = t_id;

    IF v_players_count >= v_min_players AND v_status = 'registering' THEN
        UPDATE public.tournaments 
        SET status = 'running',
            scheduled_start_time = COALESCE(scheduled_start_time, now())
        WHERE id = t_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Joined', 'players', v_players_count);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
