-- 1. LIMPAR REFERÊNCIAS (IMPORTANTE: Resolve o erro de Winner Bot ID)
UPDATE public.tournaments SET winner_bot_id = NULL;

-- 2. LIMPAR O RESTO (Sem CASCADE para evitar timeouts pesados)
DELETE FROM public.tournament_participants;
DELETE FROM public.game_states;
DELETE FROM public.game_hand_history;
DELETE FROM public.bots;

-- 3. RESET DE TORNEIOS
UPDATE public.tournaments 
SET status = 'registering', 
    players_count = 0, 
    prize_pool = 0 
WHERE status != 'finished';

-- 4. INJETAR BOTS ESSENCIAIS (Apenas 10 para teste)
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

-- 5. RE-ATIVAR ENGINE
SELECT public.ensure_active_tournaments();
