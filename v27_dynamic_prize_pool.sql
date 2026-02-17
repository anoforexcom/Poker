-- DYNAMIC PRIZE POOL & BOT HARDEING
-- Ensures prize pools are always up to date and bots act consistently

-- 1. Automatic Prize Pool Calculation
CREATE OR REPLACE FUNCTION update_tournament_prize_pool()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tournaments
    SET prize_pool = (players_count * buy_in)
    WHERE id = NEW.tournament_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_prize_pool ON public.tournament_participants;
CREATE TRIGGER tr_update_prize_pool
AFTER INSERT OR UPDATE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION update_tournament_prize_pool();

-- 2. Ensure players_count is accurate
CREATE OR REPLACE FUNCTION sync_tournament_players_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tournaments
    SET players_count = (SELECT count(*) FROM public.tournament_participants WHERE tournament_id = COALESCE(NEW.tournament_id, OLD.tournament_id))
    WHERE id = COALESCE(NEW.tournament_id, OLD.tournament_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_players_count ON public.tournament_participants;
CREATE TRIGGER tr_sync_players_count
AFTER INSERT OR DELETE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION sync_tournament_players_count();

-- 3. Initial Sync for existing data
UPDATE public.tournaments t
SET players_count = (SELECT count(*) FROM public.tournament_participants WHERE tournament_id = t.id),
    prize_pool = (SELECT count(*) FROM public.tournament_participants WHERE tournament_id = t.id) * buy_in;
