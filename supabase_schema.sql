-- 1. TABELA DE PERFIS (Dados dos usuários reais)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  balance BIGINT DEFAULT 10000,
  rank TEXT DEFAULT 'Bronze',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE TORNEIOS (Sincronização global)
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'tournament', 'cash', 'sitgo', 'spingo'
  status TEXT DEFAULT 'registering', -- 'registering', 'running', 'finished'
  buy_in DECIMAL NOT NULL,
  prize_pool DECIMAL DEFAULT 0,
  players_count INTEGER DEFAULT 0,
  max_players INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blind_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABELA DE BOTS (Para preencher as mesas)
CREATE TABLE IF NOT EXISTS public.bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  balance DECIMAL DEFAULT 5000,
  skill INTEGER DEFAULT 50,
  games_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0
);

-- 4. TABELA DE PARTICIPANTES (Quem está em qual torneio)
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  bot_id TEXT REFERENCES public.bots(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' -- 'active', 'eliminated'
);

-- 5. SEGURANÇA (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA TOURNAMENTS (Permissivo para o demo/simulação)
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON public.tournaments;
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert/update tournaments" ON public.tournaments;
CREATE POLICY "Anyone can insert/update tournaments" ON public.tournaments
  FOR ALL USING (true) WITH CHECK (true);

-- POLÍTICAS PARA BOTS (Permissivo para o demo/simulação)
DROP POLICY IF EXISTS "Bots are viewable by everyone" ON public.bots;
CREATE POLICY "Bots are viewable by everyone" ON public.bots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage bots" ON public.bots;
CREATE POLICY "Anyone can manage bots" ON public.bots
  FOR ALL USING (true) WITH CHECK (true);

-- POLÍTICAS PARA PARTICIPANTES
DROP POLICY IF EXISTS "Participants are viewable by everyone" ON public.tournament_participants;
CREATE POLICY "Participants are viewable by everyone" ON public.tournament_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can join tournaments" ON public.tournament_participants;
CREATE POLICY "Anyone can join tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (true);

-- 6. TRIGGER: CRIAR PERFIL AUTOMÁTICO AO REGISTRAR
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se o trigger já existir, removemos para evitar erro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ativa o trigger na tabela de usuários do Supabase Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. TABELA DE TRANSAÇÕES (Histórico financeiro)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal'
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
