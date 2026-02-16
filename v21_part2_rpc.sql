
-- PART 2: SECURE REGISTRATION RPC
-- Run this second. It fixes the registration logic and status checks.

DROP FUNCTION IF EXISTS join_or_tick_tournament_v9(TEXT, UUID);

CREATE OR REPLACE FUNCTION join_or_tick_tournament_v9(
    t_id TEXT,
    u_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
    v_buyin NUMERIC;
    v_balance BIGINT;
    v_count INT;
    v_max INT;
BEGIN
    SELECT status, buy_in, max_players, players_count 
    INTO v_status, v_buyin, v_max, v_count
    FROM public.tournaments WHERE id = t_id;

    IF v_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    -- Include all valid "open" statuses
    IF v_status NOT IN ('registering', 'late_reg', 'active', 'Running', 'running') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration closed (Status: ' || v_status || ')');
    END IF;

    IF v_count >= v_max AND v_status = 'registering' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament full');
    END IF;

    SELECT balance INTO v_balance FROM public.profiles WHERE id = u_id_param;
    IF v_balance < v_buyin THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds');
    END IF;

    INSERT INTO tournament_participants (tournament_id, user_id, status)
    VALUES (t_id, u_id_param, 'active')
    ON CONFLICT DO NOTHING;

    UPDATE profiles SET balance = balance - v_buyin WHERE id = u_id_param;

    RETURN jsonb_build_object('success', true, 'message', 'Registered successfully');
END;
$$;
