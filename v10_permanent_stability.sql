
-- ===============================================================
-- PHASE 20: PERMANENT STABILITY & DIVERSE LOBBY
-- ===============================================================

CREATE OR REPLACE FUNCTION ensure_active_tournaments_v10()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
    v_type TEXT;
    v_title TEXT;
    v_buyin NUMERIC;
    v_max_p INT;
    v_stagger INT := 1;
BEGIN
    -- 1. CLEANUP: Remove very old finished tournaments to keep DB light
    DELETE FROM public.tournaments WHERE status = 'finished' AND created_at < NOW() - INTERVAL '1 day';

    -- 2. ENSURE CASH GAMES (NL10, NL50, NL100, NL200)
    FOREACH v_buyin IN ARRAY ARRAY[10, 50, 100, 200] LOOP
        SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'cash' AND buy_in = v_buyin AND status = 'active';
        IF v_count = 0 THEN
            INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count)
            VALUES (gen_random_uuid()::text, 'Cash Game NL' || (v_buyin)::text, 'cash', 'active', v_buyin, 6, 0);
        END IF;
    END LOOP;

    -- 3. ENSURE SIT & GOS (6-Max and Heads-up)
    SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'sitgo' AND status = 'registering';
    IF v_count < 3 THEN
        FOR v_stagger IN 1..(3 - v_count) LOOP
            v_max_p := CASE WHEN random() > 0.7 THEN 2 ELSE 6 END;
            v_buyin := CASE WHEN random() > 0.5 THEN 50 ELSE 100 END;
            INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count, scheduled_start_time)
            VALUES (gen_random_uuid()::text, CASE WHEN v_max_p = 2 THEN 'Heads-up SNG' ELSE '6-Max SNG' END, 'sitgo', 'registering', v_buyin, v_max_p, 0, NOW() + INTERVAL '10 minutes');
        END LOOP;
    END IF;

    -- 4. ENSURE MTTs (Scheduled Tournaments)
    SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'tournament' AND status = 'registering';
    IF v_count < 2 THEN
        FOR v_stagger IN 1..(2 - v_count) LOOP
            v_buyin := 250;
            INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count, scheduled_start_time)
            VALUES (gen_random_uuid()::text, 'Daily Big Shot', 'tournament', 'registering', v_buyin, 100, 0, NOW() + (v_stagger * INTERVAL '15 minutes'));
        END LOOP;
    END IF;

    -- 5. ENSURE SPINS (3-Max Fast)
    SELECT count(*) INTO v_count FROM public.tournaments WHERE type = 'spingo' AND status = 'registering';
    IF v_count < 2 THEN
        INSERT INTO public.tournaments (id, name, type, status, buy_in, max_players, players_count, scheduled_start_time)
        VALUES (gen_random_uuid()::text, 'Hyper Spin', 'spingo', 'registering', 25, 3, 0, NOW() + INTERVAL '5 minutes');
    END IF;

END;
$$;

-- Standard wrapper
CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM ensure_active_tournaments_v10();
END;
$$;
