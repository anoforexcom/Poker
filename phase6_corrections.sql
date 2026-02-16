
-- ===============================================================
-- PHASE 6: IMMEDIATE CORRECTIONS
-- ===============================================================

-- PASSO 1: Corrigir estrutura (Adicionar ended_at)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- PASSO 2: Corrigir função finish_tournament_safely
-- Mudança: Aceita TEXT em vez de UUID, e atualiza ended_at
CREATE OR REPLACE FUNCTION finish_tournament_safely(t_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result jsonb;
BEGIN
    UPDATE public.tournaments
    SET status = 'finished',
        ended_at = now()
    WHERE id = t_id
      AND status != 'finished'
    RETURNING to_jsonb(tournaments.*) INTO result;

    RETURN result;
END;
$$;

-- Extra: Garantir que status tem constraint (PASSO 6.1 do plano)
-- Por enquanto, vamos manter como está para não partir nada, 
-- mas a função finish_tournament_safely já está protegida.
