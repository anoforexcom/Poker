
-- Add unique constraint to prevent duplicate participants
-- First, ensure no duplicates exist (handled by script, but safety first)
DELETE FROM public.tournament_participants a USING public.tournament_participants b
WHERE a.id \u003e b.id
AND a.tournament_id = b.tournament_id
AND (a.bot_id = b.bot_id OR a.user_id = b.user_id);

-- Add the unique constraints
ALTER TABLE public.tournament_participants
DROP CONSTRAINT IF EXISTS unique_tournament_bot;
ALTER TABLE public.tournament_participants
ADD CONSTRAINT unique_tournament_bot UNIQUE (tournament_id, bot_id);

ALTER TABLE public.tournament_participants
DROP CONSTRAINT IF EXISTS unique_tournament_user;
ALTER TABLE public.tournament_participants
ADD CONSTRAINT unique_tournament_user UNIQUE (tournament_id, user_id);
