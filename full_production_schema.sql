-- ==========================================
-- POKER PLATFORM: UNIFIED PRODUCTION SCHEMA
-- ==========================================

-- 1. LIMPEZA (Opcional, use com cautela se já tiver dados)
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.tournament_participants CASCADE;
-- DROP TABLE IF EXISTS public.bots CASCADE;
-- DROP TABLE IF EXISTS public.tournaments CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABELAS BASE

-- Perfis de Utilizadores Reais
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

-- Torneios e Mesas de Cash
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'tournament', 'cash', 'sitgo', 'spingo'
  status TEXT DEFAULT 'registering', -- 'registering', 'late_reg', 'running', 'finished'
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
  skill_level INTEGER DEFAULT 50, -- Alias para compatibilidade
  country_code TEXT DEFAULT 'US',
  games_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0
);

-- Participantes (Quem está em que mesa)
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  bot_id TEXT REFERENCES public.bots(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active', -- 'active', 'eliminated'
  stack DECIMAL DEFAULT 0,
  CONSTRAINT one_player_type CHECK (
    (user_id IS NOT NULL AND bot_id IS NULL) OR 
    (user_id IS NULL AND bot_id IS NOT NULL)
  )
);

-- Histórico Financeiro
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'poker_buyin', 'poker_win'
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SEGURANÇA (RLS - Row Level Security)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas Tournaments (Públicos)
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON public.tournaments;
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage tournaments" ON public.tournaments;
CREATE POLICY "Anyone can manage tournaments" ON public.tournaments FOR ALL USING (true);

-- Políticas Bots
DROP POLICY IF EXISTS "Bots are viewable by everyone" ON public.bots;
CREATE POLICY "Bots are viewable by everyone" ON public.bots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage bots" ON public.bots;
CREATE POLICY "Anyone can manage bots" ON public.bots FOR ALL USING (true);

-- Políticas Participantes
DROP POLICY IF EXISTS "Participants viewable by everyone" ON public.tournament_participants;
CREATE POLICY "Participants viewable by everyone" ON public.tournament_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can join" ON public.tournament_participants;
CREATE POLICY "Anyone can join" ON public.tournament_participants FOR INSERT WITH CHECK (true);

-- Políticas Transações (Privadas)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 4. FUNÇÕES E TRIGGERS (INTEGRIDADE)

-- Trigger A: Criar perfil automaticamente no registo
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger B: Atualizar contador de jogadores automaticamente
CREATE OR REPLACE FUNCTION update_players_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.tournaments SET players_count = (SELECT COUNT(*) FROM public.tournament_participants WHERE tournament_id = NEW.tournament_id AND status = 'active') WHERE id = NEW.tournament_id;
  ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    UPDATE public.tournaments SET players_count = (SELECT COUNT(*) FROM public.tournament_participants WHERE tournament_id = OLD.tournament_id AND status = 'active') WHERE id = OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_players_count ON public.tournament_participants;
CREATE TRIGGER trg_update_players_count
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION update_players_count();

-- 5. RPCs (FUNÇÕES DE BACKEND SEGURAS)

-- Buy-in Seguro para Humanos
CREATE OR REPLACE FUNCTION process_human_buyin(tournament_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  IF (SELECT balance FROM public.profiles WHERE id = v_user_id) < amount_param THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  UPDATE public.profiles SET balance = balance - amount_param WHERE id = v_user_id;

  INSERT INTO public.transactions (user_id, type, amount, method, status)
  VALUES (v_user_id, 'poker_buyin', amount_param, 'poker_platform', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajuste de Saldo para Bots (Simulação)
CREATE OR REPLACE FUNCTION decrement_bot_balance(bot_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bots SET balance = balance - amount_param WHERE id = bot_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
