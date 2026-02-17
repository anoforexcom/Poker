-- PASSO 1: MATAR PROCESSOS PENDENTES (Libera as tabelas presas)
-- Corre isto primeiro, sozinho.
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database() 
  AND pid <> pg_backend_pid()
  AND state = 'active'
  AND now() - query_start > interval '30 seconds';

-- PASSO 2: DESATIVAR GATILHOS PESADOS (Previne o timeout no delete)
ALTER TABLE public.tournament_participants DISABLE TRIGGER trg_update_players_count;
ALTER TABLE public.game_states DISABLE TRIGGER tr_reactive_engine;

-- PASSO 3: LIMPEZA RÁPIDA
TRUNCATE public.game_hand_history CASCADE;
DELETE FROM public.tournament_participants;
DELETE FROM public.game_states;
DELETE FROM public.bots;

-- PASSO 4: REATIVAR GATILHOS E RESET
ALTER TABLE public.tournament_participants ENABLE TRIGGER trg_update_players_count;
ALTER TABLE public.game_states ENABLE TRIGGER tr_reactive_engine;

UPDATE public.tournaments SET status = 'registering', players_count = 0, prize_pool = 0 WHERE status != 'finished';

-- PASSO 5: INJETAR BOTS (Apenas 3 para ser instantâneo)
INSERT INTO public.bots (id, name, personality) VALUES
(gen_random_uuid(), 'TexasDolly', 'aggressive'),
(gen_random_uuid(), 'RiverRat', 'standard'),
(gen_random_uuid(), 'AcesHigh', 'aggressive');

SELECT public.ensure_active_tournaments();
