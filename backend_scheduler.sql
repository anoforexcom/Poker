
-- WorldState Controller: ensure_active_tournaments
-- This function monitors the tournament ecosystem and auto-replenishes it.

CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_registering_count INT;
    v_late_reg_count INT;
    v_running_count INT;
    v_needed INT;
    v_i INT;
    v_new_id UUID;
    v_titles TEXT[] := ARRAY['Hyper Turbo', 'Daily Big', 'Deepstack', 'Speed Racer', 'Bounty Hunter'];
    v_types TEXT[] := ARRAY['tournament', 'sitgo'];
    v_random_title TEXT;
    v_random_type TEXT;
    v_random_buyin NUMERIC;
BEGIN
    -- 1. Gather verify statistics
    SELECT count(*) INTO v_registering_count FROM tournaments WHERE status = 'registering' OR status = 'Registering';
    SELECT count(*) INTO v_late_reg_count FROM tournaments WHERE status = 'late_reg' OR status = 'Late Reg';
    SELECT count(*) INTO v_running_count FROM tournaments WHERE status = 'running' OR status = 'Running';

    -- Log current state
    RAISE NOTICE 'WorldState: Reg=%, Late=%, Run=%', v_registering_count, v_late_reg_count, v_running_count;

    -- 2. Rule: Maintain at least 4 Registering tournaments
    IF v_registering_count < 4 THEN
        v_needed := 4 - v_registering_count;
        
        FOR v_i IN 1..v_needed LOOP
            -- Generate Random Params
            v_random_title := v_titles[1 + floor(random() * array_length(v_titles, 1))];
            v_random_type := v_types[1 + floor(random() * array_length(v_types, 1))];
            
            -- Weighted buy-in logic (more micros than highs)
            IF random() < 0.6 THEN
                v_random_buyin := 10 + floor(random() * 20); -- 10-30
            ELSE
                v_random_buyin := 50 + floor(random() * 100); -- 50-150
            END IF;

            -- Insert the tournament
            INSERT INTO tournaments (
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
                v_random_title || ' #' || floor(random() * 1000),
                v_random_type,
                'registering',
                v_random_buyin,
                0, -- Prize pool starts at 0, grows with buy-ins (or guaranteed)
                0,
                CASE WHEN v_random_type = 'sitgo' THEN 6 ELSE 100 END,
                CASE 
                    WHEN v_random_type = 'sitgo' THEN NOW() + (interval '10 minutes') -- SitGos technically wait for players, but give a fallback start
                    ELSE NOW() + (interval '2 minutes' * v_i) -- Staggered scheduled starts
                END,
                1,
                NOW()
            ) RETURNING id INTO v_new_id;

            RAISE NOTICE 'Created Tournament: % (ID: %)', v_random_title, v_new_id;
        END LOOP;
    END IF;

    -- 3. Rule: Safety Net - Verify Running Tournaments
    -- (Optional: If we want to auto-push Registering to Running if time is passed, 
    -- but usually 'poker-simulator' tick does this. We will rely on tick for state transitions.)

END;
$$;
