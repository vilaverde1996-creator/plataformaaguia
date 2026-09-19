-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA ASAS DE ÁGUIA — Cronograma em ciclos
--  Arquivo 8: pesos por disciplina, posição do aluno na fila e histórico
--
--  A fila não tem dia da semana. Ela anda quando o aluno conclui um
--  ciclo. Se ele ficar dois dias sem estudar, volta exatamente de onde
--  parou: nada fica atrasado.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  1. PESOS DO CICLO — definidos pela mentora, por edital
--     Peso 2 significa que a disciplina aparece duas vezes a cada
--     volta completa da fila. Peso 0 tira a disciplina do ciclo.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.ciclo_itens (
  id            uuid primary key default gen_random_uuid(),
  edital_id     uuid not null references public.editais(id) on delete cascade,
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  peso          int not null default 1 check (peso >= 0 and peso <= 10),
  ordem         int not null default 0,
  unique (edital_id, disciplina_id)
);
create index if not exists ix_ciclo_itens_edital on public.ciclo_itens(edital_id, ordem);

alter table public.ciclo_itens enable row level security;
grant select, insert, update, delete on public.ciclo_itens to authenticated;

drop policy if exists p_ciclo_itens_leitura on public.ciclo_itens;
create policy p_ciclo_itens_leitura on public.ciclo_itens for select to authenticated
  using (public.f_eh_mentora() or public.f_meu_edital(edital_id));

drop policy if exists p_ciclo_itens_mentora on public.ciclo_itens;
create policy p_ciclo_itens_mentora on public.ciclo_itens for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

-- ─────────────────────────────────────────────────────────────
--  2. POSIÇÃO DO ALUNO NA FILA
-- ─────────────────────────────────────────────────────────────
alter table public.mentorias
  add column if not exists ciclo_posicao int not null default 0;

-- O aluno precisa poder avançar a própria fila.
grant update (meta_horas, meta_questoes, meta_conclusao, meta_aprovamento, ciclo_posicao)
  on public.mentorias to authenticated;

-- ─────────────────────────────────────────────────────────────
--  3. HISTÓRICO DE CICLOS CONCLUÍDOS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.ciclo_execucoes (
  id            uuid primary key default gen_random_uuid(),
  mentoria_id   uuid not null references public.mentorias(id) on delete cascade,
  posicao       int not null,
  disciplina_id uuid references public.disciplinas(id) on delete set null,
  topico_id     uuid references public.topicos(id) on delete set null,
  pulado        boolean not null default false,
  concluido_em  timestamptz not null default now()
);
create index if not exists ix_ciclo_execucoes on public.ciclo_execucoes(mentoria_id, concluido_em desc);

alter table public.ciclo_execucoes enable row level security;
grant select, insert, delete on public.ciclo_execucoes to authenticated;

drop policy if exists p_ciclo_execucoes on public.ciclo_execucoes;
create policy p_ciclo_execucoes on public.ciclo_execucoes for all to authenticated
  using (public.f_minha_mentoria(mentoria_id) or public.f_eh_mentora())
  with check (public.f_minha_mentoria(mentoria_id) or public.f_eh_mentora());

-- ─────────────────────────────────────────────────────────────
--  4. PESO 1 PARA TUDO QUE JÁ EXISTE
--     Assim o ciclo já funciona nos editais cadastrados. Depois
--     você ajusta os pesos na tela Ciclos do seu painel.
-- ─────────────────────────────────────────────────────────────
insert into public.ciclo_itens (edital_id, disciplina_id, peso, ordem)
select d.edital_id, d.id, 1, d.ordem
from public.disciplinas d
where not exists (
  select 1 from public.ciclo_itens c
   where c.edital_id = d.edital_id and c.disciplina_id = d.id
);

select e.nome as edital, count(*) as disciplinas_no_ciclo, sum(c.peso) as ciclos_por_volta
from public.ciclo_itens c
join public.editais e on e.id = c.edital_id
group by e.nome;
