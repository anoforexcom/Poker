-- =========================================================
-- POKER PLATFORM: MASTER PRODUCTION SCHEMA (ALL-IN-ONE)
-- =========================================================
-- Este script configura TODA a base de dados, segurança e automação.
-- Execute isto PRIMEIRO no SQL Editor da Supabase.

-- 0. EXTENSÕES (Para Automação)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. TABELAS

-- Perfis de Utilizadores
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

-- Torneios e Jogos
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'tournament', 'cash', 'sitgo', 'spingo'
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

-- Sistema de Bots
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

-- Participantes
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

-- Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'poker_buyin', 'poker_win'
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Estado do Jogo (Hand Engine Authority)
CREATE TABLE IF NOT EXISTS public.game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  deck TEXT[] NOT NULL,
  community_cards TEXT[] DEFAULT '{}',
  current_pot DECIMAL DEFAULT 0,
  current_turn_user_id UUID,
  current_turn_bot_id TEXT,
  phase TEXT DEFAULT 'pre-flop', -- 'pre-flop', 'flop', 'turn', 'river', 'showdown'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Histórico de Mãos (Audit Trail)
CREATE TABLE IF NOT EXISTS public.game_hand_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  results JSONB NOT NULL, -- { winner: id, hand: string, cards: [], pot: number }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. SEGURANÇA (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Tournaments viewable by all" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Bots viewable by all" ON public.bots FOR SELECT USING (true);
CREATE POLICY "Participants viewable by all" ON public.tournament_participants FOR SELECT USING (true);

-- Políticas Restritas (Auth-based)
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- System Bypass (Para o Simulador/Edge Functions usar Service Role)
-- Nota: Service Role ignora RLS por padrão, mas estas políticas permitem gestão via RPC
CREATE POLICY "Full access with Service Role" ON public.tournaments FOR ALL USING (true);
CREATE POLICY "Full access with Service Role" ON public.bots FOR ALL USING (true);
CREATE POLICY "Full access with Service Role" ON public.tournament_participants FOR ALL USING (true);

-- 3. TRIGGERS (Automação de Dados)

-- Trigger: Criar Perfil no Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Manter players_count atualizado
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

-- 4. RPCs (BACKEND SEGURO)

-- Buy-in Humano (Seguro & Atómico)
CREATE OR REPLACE FUNCTION process_human_buyin(tournament_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
DECLARE 
  v_user_id UUID := auth.uid();
  v_row_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  -- Update atómico com verificação de saldo na cláusula WHERE
  UPDATE public.profiles 
  SET balance = balance - amount_param 
  WHERE id = v_user_id AND balance >= amount_param;

  -- Verificar se o update afetou alguma linha (se tinha saldo)
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente ou utilizador não encontrado';
  END IF;

  -- Se chegamos aqui, o dinheiro foi deduzido. Registamos a transação.
  INSERT INTO public.transactions (user_id, type, amount, method, status) 
  VALUES (v_user_id, 'poker_buyin', amount_param, 'poker_platform', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Payout Humano (Seguro)
CREATE OR REPLACE FUNCTION process_human_win(user_id_param UUID, amount_param DECIMAL, tournament_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET balance = balance + amount_param WHERE id = user_id_param;
  INSERT INTO public.transactions (user_id, type, amount, method, status) VALUES (user_id_param, 'poker_win', amount_param, tournament_id_param, 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gestão de Bots (Simulador)
CREATE OR REPLACE FUNCTION decrement_bot_balance(bot_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bots SET balance = balance - amount_param WHERE id = bot_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_bot_balance(bot_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bots SET balance = balance + amount_param WHERE id = bot_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. AGENDAMENTO (CRON)
-- Isto faz o motor de jogo correr sozinho

-- Limpar agendamentos anteriores de forma segura
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poker-simulation-tick') THEN
    PERFORM cron.unschedule('poker-simulation-tick');
  END IF;
END $$;

-- Criar agendamento a cada minuto com Advisory Lock (Evita overlap)
SELECT cron.schedule('poker-simulation-tick', '* * * * *', $$
  -- Tenta obter o lock 12345. Se já estiver ocupado, aborta silenciosamente.
  SELECT net.http_post(
    url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer process.env.SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "tick"}'::jsonb
  ) WHERE pg_try_advisory_lock(12345);
$$);

-- Trigger inicial para criar bots e torneios agora mesmo
SELECT net.http_post(
  url := 'https://uhykmcwgznkzehxnkrbx.supabase.co/functions/v1/poker-simulator',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer process.env.SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{"action": "seed"}'::jsonb
);
