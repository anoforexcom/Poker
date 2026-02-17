-- BLOCO 1: LIMPAR E PREPARAR (Executa isto primeiro)
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS personality TEXT DEFAULT 'standard';
TRUNCATE public.tournament_participants CASCADE;
TRUNCATE public.game_states CASCADE;
TRUNCATE public.game_hand_history CASCADE;
DELETE FROM public.bots;

-- BLOCO 2: JOGADORES 1-25
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
(gen_random_uuid(), 'MuckItAll', 'passive'),
(gen_random_uuid(), 'GrinderGord', 'standard'),
(gen_random_uuid(), 'CheckRaiseC', 'aggressive'),
(gen_random_uuid(), 'RoyalFlush88', 'standard'),
(gen_random_uuid(), 'PocketRockets', 'aggressive'),
(gen_random_uuid(), 'FoldToWin', 'passive'),
(gen_random_uuid(), 'StacksOnStacks', 'aggressive'),
(gen_random_uuid(), 'BlindStealer', 'aggressive'),
(gen_random_uuid(), 'TheNit', 'passive'),
(gen_random_uuid(), 'VPIP_God', 'aggressive'),
(gen_random_uuid(), 'LimpingLarry', 'passive'),
(gen_random_uuid(), 'FishDetector', 'standard'),
(gen_random_uuid(), 'NutHunter', 'standard'),
(gen_random_uuid(), 'GTO_Bot', 'standard'),
(gen_random_uuid(), 'RazzleDazzle', 'aggressive'),
(gen_random_uuid(), 'SevenDeuce', 'aggressive');

-- BLOCO 3: JOGADORES 26-50
INSERT INTO public.bots (id, name, personality) VALUES
(gen_random_uuid(), 'ShowdownSean', 'standard'),
(gen_random_uuid(), 'BadBeatBen', 'standard'),
(gen_random_uuid(), 'QuadsAreReal', 'standard'),
(gen_random_uuid(), 'StraightShot', 'standard'),
(gen_random_uuid(), 'BubbleBoy', 'passive'),
(gen_random_uuid(), 'FinalTableF', 'standard'),
(gen_random_uuid(), 'MainEventMike', 'aggressive'),
(gen_random_uuid(), 'HighStakesHarry', 'aggressive'),
(gen_random_uuid(), 'NoLimitNick', 'aggressive'),
(gen_random_uuid(), 'PotLimitPete', 'standard'),
(gen_random_uuid(), 'SmallBlindS', 'passive'),
(gen_random_uuid(), 'BigBlindB', 'standard'),
(gen_random_uuid(), 'DealerDave', 'standard'),
(gen_random_uuid(), 'TheMechanic', 'standard'),
(gen_random_uuid(), 'CardCounter', 'standard'),
(gen_random_uuid(), 'WizardOfOdds', 'standard'),
(gen_random_uuid(), 'LuckyLou', 'standard'),
(gen_random_uuid(), 'BadMojo', 'aggressive'),
(gen_random_uuid(), 'FullHouseFred', 'standard'),
(gen_random_uuid(), 'TripsAhoy', 'standard'),
(gen_random_uuid(), 'PairOfKings', 'standard'),
(gen_random_uuid(), 'WildCard', 'aggressive'),
(gen_random_uuid(), 'SteadyEddy', 'standard'),
(gen_random_uuid(), 'RockSolid', 'passive'),
(gen_random_uuid(), 'CallingStation', 'passive');

-- BLOCO 4: JOGADORES 51-75
INSERT INTO public.bots (id, name, personality) VALUES
(gen_random_uuid(), 'AceMagnet', 'standard'),
(gen_random_uuid(), 'BustedDraw', 'aggressive'),
(gen_random_uuid(), 'NutFlush', 'standard'),
(gen_random_uuid(), 'KickerCheck', 'standard'),
(gen_random_uuid(), 'DonkeyPunch', 'aggressive'),
(gen_random_uuid(), 'SuckOutKid', 'aggressive'),
(gen_random_uuid(), 'TightAsADrum', 'passive'),
(gen_random_uuid(), 'LooseCannon', 'aggressive'),
(gen_random_uuid(), 'TheCleaner', 'standard'),
(gen_random_uuid(), 'TableCaptain', 'aggressive'),
(gen_random_uuid(), 'OneOuter', 'standard'),
(gen_random_uuid(), 'SoulReader', 'standard'),
(gen_random_uuid(), 'BrickCity', 'passive'),
(gen_random_uuid(), 'OverbetOwen', 'aggressive'),
(gen_random_uuid(), 'ShortStack', 'standard'),
(gen_random_uuid(), 'BigStackBully', 'aggressive'),
(gen_random_uuid(), 'SatellitePro', 'standard'),
(gen_random_uuid(), 'OrbitMaster', 'standard'),
(gen_random_uuid(), 'SmallPotSam', 'passive'),
(gen_random_uuid(), 'ValueVulture', 'standard'),
(gen_random_uuid(), 'TheHammer', 'aggressive'),
(gen_random_uuid(), 'SevenTwoBluff', 'aggressive'),
(gen_random_uuid(), 'TopSet', 'standard'),
(gen_random_uuid(), 'MiddlePair', 'passive'),
(gen_random_uuid(), 'BottomPair', 'passive');

-- BLOCO 5: JOGADORES 76-100 & FINALIZAR
INSERT INTO public.bots (id, name, personality) VALUES
(gen_random_uuid(), 'AceKing_4Bet', 'aggressive'),
(gen_random_uuid(), 'Broadway', 'standard'),
(gen_random_uuid(), 'WheelStraight', 'standard'),
(gen_random_uuid(), 'GutshotGuy', 'aggressive'),
(gen_random_uuid(), 'CoinFlip', 'aggressive'),
(gen_random_uuid(), 'DeadMansHand', 'standard'),
(gen_random_uuid(), 'TheProfessor', 'standard'),
(gen_random_uuid(), 'OldSchool', 'passive'),
(gen_random_uuid(), 'NextGen', 'aggressive'),
(gen_random_uuid(), 'MathWhiz', 'standard'),
(gen_random_uuid(), 'InstaCall', 'aggressive'),
(gen_random_uuid(), 'TankerTom', 'passive'),
(gen_random_uuid(), 'SpeechPlay', 'aggressive'),
(gen_random_uuid(), 'StoneCold', 'standard'),
(gen_random_uuid(), 'IceMan', 'standard'),
(gen_random_uuid(), 'TheGeneral', 'aggressive'),
(gen_random_uuid(), 'PokerFace', 'standard'),
(gen_random_uuid(), 'AllIn_NoLook', 'aggressive'),
(gen_random_uuid(), 'SlowRoll', 'aggressive'),
(gen_random_uuid(), 'EtiquettePro', 'standard'),
(gen_random_uuid(), 'GrumpAtTable', 'passive'),
(gen_random_uuid(), 'LuckyStar', 'standard'),
(gen_random_uuid(), 'Fortuna', 'standard'),
(gen_random_uuid(), 'Zodiac', 'standard');

UPDATE public.tournaments SET status = 'registering', players_count = 0, prize_pool = 0 WHERE status != 'finished';
SELECT public.ensure_active_tournaments();
