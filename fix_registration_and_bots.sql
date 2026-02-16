
-- ===============================================================
-- FIX: REGISTRATION & SERVER-SIDE BOT MANAGEMENT
-- ===============================================================

-- 1. FIX REGISTRATION RPC (Add search_path and better error handling)
CREATE OR REPLACE FUNCTION process_human_buyin(tournament_id_param TEXT, amount_param DECIMAL)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public -- CRITICAL FIX
AS $$
DECLARE 
    v_user_id UUID := auth.uid();
    v_balance DECIMAL;
BEGIN
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated'; 
    END IF;

    -- Check balance first for better error message
    SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
    
    IF v_balance < amount_param THEN
        RAISE EXCEPTION 'Insufficient funds: Balance % < Buy-in %', v_balance, amount_param;
    END IF;

    -- Deduct
    UPDATE public.profiles 
    SET balance = balance - amount_param 
    WHERE id = v_user_id;

    -- Log Transaction
    INSERT INTO public.transactions (user_id, type, amount, method, status) 
    VALUES (v_user_id, 'poker_buyin', amount_param, 'poker_platform', 'completed');
END;
$$;

-- 2. SERVER-SIDE BOT POPULATION (Replaces Edge Function logic)
CREATE OR REPLACE FUNCTION ensure_bots_and_start()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    t RECORD;
    b RECORD;
    v_needed INT;
    v_count INT;
    v_added INT;
    v_bot_id TEXT;
BEGIN
    -- A. START TOURNAMENTS (Transition Registering -> Running)
    UPDATE public.tournaments
    SET status = 'running'
    WHERE status = 'registering' 
      AND scheduled_start_time <= now();

    -- B. POPULATE BOTS (For Registering/Late Reg tournaments)
    FOR t IN 
        SELECT * FROM public.tournaments 
        WHERE status IN ('registering', 'late_reg', 'running') -- Include running to fix stuck ones
          AND (scheduled_start_time <= now() + interval '10 minutes' OR status = 'running')
    LOOP
        -- Check player count
        SELECT count(*) INTO v_count 
        FROM public.tournament_participants 
        WHERE tournament_id = t.id;

        -- Target: 6 players (Min for good game)
        IF v_count < 6 THEN
            v_needed := 6 - v_count;
            
            -- Add bots one by one
            FOR i IN 1..v_needed LOOP
                -- Pick random bot not in tournament
                SELECT id INTO v_bot_id
                FROM public.bots
                WHERE id NOT IN (
                    SELECT bot_id FROM public.tournament_participants 
                    WHERE tournament_id = t.id AND bot_id IS NOT NULL
                )
                ORDER BY random()
                LIMIT 1;

                IF v_bot_id IS NOT NULL THEN
                    INSERT INTO public.tournament_participants (tournament_id, bot_id, stack, status)
                    VALUES (t.id, v_bot_id, t.buy_in * 100, 'active'); -- Assuming 100BB stack or similar
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;

-- 3. SCHEDULE IT (Every minute)
SELECT cron.schedule('poker-bot-manager', '* * * * *', $$
    SELECT ensure_bots_and_start();
$$);

-- 4. CLEANUP OLD CRON (If exists)
-- We keep 'poker-simulation-tick' for the Edge Function (Game Logic), 
-- but this new one handles the "Waiting for players" issue directly in DB.
