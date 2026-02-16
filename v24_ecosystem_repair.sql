
-- ECOSYSTEM REFRESH V24
-- Seeds all game types and ensures stability

CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_i INT;
    v_type TEXT;
    v_name TEXT;
    v_buyin DECIMAL;
    v_max INT;
BEGIN
    -- Only seed if we are low on games (< 8)
    IF (SELECT count(*) FROM public.tournaments WHERE status = 'registering') > 8 THEN
        RETURN;
    END IF;

    FOR v_i IN 1..10 LOOP
        -- Distribute types
        v_type := CASE 
            WHEN v_i <= 2 THEN 'cash'
            WHEN v_i <= 4 THEN 'spingo'
            WHEN v_i <= 7 THEN 'sitgo'
            ELSE 'tournament'
        END;

        -- Metadata based on type
        CASE v_type
            WHEN 'cash' THEN
                v_name := 'High Stakes Cash #' || (100 + v_i);
                v_buyin := 100;
                v_max := 6;
            WHEN 'spingo' THEN
                v_name := 'Spin & GO Turbo #' || (500 + v_i);
                v_buyin := 25;
                v_max := 3;
            WHEN 'sitgo' THEN
                v_name := 'Sit & Go Pro #' || (200 + v_i);
                v_buyin := 50;
                v_max := 6;
            ELSE
                v_name := 'Daily MTT #' || (800 + v_i);
                v_buyin := 10;
                v_max := 100;
        END CASE;

        INSERT INTO public.tournaments (
            id,
            name,
            type,
            status,
            buy_in,
            prize_pool,
            players_count,
            max_players,
            scheduled_start_time,
            current_blind_level,
            created_at
        ) VALUES (
            gen_random_uuid()::text,
            v_name,
            v_type,
            'registering',
            v_buyin,
            0,
            0,
            v_max,
            NOW() + (interval '1 minute' * v_i),
            1,
            NOW()
        );
    END LOOP;
END;
$$;

-- Run it immediately
SELECT ensure_active_tournaments();
