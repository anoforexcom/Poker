
-- Update bots with realistic names
UPDATE public.bots SET name = 'Sharky99' WHERE id LIKE '%1%';
UPDATE public.bots SET name = 'WhaleHunter' WHERE id LIKE '%2%';
UPDATE public.bots SET name = 'AceInTheHole' WHERE id LIKE '%3%';
UPDATE public.bots SET name = 'VegasVibe' WHERE id LIKE '%4%';
UPDATE public.bots SET name = 'BluffMaster99' WHERE id LIKE '%5%';
UPDATE public.bots SET name = 'RiverRat' WHERE id LIKE '%6%';
UPDATE public.bots SET name = 'GrinderPT' WHERE id LIKE '%7%';
UPDATE public.bots SET name = 'GTO_Wizard' WHERE id LIKE '%8%';
UPDATE public.bots SET name = 'FishAndChips' WHERE id LIKE '%9%';
UPDATE public.bots SET name = 'NutsCracker' WHERE id LIKE '%0%';

-- If there are more bots or we want to be more specific, we can use a randomized list
DO $$
DECLARE
    bot_names TEXT[] := ARRAY['Sharky99', 'WhaleHunter', 'AceInTheHole', 'VegasVibe', 'BluffMaster99', 'RiverRat', 'GrinderPT', 'GTO_Wizard', 'FishAndChips', 'NutsCracker', 'PocketAce', 'TheDonk', 'PokerFace_BR', 'FullHouse92', 'StackKing', 'RoyalFlush', 'BadBeatBob', 'TiltProof', 'AcesUp', 'SetMiner', 'TripsToWin', 'OneMoreHand', 'CashCow', 'BigStackBully', 'AggroNuts', 'CheckRaise_Me', 'FlatCallHero', 'LimitLess_X', 'HyperTurbo', 'BubbleBoy', 'FinalTableBound', 'MuckIt', 'FoldEquity', 'BigBlindSpecial', 'DealerButton', 'UnderTheGun', 'HighRoller99', 'SmallStakesPro', 'SatelliteKing', 'MainEventDream', 'LasVegasLegend', 'MonteCarloMan', 'PolderPirate', 'NordicPro', 'BrazilianStorm', 'TokyoDrift_Ace', 'LondonCalling', 'ParisianPoker', 'BerlinGrind'];
    bot_record RECORD;
    i INTEGER := 1;
BEGIN
    FOR bot_record IN SELECT id FROM public.bots LOOP
        UPDATE public.bots SET name = bot_names[(i % array_length(bot_names, 1)) + 1] WHERE id = bot_record.id;
        i := i + 1;
    END LOOP;
END $$;
