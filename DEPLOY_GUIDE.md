# Guia de Implantação: Supabase Edge Functions

Para colocar o simulador de poker a correr 24/7 no backend, segue estes passos usando o **Supabase CLI**.

## 1. Instalação do Supabase CLI
Se ainda não tens, instala via NPM:
```bash
npm install -g supabase
```

## 2. Inicialização do Projeto
Dentro da pasta do teu projeto (`PokerProject`), corre:
```bash
supabase init
```

## 3. Autenticação
Faz login na tua conta Supabase:
```bash
supabase login
```

## 4. Ligar ao teu Projeto Real
Vais precisar do **Project ID** (está no URL do teu dashboard da Supabase: `https://supabase.com/dashboard/project/TEU_ID`).
```bash
supabase link --project-ref TEU_ID
```
*(Ele vai pedir a tua Database Password, a que definiste quando criaste o projeto).*

## 5. Variáveis de Ambiente
O simulador precisa de saber o URL e a Service Key. Configura-os no Supabase:
```bash
supabase secrets set SUPABASE_URL="TEU_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="TUA_SERVICE_ROLE_KEY"
```

## 6. Deployment
Finalmente, envia a função para a nuvem:
```bash
supabase functions deploy poker-simulator
```

---

## 💡 Como fazer o "Tick" (Simulação Automática)

A função está pronta para receber o comando `tick`. Podes usar o **GitHub Actions** ou o **Cron** interno da Supabase (`pg_cron`) para chamar o URL da função a cada minuto.

Exemplo de comando SQL para ativar o Cron interno (no SQL Editor):
```sql
SELECT cron.schedule('poker-tick', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://TEU_ID.supabase.co/functions/v1/poker-simulator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer TUA_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "tick"}'::jsonb
  );
$$);
```
*(Nota: Precisas de ter a extensão `pg_cron` e `pg_net` ativas no teu projeto Supabase).*
