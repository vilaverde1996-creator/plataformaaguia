-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA MÉTODO ÁGUIA — Estrutura do banco
--  Arquivo 1 de 3: tipos, tabelas, gatilhos, funções e visões
--  Rodar no Supabase: SQL Editor → colar → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  TIPOS
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type papel_usuario as enum ('mentora', 'aluno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_estudo as enum
    ('teoria','questoes','simulado','lei_seca','jurisprudencia','discursiva','revisao','aula','outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type origem_registro as enum ('cronometro','manual','questoes','importacao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_questao as enum ('multipla_escolha','certo_errado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_dificuldade as enum ('facil','media','dificil');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_material as enum ('pdf','link','video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type secao_plano as enum ('titulo','destaque','texto','fase','dia');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
--  PESSOAS
--  Uma linha por usuário do sistema. O login em si fica em
--  auth.users (gerenciado pelo Supabase); aqui ficam os dados.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text,
  telefone    text,
  papel       papel_usuario not null default 'aluno',
  ativo       boolean not null default true,
  observacoes text,
  criado_em   timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se cadastra.
create or replace function public.f_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(coalesce(new.email,''), '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists tg_perfil_novo_usuario on auth.users;
create trigger tg_perfil_novo_usuario
  after insert on auth.users
  for each row execute function public.f_perfil_novo_usuario();

-- ─────────────────────────────────────────────────────────────
--  EDITAL — a espinha dorsal da plataforma
--  Edital → disciplinas → grupos → tópicos.
--  Questões e materiais se ligam ao tópico. É isso que faz os
--  três módulos conversarem entre si.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.editais (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  orgao      text,
  banca      text,
  cargo      text,
  ano        int,
  mentora_id uuid references public.perfis(id) on delete set null,
  criado_em  timestamptz not null default now()
);

create table if not exists public.disciplinas (
  id        uuid primary key default gen_random_uuid(),
  edital_id uuid not null references public.editais(id) on delete cascade,
  nome      text not null,
  cor       text,
  ordem     int not null default 0
);
create index if not exists ix_disciplinas_edital on public.disciplinas(edital_id, ordem);

create table if not exists public.grupos (
  id            uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  nome          text not null,
  ordem         int not null default 0
);
create index if not exists ix_grupos_disciplina on public.grupos(disciplina_id, ordem);

create table if not exists public.topicos (
  id           uuid primary key default gen_random_uuid(),
  grupo_id     uuid not null references public.grupos(id) on delete cascade,
  nome         text not null,
  ordem        int not null default 0,
  -- guarda o identificador antigo do HTML (ex: "matematica_algebra-e-funcoes_1"),
  -- usado para importar o progresso que os alunos já têm hoje
  chave_legado text
);
create index if not exists ix_topicos_grupo on public.topicos(grupo_id, ordem);
create index if not exists ix_topicos_legado on public.topicos(chave_legado);

-- ─────────────────────────────────────────────────────────────
--  PLANO DE ESTUDOS (a aba "Plano de Voo")
--  Texto livre editável por você, em seções ordenadas.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.planos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  edital_id  uuid references public.editais(id) on delete set null,
  mentora_id uuid references public.perfis(id) on delete set null,
  criado_em  timestamptz not null default now()
);

create table if not exists public.plano_secoes (
  id        uuid primary key default gen_random_uuid(),
  plano_id  uuid not null references public.planos(id) on delete cascade,
  secao     secao_plano not null default 'texto',
  titulo    text,
  subtitulo text,
  texto     text,
  icone     text,
  estilo    text,
  ordem     int not null default 0
);
create index if not exists ix_plano_secoes on public.plano_secoes(plano_id, ordem);

-- ─────────────────────────────────────────────────────────────
--  MENTORIA — o vínculo aluno × edital
--  Todo o progresso do aluno aponta para esta linha, e não para
--  o aluno direto. Assim o mesmo aluno pode estudar para outro
--  concurso depois, sem misturar os dados.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.mentorias (
  id                uuid primary key default gen_random_uuid(),
  aluno_id          uuid not null references public.perfis(id) on delete cascade,
  mentora_id        uuid not null references public.perfis(id) on delete cascade,
  edital_id         uuid not null references public.editais(id) on delete restrict,
  plano_id          uuid references public.planos(id) on delete set null,
  data_prova        date,
  cargo             text,
  recado            text,          -- aparece como aviso na tela do aluno
  meta_horas        numeric(5,1),  -- horas por semana
  meta_questoes     int,           -- questões por semana
  meta_conclusao    int,           -- % do edital
  meta_aprovamento  int,           -- % de acerto desejado
  ativa             boolean not null default true,
  iniciada_em       date not null default current_date,
  criado_em         timestamptz not null default now(),
  unique (aluno_id, edital_id)
);
create index if not exists ix_mentorias_aluno on public.mentorias(aluno_id);
create index if not exists ix_mentorias_mentora on public.mentorias(mentora_id, ativa);

-- ─────────────────────────────────────────────────────────────
--  MÓDULO 1 — MENTORIA (cronômetro, histórico, edital, revisões)
-- ─────────────────────────────────────────────────────────────

-- Cada sessão de estudo. Substitui o "historico" do HTML.
create table if not exists public.registros (
  id            uuid primary key default gen_random_uuid(),
  mentoria_id   uuid not null references public.mentorias(id) on delete cascade,
  data          date not null,
  disciplina_id uuid references public.disciplinas(id) on delete set null,
  topico_id     uuid references public.topicos(id) on delete set null,
  tipo          tipo_estudo,
  segundos      int not null default 0 check (segundos >= 0),
  questoes      int not null default 0 check (questoes >= 0),
  acertos       int not null default 0 check (acertos >= 0),
  erros         int not null default 0 check (erros >= 0),
  obs           text,
  origem        origem_registro not null default 'manual',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists ix_registros_mentoria_data on public.registros(mentoria_id, data desc);
create index if not exists ix_registros_topico on public.registros(topico_id);

-- Situação de cada tópico do edital para cada aluno.
-- Substitui o "state" do HTML.
create table if not exists public.topico_progresso (
  mentoria_id   uuid not null references public.mentorias(id) on delete cascade,
  topico_id     uuid not null references public.topicos(id) on delete cascade,
  concluido     boolean not null default false,
  concluido_em  timestamptz,
  acertos       int not null default 0 check (acertos >= 0),
  erros         int not null default 0 check (erros >= 0),
  questoes      int not null default 0 check (questoes >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (mentoria_id, topico_id)
);

-- Revisões agendadas (7, 15, 21, 30 dias...).
create table if not exists public.revisoes (
  id           uuid primary key default gen_random_uuid(),
  mentoria_id  uuid not null references public.mentorias(id) on delete cascade,
  topico_id    uuid references public.topicos(id) on delete cascade,
  data_estudo  date,
  data_revisao date not null,
  dias         int,
  feita        boolean not null default false,
  feita_em     timestamptz,
  criado_em    timestamptz not null default now()
);
create index if not exists ix_revisoes_agenda on public.revisoes(mentoria_id, feita, data_revisao);

-- ─────────────────────────────────────────────────────────────
--  MÓDULO 2 — QUESTÕES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.questoes (
  id            uuid primary key default gen_random_uuid(),
  edital_id     uuid references public.editais(id) on delete set null,
  disciplina_id uuid references public.disciplinas(id) on delete set null,
  topico_id     uuid references public.topicos(id) on delete set null,
  tipo          tipo_questao not null default 'multipla_escolha',
  enunciado     text not null,
  comentario    text,                    -- seu comentário; o aluno só vê depois de responder
  banca         text,
  orgao         text,
  ano           int,
  cargo         text,
  dificuldade   nivel_dificuldade,
  fonte         text,
  imagem_url    text,
  ativa         boolean not null default true,
  criada_por    uuid references public.perfis(id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists ix_questoes_topico on public.questoes(topico_id) where ativa;
create index if not exists ix_questoes_disciplina on public.questoes(disciplina_id) where ativa;
create index if not exists ix_questoes_banca_ano on public.questoes(banca, ano);

create table if not exists public.alternativas (
  id         uuid primary key default gen_random_uuid(),
  questao_id uuid not null references public.questoes(id) on delete cascade,
  letra      text,
  texto      text not null,
  correta    boolean not null default false,
  ordem      int not null default 0
);
create index if not exists ix_alternativas_questao on public.alternativas(questao_id, ordem);
-- no máximo uma alternativa correta por questão
create unique index if not exists ux_alternativa_correta
  on public.alternativas(questao_id) where correta;

-- Uma rodada de treino ou simulado.
create table if not exists public.sessoes_questoes (
  id            uuid primary key default gen_random_uuid(),
  mentoria_id   uuid not null references public.mentorias(id) on delete cascade,
  tipo          text not null default 'treino',   -- treino | simulado
  filtros       jsonb,
  total         int not null default 0,
  acertos       int not null default 0,
  iniciada_em   timestamptz not null default now(),
  finalizada_em timestamptz
);
create index if not exists ix_sessoes_mentoria on public.sessoes_questoes(mentoria_id, iniciada_em desc);

-- Cada resposta dada. O gatilho abaixo leva o resultado para o
-- progresso do tópico, ligando os módulos 2 e 1.
create table if not exists public.respostas (
  id             uuid primary key default gen_random_uuid(),
  mentoria_id    uuid not null references public.mentorias(id) on delete cascade,
  questao_id     uuid not null references public.questoes(id) on delete cascade,
  alternativa_id uuid references public.alternativas(id) on delete set null,
  correta        boolean not null,
  segundos       int,
  sessao_id      uuid references public.sessoes_questoes(id) on delete set null,
  respondida_em  timestamptz not null default now()
);
create index if not exists ix_respostas_mentoria on public.respostas(mentoria_id, respondida_em desc);
create index if not exists ix_respostas_questao on public.respostas(questao_id);

-- Caderno de questões marcadas pelo aluno.
create table if not exists public.questoes_marcadas (
  mentoria_id uuid not null references public.mentorias(id) on delete cascade,
  questao_id  uuid not null references public.questoes(id) on delete cascade,
  nota        text,
  criado_em   timestamptz not null default now(),
  primary key (mentoria_id, questao_id)
);

-- ─────────────────────────────────────────────────────────────
--  MÓDULO 3 — CONTEÚDOS (PDF)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.materiais (
  id            uuid primary key default gen_random_uuid(),
  edital_id     uuid references public.editais(id) on delete cascade,
  disciplina_id uuid references public.disciplinas(id) on delete set null,
  topico_id     uuid references public.topicos(id) on delete set null,
  titulo        text not null,
  descricao     text,
  tipo          tipo_material not null default 'pdf',
  caminho       text,          -- caminho do arquivo no Storage (bucket "materiais")
  url           text,          -- para tipo = link/video
  paginas       int,
  tamanho_bytes bigint,
  publicado     boolean not null default false,
  ordem         int not null default 0,
  criado_por    uuid references public.perfis(id) on delete set null,
  criado_em     timestamptz not null default now()
);
create index if not exists ix_materiais_edital on public.materiais(edital_id, ordem);
create index if not exists ix_materiais_topico on public.materiais(topico_id);

create table if not exists public.material_acessos (
  id          uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentorias(id) on delete cascade,
  material_id uuid not null references public.materiais(id) on delete cascade,
  aberto_em   timestamptz not null default now()
);
create index if not exists ix_material_acessos on public.material_acessos(mentoria_id, aberto_em desc);

create table if not exists public.material_progresso (
  mentoria_id  uuid not null references public.mentorias(id) on delete cascade,
  material_id  uuid not null references public.materiais(id) on delete cascade,
  concluido    boolean not null default false,
  concluido_em timestamptz,
  primary key (mentoria_id, material_id)
);

-- ─────────────────────────────────────────────────────────────
--  GATILHOS
-- ─────────────────────────────────────────────────────────────

-- Mantém "atualizado_em" sempre correto.
create or replace function public.f_toca_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists tg_registros_atualizado on public.registros;
create trigger tg_registros_atualizado before update on public.registros
  for each row execute function public.f_toca_atualizado_em();

drop trigger if exists tg_questoes_atualizado on public.questoes;
create trigger tg_questoes_atualizado before update on public.questoes
  for each row execute function public.f_toca_atualizado_em();

drop trigger if exists tg_topico_progresso_atualizado on public.topico_progresso;
create trigger tg_topico_progresso_atualizado before update on public.topico_progresso
  for each row execute function public.f_toca_atualizado_em();

-- Marca a data de conclusão do tópico automaticamente.
create or replace function public.f_marca_conclusao_topico()
returns trigger language plpgsql as $$
begin
  if new.concluido and (old is null or not old.concluido) then
    new.concluido_em := coalesce(new.concluido_em, now());
  elsif not new.concluido then
    new.concluido_em := null;
  end if;
  return new;
end $$;

drop trigger if exists tg_conclusao_topico on public.topico_progresso;
create trigger tg_conclusao_topico before insert or update on public.topico_progresso
  for each row execute function public.f_marca_conclusao_topico();

-- ★ A INTEGRAÇÃO ENTRE OS MÓDULOS ★
-- Responder uma questão atualiza o desempenho do tópico no edital.
create or replace function public.f_resposta_alimenta_progresso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_topico uuid;
begin
  select topico_id into v_topico from public.questoes where id = new.questao_id;
  if v_topico is null then
    return new;
  end if;

  insert into public.topico_progresso (mentoria_id, topico_id, acertos, erros, questoes)
  values (
    new.mentoria_id,
    v_topico,
    case when new.correta then 1 else 0 end,
    case when new.correta then 0 else 1 end,
    1
  )
  on conflict (mentoria_id, topico_id) do update
    set acertos  = public.topico_progresso.acertos  + case when new.correta then 1 else 0 end,
        erros    = public.topico_progresso.erros    + case when new.correta then 0 else 1 end,
        questoes = public.topico_progresso.questoes + 1;

  return new;
end $$;

drop trigger if exists tg_resposta_progresso on public.respostas;
create trigger tg_resposta_progresso after insert on public.respostas
  for each row execute function public.f_resposta_alimenta_progresso();

-- ─────────────────────────────────────────────────────────────
--  FUNÇÕES DE APOIO (usadas pelas permissões no arquivo 02)
-- ─────────────────────────────────────────────────────────────
create or replace function public.f_eh_mentora()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'mentora' and ativo
  );
$$;

-- A mentoria pertence a quem está logado?
create or replace function public.f_minha_mentoria(p_mentoria uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mentorias
    where id = p_mentoria and aluno_id = auth.uid()
  );
$$;

-- Tenho acesso a este edital (por estar matriculada nele)?
create or replace function public.f_meu_edital(p_edital uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mentorias
    where edital_id = p_edital and aluno_id = auth.uid() and ativa
  );
$$;

create or replace function public.f_meu_plano(p_plano uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mentorias
    where plano_id = p_plano and aluno_id = auth.uid() and ativa
  );
$$;

-- ─────────────────────────────────────────────────────────────
--  VISÕES
-- ─────────────────────────────────────────────────────────────

-- Painel da mentora: uma linha por aluno, com tudo o que importa.
create or replace view public.vw_resumo_mentoria
with (security_invoker = true) as
with base as (
  select
    m.id as mentoria_id,
    m.aluno_id,
    m.mentora_id,
    p.nome as aluno,
    e.nome as edital,
    m.data_prova,
    m.ativa,
    m.meta_horas,
    m.meta_questoes,
    m.meta_conclusao,
    m.meta_aprovamento
  from public.mentorias m
  join public.perfis p on p.id = m.aluno_id
  join public.editais e on e.id = m.edital_id
),
reg as (
  select
    mentoria_id,
    max(data) as ultimo_estudo,
    sum(segundos) as segundos_total,
    sum(segundos) filter (where data >= current_date - 6) as segundos_7d,
    sum(segundos) filter (where data >= date_trunc('week', current_date)::date - 1) as segundos_semana,
    sum(questoes) filter (where data >= date_trunc('week', current_date)::date - 1) as questoes_semana,
    sum(acertos) as acertos_registros,
    sum(erros) as erros_registros,
    count(distinct data) as dias_estudados
  from public.registros
  group by mentoria_id
),
top as (
  select
    tp.mentoria_id,
    count(*) filter (where tp.concluido) as topicos_concluidos,
    sum(tp.acertos) as acertos_topicos,
    sum(tp.erros) as erros_topicos
  from public.topico_progresso tp
  group by tp.mentoria_id
),
totais_edital as (
  select m.id as mentoria_id, count(t.id) as topicos_total
  from public.mentorias m
  join public.disciplinas d on d.edital_id = m.edital_id
  join public.grupos g on g.disciplina_id = d.id
  join public.topicos t on t.grupo_id = g.id
  group by m.id
),
rev as (
  select
    mentoria_id,
    count(*) filter (where not feita and data_revisao < current_date) as revisoes_atrasadas,
    count(*) filter (where not feita and data_revisao = current_date) as revisoes_hoje
  from public.revisoes
  group by mentoria_id
)
select
  b.mentoria_id,
  b.aluno_id,
  b.mentora_id,
  b.aluno,
  b.edital,
  b.ativa,
  b.data_prova,
  case when b.data_prova is null then null
       else b.data_prova - current_date end as dias_para_prova,
  r.ultimo_estudo,
  case when r.ultimo_estudo is null then null
       else current_date - r.ultimo_estudo end as dias_sem_estudar,
  round(coalesce(r.segundos_total, 0) / 3600.0, 1) as horas_total,
  round(coalesce(r.segundos_7d, 0) / 3600.0, 1) as horas_7dias,
  round(coalesce(r.segundos_semana, 0) / 3600.0, 1) as horas_semana,
  b.meta_horas,
  coalesce(r.questoes_semana, 0) as questoes_semana,
  b.meta_questoes,
  coalesce(r.dias_estudados, 0) as dias_estudados,
  coalesce(t.acertos_topicos, 0) + coalesce(r.acertos_registros, 0) as acertos,
  coalesce(t.erros_topicos, 0) + coalesce(r.erros_registros, 0) as erros,
  case
    when coalesce(t.acertos_topicos, 0) + coalesce(r.acertos_registros, 0)
       + coalesce(t.erros_topicos, 0) + coalesce(r.erros_registros, 0) = 0 then null
    else round(
      100.0 * (coalesce(t.acertos_topicos, 0) + coalesce(r.acertos_registros, 0))
      / (coalesce(t.acertos_topicos, 0) + coalesce(r.acertos_registros, 0)
       + coalesce(t.erros_topicos, 0) + coalesce(r.erros_registros, 0))
    )
  end as aproveitamento,
  coalesce(t.topicos_concluidos, 0) as topicos_concluidos,
  coalesce(te.topicos_total, 0) as topicos_total,
  case when coalesce(te.topicos_total, 0) = 0 then 0
       else round(100.0 * coalesce(t.topicos_concluidos, 0) / te.topicos_total) end as pct_edital,
  coalesce(rv.revisoes_atrasadas, 0) as revisoes_atrasadas,
  coalesce(rv.revisoes_hoje, 0) as revisoes_hoje
from base b
left join reg r  on r.mentoria_id = b.mentoria_id
left join top t  on t.mentoria_id = b.mentoria_id
left join totais_edital te on te.mentoria_id = b.mentoria_id
left join rev rv on rv.mentoria_id = b.mentoria_id;

-- Desempenho tópico por tópico: onde o aluno está travando.
create or replace view public.vw_desempenho_topico
with (security_invoker = true) as
select
  m.id as mentoria_id,
  d.nome as disciplina,
  g.nome as grupo,
  t.id as topico_id,
  t.nome as topico,
  coalesce(tp.concluido, false) as concluido,
  tp.concluido_em,
  coalesce(tp.acertos, 0) as acertos,
  coalesce(tp.erros, 0) as erros,
  case when coalesce(tp.acertos, 0) + coalesce(tp.erros, 0) = 0 then null
       else round(100.0 * tp.acertos / (tp.acertos + tp.erros)) end as pct_acerto,
  round(coalesce(rt.segundos, 0) / 3600.0, 1) as horas,
  coalesce(qt.total_questoes, 0) as questoes_disponiveis,
  coalesce(mt.total_materiais, 0) as materiais_disponiveis
from public.mentorias m
join public.disciplinas d on d.edital_id = m.edital_id
join public.grupos g on g.disciplina_id = d.id
join public.topicos t on t.grupo_id = g.id
left join public.topico_progresso tp on tp.mentoria_id = m.id and tp.topico_id = t.id
left join (
  select mentoria_id, topico_id, sum(segundos) as segundos
  from public.registros group by mentoria_id, topico_id
) rt on rt.mentoria_id = m.id and rt.topico_id = t.id
left join (
  select topico_id, count(*) as total_questoes
  from public.questoes where ativa group by topico_id
) qt on qt.topico_id = t.id
left join (
  select topico_id, count(*) as total_materiais
  from public.materiais where publicado group by topico_id
) mt on mt.topico_id = t.id;
