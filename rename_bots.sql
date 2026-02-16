-- Rename existing bots with realistic names
UPDATE bots SET name = 'PokerKing99' WHERE name = 'bot1';
UPDATE bots SET name = 'AllInJoe' WHERE name = 'bot2';
UPDATE bots SET name = 'RiverRat' WHERE name = 'bot3';
UPDATE bots SET name = 'BluffMaster' WHERE name = 'bot4';
UPDATE bots SET name = 'PocketRockets' WHERE name = 'bot5';
UPDATE bots SET name = 'CardShark' WHERE name = 'bot6';
UPDATE bots SET name = 'LuckyLuke' WHERE name = 'bot7';
UPDATE bots SET name = 'ThePro' WHERE name = 'bot8';
UPDATE bots SET name = 'FullHouse' WHERE name = 'bot9';
UPDATE bots SET name = 'RoyalFlush' WHERE name = 'bot10';
-- Generic update for the rest to avoid manual mapping 100+ items
UPDATE bots 
SET name = (
  CASE (ROW_NUMBER() OVER (ORDER BY id) % 20)
    WHEN 0 THEN 'TexasDolly' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 1 THEN 'VegasPro' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 2 THEN 'ChipLeadr' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 3 THEN 'SlowPlay' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 4 THEN 'BigBlind' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 5 THEN 'CheckMate' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 6 THEN 'FoldEm' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 7 THEN 'RaiseIt' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 8 THEN 'ShortStack' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 9 THEN 'HighRoller' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 10 THEN 'FishHook' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 11 THEN 'SharkFin' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 12 THEN 'AceHigh' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 13 THEN 'DeuceSeven' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 14 THEN 'NutFlush' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 15 THEN 'BadBeat' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 16 THEN 'TiltMaster' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 17 THEN 'Grinder' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 18 THEN 'Rounder' || (ROW_NUMBER() OVER (ORDER BY id))
    WHEN 19 THEN 'Maverick' || (ROW_NUMBER() OVER (ORDER BY id))
  END
)
WHERE name LIKE 'bot%';
