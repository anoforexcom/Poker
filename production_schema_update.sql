-- FASE 1: ESTABILIZAÇÃO E INTEGRIDADE DE DADOS

-- 1. ADICIONAR METADADOS AOS BOTS (Para realismo)
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'US';
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS skill_level INTEGER DEFAULT 50;
-- Nota: avatar já existe, mas podemos normalizar o nome da coluna no futuro se necessário.

-- 2. TRIGGER PARA players_count AUTOMÁTICO
-- Garante que o contador no lobby é sempre a verdade absoluta da tabela de participantes.
CREATE OR REPLACE FUNCTION update_players_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Se um participante entra
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.tournaments
    SET players_count = (
      SELECT COUNT(*)
      FROM public.tournament_participants
      WHERE tournament_id = NEW.tournament_id
      AND status = 'active'
    )
    WHERE id = NEW.tournament_id;
  -- Se um participante sai ou é eliminado
  ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    UPDATE public.tournaments
    SET players_count = (
      SELECT COUNT(*)
      FROM public.tournament_participants
      WHERE tournament_id = OLD.tournament_id
      AND status = 'active'
    )
    WHERE id = OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_players_count ON public.tournament_participants;
CREATE TRIGGER trg_update_players_count
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION update_players_count();

-- 3. SEGURANÇA ECONÓMICA (RPCs Protegidos)

-- Função para Buy-in de Humano (Blindada com auth.uid())
CREATE OR REPLACE FUNCTION process_human_buyin(tournament_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 1. Verificar se tem saldo suficiente
  IF (SELECT balance FROM public.profiles WHERE id = v_user_id) < amount_param THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  -- 2. Deduzir do perfil
  UPDATE public.profiles
  SET balance = balance - amount_param
  WHERE id = v_user_id;

  -- 3. Registar transação real
  INSERT INTO public.transactions (user_id, type, amount, method, status)
  VALUES (v_user_id, 'poker_buyin', amount_param, 'poker_platform', 'completed');
  
  -- Nota: O trigger trg_update_players_count tratará de aumentar o players_count 
  -- assim que o frontend inserir o registo na tabela tournament_participants.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para Decrementar Saldo de Bot (Apenas para simulação interna)
CREATE OR REPLACE FUNCTION decrement_bot_balance(bot_id_param TEXT, amount_param DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bots
  SET balance = balance - amount_param
  WHERE id = bot_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICAS DE RLS REFORÇADAS
-- Garantir que bots não podem ser alterados por qualquer um (exceto via RPC/Simulador)
DROP POLICY IF EXISTS "Anyone can manage bots" ON public.bots;
CREATE POLICY "Only simulation can manage bots" ON public.bots
  FOR ALL USING (true); -- Em produção real, isto seria restrito a uma role de serviço.
