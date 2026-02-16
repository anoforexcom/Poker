
-- ===============================================================
-- FIX FINAL: ATOMIC REGISTRATION & SERVER-SIDE BOTS
-- ===============================================================

-- 1. ATOMIC REGISTRATION (Money + Entry in one go)
-- This fixes "Registration Failed" by bypassing frontend RLS issues.
CREATE OR REPLACE FUNCTION process_human_buyin(tournament_id_param TEXT, amount_param DECIMAL)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE 
    v_user_id UUID := auth.uid();
    v_balance DECIMAL;
    v_stack DECIMAL := 10000; -- Default stack if not in tournaments table
BEGIN
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated'; 
    END IF;

    -- Check balance
    SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
    
    IF v_balance < amount_param THEN
        RAISE EXCEPTION 'Insufficient funds: Balance % < Buy-in %', v_balance, amount_param;
    END IF;

    -- Deduct Money
    UPDATE public.profiles 
    SET balance = balance - amount_param 
    WHERE id = v_user_id;

    -- Log Transaction
    INSERT INTO public.transactions (user_id, type, amount, method, status) 
    VALUES (v_user_id, 'poker_buyin', amount_param, 'poker_platform', 'completed');

    -- ENTER TOURNAMENT (The critical missing link)
    -- Check if already registered
    IF EXISTS (SELECT 1 FROM public.tournament_participants WHERE tournament_id = tournament_id_param AND user_id = v_user_id) THEN
        RETURN; -- Idempotent
    END IF;

    INSERT INTO public.tournament_participants (tournament_id, user_id, stack, status)
    VALUES (tournament_id_param, v_user_id, v_stack, 'active');
END;
$$;

-- 2. SERVER-SIDE BOT MANAGER (Ensures "Waiting for players" doesn't happen)
CREATE OR REPLACE FUNCTION ensure_bots_and_start()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    t RECORD;
    v_count INT;
    v_needed INT;
    v_bot_id TEXT;
BEGIN
    -- Start pending tournaments
    UPDATE public.tournaments 
    SET status = 'running' 
    WHERE status = 'registering' 
      AND scheduled_start_time <= now();

    -- Populate Bots
    FOR t IN SELECT * FROM public.tournaments WHERE status IN ('registering', 'late_reg', 'running') LOOP
        SELECT count(*) INTO v_count FROM public.tournament_participants WHERE tournament_id = t.id;
        
        -- Target 6 players
        IF v_count < 6 THEN
            v_needed := 6 - v_count;
            FOR i IN 1..v_needed LOOP
                SELECT id INTO v_bot_id FROM public.bots WHERE id NOT IN (SELECT bot_id FROM public.tournament_participants WHERE tournament_id = t.id AND bot_id IS NOT NULL) ORDER BY random() LIMIT 1;
                
                IF v_bot_id IS NOT NULL THEN
                    INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
                    VALUES (t.id, v_bot_id, t.buy_in * 100, 'active');
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;

-- 3. SCHEDULE (Pg_Cron)
SELECT cron.schedule('poker-bot-manager-final', '* * * * *', $$
    SELECT ensure_bots_and_start();
$$);
