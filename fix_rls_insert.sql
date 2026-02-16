
-- FIX: ALLOW USERS TO JOIN TOURNAMENTS
-- The frontend tries to insert into 'tournament_participants' after paying.
-- Previous RLS policies only allowed SELECT.

-- 1. Enable INSERT for authenticated users
DROP POLICY IF EXISTS "Users can join tournaments" ON public.tournament_participants;
CREATE POLICY "Users can join tournaments" 
ON public.tournament_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Verify Select Policy
DROP POLICY IF EXISTS "Public participants" ON public.tournament_participants;
CREATE POLICY "Public participants" ON public.tournament_participants FOR SELECT USING (true);
