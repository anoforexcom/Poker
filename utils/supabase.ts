import { createClient } from '@supabase/supabase-js';

// No Vercel, estas variáveis precisam ser configuradas no Dashboard do projeto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRO CRÍTICO: Credenciais do Supabase não encontradas!');
    console.warn('Certifique-se de adicionar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Dashboard da Vercel.');
}

// Inicializamos com strings vazias se faltarem (o createClient não explode no import, mas falha nas chamadas)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
