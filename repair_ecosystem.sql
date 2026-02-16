-- EMERGENCY ECOSYSTEM REPAIR
-- This script ensures tournaments are created with the correct types for the frontend

DELETE FROM public.tournaments WHERE status = 'registering'; -- Clear potentially broken ones

CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_i INT;
BEGIN
    FOR v_i IN 1..4 LOOP
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
            CASE v_i 
                WHEN 1 THEN 'Hyper Turbo #101'
                WHEN 2 THEN 'Deepstack Daily #42'
                WHEN 3 THEN 'Speedy Sunday #7'
                ELSE 'Micro Millions #99'
            END,
            CASE WHEN v_i <= 2 THEN 'tournament' ELSE 'sitgo' END,
            'registering',
            10 * v_i,
            0,
            0,
            CASE WHEN v_i > 2 THEN 6 ELSE 100 END,
            NOW() + (interval '2 minutes' * v_i),
            1,
            NOW()
        );
    END LOOP;
END;
$$;

SELECT ensure_active_tournaments();
