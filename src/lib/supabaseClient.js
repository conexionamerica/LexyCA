import { createClient } from '@supabase/supabase-js';

// URL e anon key vêm SOMENTE das variáveis de ambiente (Vercel > Settings > Environment Variables).
// Antes havia um projeto "padrão" fixo no código: quando a variável faltava, o site usava em
// silêncio um projeto que não existe mais e ficava travado na tela de carregamento.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http') &&
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20
);

if (!isSupabaseConfigured) {
  console.error(
    '[Lexy] Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ' +
    'nas variáveis de ambiente da Vercel e faça um novo deploy.'
  );
}

// Com valores inválidos o cliente ainda é criado (para o app renderizar), mas as chamadas falham rápido.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'http://localhost:54321',
  isSupabaseConfigured ? supabaseAnonKey : 'supabase-nao-configurado'
);
