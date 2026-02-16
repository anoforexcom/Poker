
-- FIX V2: ROBUST REGISTRATION FUNCTION
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION join_tournament_v2(t_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_buy_in DECIMAL;
    v_balance DECIMAL;
    v_tourn_status TEXT;
BEGIN
    -- 1. Checks
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    SELECT balance INTO v_balance FROM profiles WHERE id = v_user_id;
    SELECT buy_in, status INTO v_buy_in, v_tourn_status FROM tournaments WHERE id = t_id;

    IF v_buy_in IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- Allow joining if registering OR late_reg OR running (if late reg allowed)
    IF v_tourn_status = 'finished' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament finished');
    END IF;

    IF v_balance < v_buy_in THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds');
    END IF;

    -- 2. Already Registered?
    IF EXISTS (SELECT 1 FROM tournament_participants WHERE tournament_id = t_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already joined');
    END IF;

    -- 3. Execute Buy-in
    UPDATE profiles SET balance = balance - v_buy_in WHERE id = v_user_id;

    INSERT INTO transactions (user_id, type, amount, method, status)
    VALUES (v_user_id, 'buyin', v_buy_in, 'system', 'completed');

    -- 4. Add Player
    INSERT INTO tournament_participants (tournament_id, user_id, stack, status)
    VALUES (t_id, v_user_id, 10000, 'active');

    -- 5. INSTANT BOT FILL (Emergency Logic)
    -- If valid tournament but empty, add 5 bots instantly so game starts
    IF (SELECT count(*) FROM tournament_participants WHERE tournament_id = t_id) < 6 THEN
        INSERT INTO tournament_participants (tournament_id, bot_id, stack, status)
        SELECT t_id, id, 10000, 'active' 
        FROM bots 
        WHERE id NOT IN (SELECT bot_id FROM tournament_participants WHERE tournament_id = t_id AND bot_id IS NOT NULL)
        ORDER BY random() 
        LIMIT 5
        ON CONFLICT DO NOTHING;
        
        -- Force start if time passed
        UPDATE tournaments SET status = 'running' 
        WHERE id = t_id AND status = 'registering';
    END IF;

    -- 6. Return Success
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
