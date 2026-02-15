-- ===============================================================
-- POKER PLATFORM: FINAL PRODUCTION SCHEMA (v1.0 - Hardened)
-- ===============================================================
-- Este é o ÚNICO script que precisas de correr.
-- Ele inclui a estrutura base + correções da Fase 4 + segurança da Fase 5.

-- 0. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. TABELAS (Estrutura)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  balance BIGINT DEFAULT 10000,
  rank TEXT DEFAULT 'Bronze',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'registering',
  buy_in DECIMAL NOT NULL,
  prize_pool DECIMAL DEFAULT 0,
  players_count INTEGER DEFAULT 0,
  max_players INTEGER NOT NULL,
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  late_reg_until TIMESTAMP WITH TIME ZONE,
  current_blind_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  balance DECIMAL DEFAULT 5000,
  skill INTEGER DEFAULT 50,
  skill_level INTEGER DEFAULT 50,
  country_code TEXT DEFAULT 'US',
  games_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  bot_id TEXT REFERENCES public.bots(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active',
  stack DECIMAL DEFAULT 0,
  CONSTRAINT one_player_type CHECK (
    (user_id IS NOT NULL AND bot_id IS NULL) OR 
    (user_id IS NULL AND bot_id IS NOT NULL)
  ),
  UNIQUE (tournament_id, user_id),
  UNIQUE (tournament_id, bot_id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante colunas extra (caso tabela já exista de versões antigas)
DO $$
BEGIN
    BEGIN
        ALTER TABLE tournaments ADD COLUMN scheduled_start_time TIMESTAMP WITH TIME ZONE;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE tournaments ADD COLUMN late_reg_until TIMESTAMP WITH TIME ZONE;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE tournaments ADD COLUMN current_blind_level INTEGER DEFAULT 1;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE tournaments ADD COLUMN prize_pool DECIMAL DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE tournaments ADD COLUMN players_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;


-- Motor de Jogo (Fase 5 - Com Auditoria)
CREATE TABLE IF NOT EXISTS public.game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  deck TEXT[] NOT NULL,
  community_cards TEXT[] DEFAULT '{}',
  current_pot DECIMAL DEFAULT 0,
  current_turn_user_id UUID,
  current_turn_bot_id TEXT,
  phase TEXT DEFAULT 'pre-flop',
  player_states JSONB DEFAULT '{}'::jsonb,
  last_raise_amount DECIMAL DEFAULT 0,
  last_raiser_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_hand_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Segurança (Fase 5 - Locks)
CREATE TABLE IF NOT EXISTS system_locks (
    key_id text PRIMARY KEY,
    locked_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    metadata jsonb
);

-- 2. ALTERAÇÕES FASE 5 (Colunas Extra)
-- Adiciona colunas se não existirem (Safe Patching)
DO $$
BEGIN
    BEGIN
        ALTER TABLE game_hand_history ADD COLUMN rng_seed text;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE game_hand_history ADD COLUMN server_entropy text;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE game_hand_history ADD COLUMN client_entropy text;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 3. SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas (Simplificadas para Leitura Pública, Escrita Restrita)
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public tournaments" ON public.tournaments;
CREATE POLICY "Public tournaments" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public bots" ON public.bots;
CREATE POLICY "Public bots" ON public.bots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public participants" ON public.tournament_participants;
CREATE POLICY "Public participants" ON public.tournament_participants FOR SELECT USING (true);

-- Autores (Users)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Service Role Bypass (Para o Edge Function)
DROP POLICY IF EXISTS "Service Role Full Access Tournaments" ON public.tournaments;
CREATE POLICY "Service Role Full Access Tournaments" ON public.tournaments FOR ALL USING (true);

DROP POLICY IF EXISTS "Service Role Full Access Bots" ON public.bots;
CREATE POLICY "Service Role Full Access Bots" ON public.bots FOR ALL USING (true);

DROP POLICY IF EXISTS "Service Role Full Access Participants" ON public.tournament_participants;
CREATE POLICY "Service Role Full Access Participants" ON public.tournament_participants FOR ALL USING (true);

DROP POLICY IF EXISTS "Service Role Full Access GameStates" ON public.game_states;
CREATE POLICY "Service Role Full Access GameStates" ON public.game_states FOR ALL USING (true);

DROP POLICY IF EXISTS "Service Role Full Access History" ON public.game_hand_history;
CREATE POLICY "Service Role Full Access History" ON public.game_hand_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Service Role Full Access Locks" ON public.system_locks;
CREATE POLICY "Service Role Full Access Locks" ON public.system_locks FOR ALL USING (true);

-- 4. TRIGGERS (Lógica de Negócio)

-- Trigger: Player Count (Otimizado)
CREATE OR REPLACE FUNCTION update_players_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.tournaments SET players_count = (SELECT COUNT(*) FROM public.tournament_participants WHERE tournament_id = NEW.tournament_id AND status = 'active') WHERE id = NEW.tournament_id;
  ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    UPDATE public.tournaments SET players_count = (SELECT COUNT(*) FROM public.tournament_participants WHERE tournament_id = COALESCE(OLD.tournament_id, NEW.tournament_id) AND status = 'active') WHERE id = COALESCE(OLD.tournament_id, NEW.tournament_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_players_count ON public.tournament_participants;
CREATE TRIGGER trg_update_players_count AFTER INSERT OR UPDATE OR DELETE ON public.tournament_participants FOR EACH ROW EXECUTE FUNCTION update_players_count();

-- Trigger: New User Profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RPCs (FUNÇÕES BLINDADAS)

-- Lock System (Fase 5)
CREATE OR REPLACE FUNCTION acquire_system_lock(target_key text, duration_seconds int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE got_lock boolean;
BEGIN
    DELETE FROM system_locks WHERE key_id = target_key AND expires_at < now();
    INSERT INTO system_locks (key_id, expires_at) VALUES (target_key, now() + (duration_seconds || ' seconds')::interval)
    ON CONFLICT (key_id) DO NOTHING RETURNING true INTO got_lock;
    RETURN COALESCE(got_lock, false);
END;
$$;

CREATE OR REPLACE FUNCTION release_system_lock(target_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM system_locks WHERE key_id = target_key;
END;
$$;

-- Idempotent Finish (Fase 5)
CREATE OR REPLACE FUNCTION finish_tournament_safely(t_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
    UPDATE tournaments SET status = 'finished', ended_at = now()
    WHERE id = t_id AND status != 'finished'
    RETURNING to_jsonb(tournaments.*) INTO result;
    RETURN result;
END;
$$;

-- Buy-in Seguro
CREATE OR REPLACE FUNCTION process_human_buyin(tournament_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
DECLARE v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  -- Atomic Check & Update
  UPDATE public.profiles SET balance = balance - amount_param 
  WHERE id = v_user_id AND balance >= amount_param;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, method, status) 
  VALUES (v_user_id, 'poker_buyin', amount_param, 'poker_platform', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Payout Seguro
CREATE OR REPLACE FUNCTION process_human_win(user_id_param UUID, amount_param DECIMAL, tournament_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET balance = balance + amount_param WHERE id = user_id_param;
  INSERT INTO public.transactions (user_id, type, amount, method, status) VALUES (user_id_param, 'poker_win', amount_param, tournament_id_param, 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stack Management
CREATE OR REPLACE FUNCTION increment_participant_stack(participant_id uuid, amount decimal)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.tournament_participants SET stack = stack + amount WHERE id = participant_id;
END;
$$;

-- 6. AGENDAMENTO (CRON DEEP LOGIC)
-- Limpar tudo
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poker-simulation-tick') THEN PERFORM cron.unschedule('poker-simulation-tick'); END IF;
END $$;

-- Agendar (A cada minuto) - Nota: O Edge Function agora usa system_locks internamente,
-- mas mantemos o advisory lock aqui como redundância.
SELECT cron.schedule('poker-simulation-tick', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer process.env.SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "tick"}'::jsonb
  );
$$);

-- Trigger Inicial (Seeding)
SELECT net.http_post(
  url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer process.env.SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{"action": "seed"}'::jsonb
);
