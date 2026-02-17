-- PASSO 1: LIMPEZA CIRÚRGICA (Não usa CASCADE para evitar Timeouts)
DELETE FROM public.tournament_participants;
DELETE FROM public.game_states;
DELETE FROM public.bots;

-- PASSO 2: RESET DE TOURNAMENTOS
UPDATE public.tournaments 
SET status = 'registering', 
    players_count = 0, 
    prize_pool = 0 
WHERE status != 'finished';

-- PASSO 3: INJETAR BOTS ESSENCIAIS (Apenas 10 para teste rápido)
INSERT INTO public.bots (id, name, personality) VALUES
(gen_random_uuid(), 'TexasDolly', 'aggressive'),
(gen_random_uuid(), 'RiverRat', 'standard'),
(gen_random_uuid(), 'AcesHigh', 'aggressive'),
(gen_random_uuid(), 'TurboTom', 'standard'),
(gen_random_uuid(), 'BluffMaster', 'aggressive'),
(gen_random_uuid(), 'PokerShark', 'standard'),
(gen_random_uuid(), 'TiltProof', 'standard'),
(gen_random_uuid(), 'SlowPlaySam', 'passive'),
(gen_random_uuid(), 'AllInAnnie', 'aggressive'),
(gen_random_uuid(), 'MuckItAll', 'passive');

-- PASSO 4: REPARAR ECOSSISTEMA
SELECT public.ensure_active_tournaments();
