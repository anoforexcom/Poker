
-- ===============================================================
-- PHASE 21: DATA CONSISTENCY & ALIGNMENT
-- ===============================================================

-- 1. AUTOMATIC PLAYERS_COUNT SYNC
CREATE OR REPLACE FUNCTION sync_tournament_players_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE tournaments 
        SET players_count = (SELECT count(*) FROM tournament_participants WHERE tournament_id = NEW.tournament_id)
        WHERE id = NEW.tournament_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE tournaments 
        SET players_count = (SELECT count(*) FROM tournament_participants WHERE tournament_id = OLD.tournament_id)
        WHERE id = OLD.tournament_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_players_count ON tournament_participants;
CREATE TRIGGER tr_sync_players_count
AFTER INSERT OR DELETE ON tournament_participants
FOR EACH ROW EXECUTE PROCEDURE sync_tournament_players_count();

-- 2. SECURE REGISTRATION RPC (Status Check)
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
    -- Get Details
    SELECT status, buy_in, max_players, players_count 
    INTO v_status, v_buyin, v_max, v_count
    FROM public.tournaments WHERE id = t_id;

    -- Validate Status
    IF v_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament not found');
    END IF;

    IF v_status NOT IN ('registering', 'late_reg', 'active') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration closed (Status: ' || v_status || ')');
    END IF;

    IF v_count >= v_max AND v_status = 'registering' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tournament full');
    END IF;

    -- Standard Balance Check
    SELECT balance INTO v_balance FROM public.profiles WHERE id = u_id_param;
    IF v_balance < v_buyin THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds');
    END IF;

    -- Atomic Register
    INSERT INTO tournament_participants (tournament_id, user_id, status)
    VALUES (t_id, u_id_param, 'active')
    ON CONFLICT DO NOTHING;

    -- Deduction
    UPDATE profiles SET balance = balance - v_buyin WHERE id = u_id_param;

    -- Return state
    RETURN jsonb_build_object('success', true, 'message', 'Registered successfully');
END;
$$;
