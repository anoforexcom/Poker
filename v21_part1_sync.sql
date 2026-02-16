
-- PART 1: AUTOMATIC PLAYERS_COUNT SYNC
-- Run this first. It creates the trigger to keep counts accurate.

CREATE OR REPLACE FUNCTION sync_tournament_players_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE tournaments 
        SET players_count = (SELECT count(*) FROM tournament_participants WHERE tournament_id = NEW.tournament_id)
        WHERE id = NEW.tournament_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE tournaments 
        SET players_count = (SELECT count(*) FROM tournament_participants WHERE tournament_id = OLD.tournament_id)
        WHERE id = OLD.tournament_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_players_count ON tournament_participants;
CREATE TRIGGER tr_sync_players_count
AFTER INSERT OR DELETE ON tournament_participants
FOR EACH ROW EXECUTE PROCEDURE sync_tournament_players_count();

-- IMPORTANT: Running this will immediately sync all existing counts
UPDATE tournaments t
SET players_count = (SELECT count(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id);
