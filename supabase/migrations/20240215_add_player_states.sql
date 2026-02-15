ALTER TABLE public.game_states 
ADD COLUMN IF NOT EXISTS player_states JSONB DEFAULT '{}'::jsonb;
-- Structure: { "user_id_or_bot_id": { "is_folded": boolean, "current_bet": number, "has_acted": boolean, "hole_cards": [] } }

ALTER TABLE public.game_states 
ADD COLUMN IF NOT EXISTS last_raiser_id TEXT;

ALTER TABLE public.game_states 
ADD COLUMN IF NOT EXISTS last_raise_amount DECIMAL DEFAULT 0;
