-- Phase 22: Advanced Engine Hardening
-- Add dealer_index to game_states
ALTER TABLE game_states ADD COLUMN IF NOT EXISTS dealer_index INT DEFAULT 0;

-- Add winner_id to tournaments to track completion
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES profiles(id);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS winner_bot_id TEXT REFERENCES bots(id);

-- Ensure we have a helper for incrementing stacks safely
CREATE OR REPLACE FUNCTION increment_participant_stack(participant_id UUID, amount INT)
RETURNS void AS $$
BEGIN
    UPDATE tournament_participants
    SET stack = stack + amount
    WHERE id = participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
