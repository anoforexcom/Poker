
-- ========================================================
-- FIX V4: TORNEIOS COM MIN/MAX PLAYERS + CASH + SITS/SPINS
-- (Suggested by ChatGPT - Verified & Cleaned)
-- ========================================================

-- 1. ADD COLUMNS (Safe if exist)
ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS min_players INT DEFAULT 2, -- Standard lowered to 2 for quick testing
    ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 9999;

-- Update defaults for types
UPDATE public.tournaments SET min_players = 2 WHERE type = 'cash';
UPDATE public.tournaments SET min_players = 6 WHERE type = 'tournament'; 
UPDATE public.tournaments SET min_players = 2 WHERE type = 'sng'; -- Allow SNG to start with 2 for testing

-- 2. THE FUNCTION
CREATE OR REPLACE FUNCTION join_tournament_v4(t_id TEXT)
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
    v_stack DECIMAL;
    v_needed_bots INT;
    v_count INT;
    v_min_players INT;
    v_max_players INT;
BEGIN
    -- Validação
    IF v_user_id IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated'); 
    END IF;

    SELECT buy_in, status, type, min_players, max_players 
    INTO v_buy_in, v_status, v_type, v_min_players, v_max_players
    FROM public.tournaments WHERE id = t_id;

    IF v_buy_in IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found'); 
    END IF;

    -- Allow joining if registering or late_reg. 
    -- If 'running', allow only if type is cash or late reg? 
    -- Simplified: Allow if not finished.
    IF v_status = 'finished' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament finished'); 
    END IF;

    SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
    IF v_balance < v_buy_in THEN 
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds'); 
    END IF;

    -- Já registado?
    IF EXISTS (SELECT 1 FROM public.tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already joined');
    END IF;

    -- Stack inicial
    IF v_type = 'cash' THEN
        v_stack := v_buy_in;
    ELSE
        v_stack := 10000;
    END IF;

    -- Compra e entrada
    UPDATE public.profiles SET balance = balance - v_buy_in WHERE id = v_user_id;
    INSERT INTO public.transactions (user_id, type, amount, method, status) 
    VALUES (v_user_id, 'buyin', v_buy_in, 'system', 'completed');

    INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status) 
    VALUES (t_id, v_user_id, v_stack, 'active');

    -- Contagem de participantes
    SELECT COUNT(*) INTO v_count FROM public.tournament_participants WHERE tournament_id = t_id;

    -- BOTS: FORCE POPULATE IF BELOW MIN PLAYERS (MODIFIED to include ALL types for testing)
    -- Original ChatGPT logic excluded cash/sng, but for testing "Waiting for Players", we WANT bots everywhere.
    IF v_count < v_min_players THEN
        v_needed_bots := v_min_players - v_count;
        INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, 10000, 'active' -- Use 10k fixed for bots for now
        FROM public.bots
        WHERE id NOT IN (SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t_id AND bot_id IS NOT NULL)
        ORDER BY random()
        LIMIT v_needed_bots
        ON CONFLICT DO NOTHING;

        -- Re-count after bots
        SELECT COUNT(*) INTO v_count FROM public.tournament_participants WHERE tournament_id = t_id;
    END IF;

    -- Atualiza players_count na tabela
    UPDATE public.tournaments 
    SET players_count = v_count
    WHERE id = t_id;

    -- Arranca torneio logic
    -- Start if min players reached
    IF v_status = 'registering' AND v_count >= v_min_players THEN
        UPDATE public.tournaments
        SET status = 'running',
            current_blind_level = COALESCE(current_blind_level, 1),
            scheduled_start_time = COALESCE(scheduled_start_time, now())
        WHERE id = t_id;
        
        -- Start Hand? This is normally done by cron/edge function, but we set status to running.
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Joined tournament', 'players', v_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
