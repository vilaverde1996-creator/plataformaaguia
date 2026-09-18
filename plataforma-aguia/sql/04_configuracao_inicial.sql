-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA MÉTODO ÁGUIA — Configuração inicial
--  Rodar DEPOIS de criar os usuários em Authentication → Users
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  PASSO 1 — Ver quem já tem cadastro
--  Rode só esta linha primeiro, para conferir os e-mails.
-- ─────────────────────────────────────────────────────────────
select id, nome, email, papel, ativo from public.perfis order by criado_em;

-- ─────────────────────────────────────────────────────────────
--  PASSO 2 — Você vira mentora
--  Troque pelo SEU e-mail.
-- ─────────────────────────────────────────────────────────────
update public.perfis
   set papel = 'mentora',
       nome  = 'Mentora'              -- coloque seu nome aqui
 where email = 'seuemail@exemplo.com';

-- ─────────────────────────────────────────────────────────────
--  PASSO 3 — Matricular um aluno no edital
--  Troque o e-mail do aluno e a data da prova.
-- ─────────────────────────────────────────────────────────────
insert into public.mentorias (
  aluno_id, mentora_id, edital_id, plano_id,
  data_prova, cargo, meta_horas, meta_questoes, meta_conclusao, meta_aprovamento
)
select
  aluno.id,
  mentora.id,
  e.id,
  p.id,
  date '2026-11-29',                 -- data da prova
  e.cargo,
  20,                                -- meta de horas por semana
  300,                               -- meta de questões por semana
  100,                               -- meta de conclusão do edital (%)
  70                                 -- meta de aproveitamento (%)
from public.perfis aluno
cross join public.perfis mentora
cross join public.editais e
left join public.planos p on p.edital_id = e.id
where aluno.email   = 'aluno@exemplo.com'        -- e-mail do aluno
  and mentora.email = 'seuemail@exemplo.com'     -- seu e-mail
  and e.nome = 'Petrobras Transporte S.A - Transpetro'
on conflict (aluno_id, edital_id) do nothing;

-- ─────────────────────────────────────────────────────────────
--  PASSO 4 — Conferir
--  Deve aparecer uma linha por aluno matriculado.
-- ─────────────────────────────────────────────────────────────
select aluno, edital, data_prova, dias_para_prova, topicos_total
from public.vw_resumo_mentoria;
