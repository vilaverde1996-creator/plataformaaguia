import { createClient } from '@supabase/supabase-js';
 
// ── Conexão com o banco ────────────────────────────────────────────
// Estes dois valores ficam aqui mesmo, no código.
//
// A chave "anon public" é pública por natureza: ela só funciona
// dentro das regras de acesso que criamos no banco. Não há risco.
// A chave "service_role" NUNCA pode ser colocada aqui.
//
// Onde achar os dois valores: Supabase → Project Settings → API
// ───────────────────────────────────────────────────────────────────
 
const URL_SUPABASE = 'https://bygylyxsfxqxndpikofd.supabase.co';
const CHAVE_ANON = 'sb_publishable_WAXSbXijyIQotr8KdSqqVg_GQaAnXPt';
 
const url = import.meta.env.VITE_SUPABASE_URL || URL_SUPABASE;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || CHAVE_ANON;
 
if (!url || chave.startsWith('COLE_AQUI')) {
  document.body.innerHTML =
    '<div style="font:16px/1.6 system-ui;max-width:520px;margin:15vh auto;padding:24px;' +
    'border-radius:14px;background:#fff;color:#0D134C">' +
    '<h1 style="font-size:1.2rem;margin:0 0 8px">Falta a chave do banco</h1>' +
    '<p style="margin:0;color:#4a5080">Abra o arquivo <b>src/lib/supabase.js</b> no GitHub e ' +
    'cole a chave <b>anon public</b> do Supabase na linha indicada.</p></div>';
  throw new Error('Chave anon public não configurada em src/lib/supabase.js');
}
 
export const supabase = createClient(url, chave);
