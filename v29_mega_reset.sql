-- ==========================================================
-- PHASE 29: MEGA-RESET & STABILIZATION (3000 BOTS + 1M BALANCE)
-- ==========================================================

-- 1. DESLIGAR TIMEOUTS E PREPARAR SESSÃO
SET statement_timeout = 0;

-- 2. DESATIVAR MOTOR E AGENDAMENTOS (Para evitar Deadlocks)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poker-heartbeat') THEN PERFORM cron.unschedule('poker-heartbeat'); END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poker-simulation-tick') THEN PERFORM cron.unschedule('poker-simulation-tick'); END IF;
END $$;

-- 3. LIMPAR CONFLITOS DE IDS E REFERÊNCIAS
UPDATE public.tournaments SET winner_bot_id = NULL, winner_id = NULL;
DELETE FROM public.tournament_participants;
DELETE FROM public.game_states;
DELETE FROM public.game_hand_history;
DELETE FROM public.system_locks;
DELETE FROM public.bots;

-- 4. GRANT DE RIQUEZA (1.000,000 de fichas para todos os perfis)
UPDATE public.profiles SET balance = 1000000;

-- 5. INJETAR 3000 BOTS COM NOMES REAIS (SEM "BOTXXX")
DO $$ 
DECLARE 
    prefs text[] := ARRAY['Texas', 'River', 'Ace', 'Lucky', 'Poker', 'Grinder', 'Vegas', 'Shark', 'Muck', 'Full', 'Pocket', 'Royal', 'Bluff', 'Tilt', 'Check', 'Raise', 'AllIn', 'Fish', 'Whale', 'Donk', 'Cool', 'Hard', 'Fast', 'Slow', 'Nuts', 'Quads', 'Trip', 'Pair', 'Suited', 'Connector'];
    suffs text[] := ARRAY['Dolly', 'Rat', 'King', 'Wizard', 'Hero', 'Pro', 'X', '99', 'Master', 'Legend', 'Ninja', 'Player', 'Boss', 'Winner', 'Star', 'Ace', 'Collector', 'Slayer', 'Ghost', 'Shadow', 'Demon', 'Saint', 'God', 'Titan', 'Wolf', 'Lion', 'Bear', 'Eagle', 'Snake', 'Dragon'];
    i int;
    p text;
    s text;
    nick text;
BEGIN
    FOR i IN 1..3000 LOOP
        p := prefs[floor(random() * array_length(prefs, 1)) + 1];
        s := suffs[floor(random() * array_length(suffs, 1)) + 1];
        nick := p || s || floor(random() * 999)::text;
        INSERT INTO public.bots (id, name, personality) 
        VALUES (gen_random_uuid(), nick, CASE WHEN random() > 0.5 THEN 'aggressive' ELSE 'standard' END)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 6. RESET DE TORNEIOS E REPARO DO FLUXO (INÍCIO EM 5 SEGUNDOS)
UPDATE public.tournaments 
SET status = 'registering', 
    players_count = 0, 
    prize_pool = 0 
WHERE status != 'finished';

CREATE OR REPLACE FUNCTION ensure_active_tournaments()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_i INT;
BEGIN
    FOR v_i IN 1..6 LOOP
        INSERT INTO public.tournaments (id, name, type, status, buy_in, prize_pool, players_count, max_players, scheduled_start_time, current_blind_level, created_at)
        VALUES (
            gen_random_uuid()::text,
            CASE v_i WHEN 1 THEN 'Hyper Turbo #1' WHEN 2 THEN 'Deepstack #2' WHEN 3 THEN 'Speedy #3' WHEN 4 THEN 'Micro #4' WHEN 5 THEN 'DoubleUp #5' ELSE 'Flash #6' END,
            CASE WHEN v_i <= 3 THEN 'tournament' ELSE 'sitgo' END,
            'registering', 100 * v_i, 0, 0, 6, -- SET max_players to 6 for all, players_count to 0 to sync with participant list
            NOW() + interval '5 seconds', -- INÍCIO EM 5 SEGUNDOS
            1, NOW()
        );
    END LOOP;
END;
$$;

SELECT ensure_active_tournaments();

-- 7. RE-ATIVAR TICK (OPCIONAL: Podes correr o teu script v28 de gatilhos depois disto se preferires)
-- O motor do Deno (Edge Function) voltará a atuar assim que o próximo tick do cron ou trigger bater.
