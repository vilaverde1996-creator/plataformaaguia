-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA MÉTODO ÁGUIA — Segurança
--  Arquivo 2 de 3: permissões, regras de acesso e funções da aplicação
--
--  Regras que este arquivo garante:
--   • um aluno só vê os dados dele; nunca os de outro aluno
--   • o aluno NÃO consegue ver o gabarito antes de responder
--   • só a mentora cadastra edital, questões e materiais
--   • PDFs não ficam com link público; só quem é aluno do edital abre
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  1. LIGAR A PROTEÇÃO EM TODAS AS TABELAS
--     Sem isso, qualquer pessoa com a chave pública do site
--     conseguiria ler o banco inteiro.
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'perfis','editais','disciplinas','grupos','topicos','planos','plano_secoes',
    'mentorias','registros','topico_progresso','revisoes',
    'questoes','alternativas','sessoes_questoes','respostas','questoes_marcadas',
    'materiais','material_acessos','material_progresso'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
--  2. PERMISSÕES DE COLUNA
--     O gabarito e o comentário ficam fora do alcance do
--     aplicativo. Eles só saem pelas funções do item 5.
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

revoke select on public.questoes from anon, authenticated;
grant select (
  id, edital_id, disciplina_id, topico_id, tipo, enunciado,
  banca, orgao, ano, cargo, dificuldade, fonte, imagem_url, ativa, criado_em
) on public.questoes to authenticated;

revoke select on public.alternativas from anon, authenticated;
grant select (id, questao_id, letra, texto, ordem) on public.alternativas to authenticated;

-- Questões e respostas só mudam através das funções (item 5).
revoke insert, update, delete on public.questoes from anon, authenticated;
revoke insert, update, delete on public.alternativas from anon, authenticated;
revoke insert, update, delete on public.respostas from anon, authenticated;
grant select on public.respostas to authenticated;

-- Ninguém se promove a mentora sozinho: papel e situação só mudam
-- pelas funções definir_papel e definir_ativo.
revoke update on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;
grant update (nome, telefone, observacoes) on public.perfis to authenticated;

-- O vínculo aluno × edital também não: se o aluno pudesse editar a
-- coluna edital_id, ele entraria no material de outro concurso.
-- Só as metas ficam liberadas; o resto passa pela função salvar_mentoria.
revoke update on public.mentorias from anon, authenticated;
grant update (meta_horas, meta_questoes, meta_conclusao, meta_aprovamento)
  on public.mentorias to authenticated;
revoke insert, delete on public.mentorias from anon, authenticated;

-- Demais tabelas: o acesso é liberado no nível de linha (item 3).
grant select on public.mentorias to authenticated;

grant select, insert, update, delete on
  public.editais, public.disciplinas, public.grupos, public.topicos,
  public.planos, public.plano_secoes,
  public.registros, public.topico_progresso, public.revisoes,
  public.sessoes_questoes, public.questoes_marcadas,
  public.materiais, public.material_acessos, public.material_progresso
to authenticated;

grant select on public.vw_resumo_mentoria, public.vw_desempenho_topico to authenticated;

-- ─────────────────────────────────────────────────────────────
--  3. REGRAS DE ACESSO POR LINHA
-- ─────────────────────────────────────────────────────────────

-- Perfis ------------------------------------------------------
drop policy if exists p_perfis_leitura on public.perfis;
create policy p_perfis_leitura on public.perfis for select to authenticated
  using (id = auth.uid() or public.f_eh_mentora());

drop policy if exists p_perfis_edicao on public.perfis;
create policy p_perfis_edicao on public.perfis for update to authenticated
  using (id = auth.uid() or public.f_eh_mentora())
  with check (id = auth.uid() or public.f_eh_mentora());

-- Estrutura do edital: aluno lê o que é do edital dele; mentora faz tudo.
drop policy if exists p_editais_leitura on public.editais;
create policy p_editais_leitura on public.editais for select to authenticated
  using (public.f_eh_mentora() or public.f_meu_edital(id));

drop policy if exists p_editais_mentora on public.editais;
create policy p_editais_mentora on public.editais for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

drop policy if exists p_disciplinas_leitura on public.disciplinas;
create policy p_disciplinas_leitura on public.disciplinas for select to authenticated
  using (public.f_eh_mentora() or public.f_meu_edital(edital_id));

drop policy if exists p_disciplinas_mentora on public.disciplinas;
create policy p_disciplinas_mentora on public.disciplinas for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

drop policy if exists p_grupos_leitura on public.grupos;
create policy p_grupos_leitura on public.grupos for select to authenticated
  using (
    public.f_eh_mentora() or exists (
      select 1 from public.disciplinas d
      where d.id = disciplina_id and public.f_meu_edital(d.edital_id)
    )
  );

drop policy if exists p_grupos_mentora on public.grupos;
create policy p_grupos_mentora on public.grupos for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

drop policy if exists p_topicos_leitura on public.topicos;
create policy p_topicos_leitura on public.topicos for select to authenticated
  using (
    public.f_eh_mentora() or exists (
      select 1 from public.grupos g
      join public.disciplinas d on d.id = g.disciplina_id
      where g.id = grupo_id and public.f_meu_edital(d.edital_id)
    )
  );

drop policy if exists p_topicos_mentora on public.topicos;
create policy p_topicos_mentora on public.topicos for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

-- Plano de estudos --------------------------------------------
drop policy if exists p_planos_leitura on public.planos;
create policy p_planos_leitura on public.planos for select to authenticated
  using (public.f_eh_mentora() or public.f_meu_plano(id));

drop policy if exists p_planos_mentora on public.planos;
create policy p_planos_mentora on public.planos for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

drop policy if exists p_plano_secoes_leitura on public.plano_secoes;
create policy p_plano_secoes_leitura on public.plano_secoes for select to authenticated
  using (public.f_eh_mentora() or public.f_meu_plano(plano_id));

drop policy if exists p_plano_secoes_mentora on public.plano_secoes;
create policy p_plano_secoes_mentora on public.plano_secoes for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

-- Mentorias ---------------------------------------------------
drop policy if exists p_mentorias_leitura on public.mentorias;
create policy p_mentorias_leitura on public.mentorias for select to authenticated
  using (aluno_id = auth.uid() or public.f_eh_mentora());

drop policy if exists p_mentorias_mentora on public.mentorias;
create policy p_mentorias_mentora on public.mentorias for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

-- O aluno pode ajustar as próprias metas (só essas colunas estão liberadas).
drop policy if exists p_mentorias_metas on public.mentorias;
create policy p_mentorias_metas on public.mentorias for update to authenticated
  using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());

-- Progresso do aluno ------------------------------------------
-- Padrão para as tabelas ligadas à mentoria: o aluno mexe nas
-- linhas da mentoria dele; a mentora vê e ajusta tudo.
do $$
declare t text;
begin
  foreach t in array array[
    'registros','topico_progresso','revisoes','sessoes_questoes',
    'questoes_marcadas','material_acessos','material_progresso'
  ]
  loop
    execute format('drop policy if exists p_%s_aluno on public.%I', t, t);
    execute format($f$
      create policy p_%s_aluno on public.%I for all to authenticated
        using (public.f_minha_mentoria(mentoria_id) or public.f_eh_mentora())
        with check (public.f_minha_mentoria(mentoria_id) or public.f_eh_mentora())
    $f$, t, t);
  end loop;
end $$;

-- Respostas: leitura própria; a gravação é pela função responder_questao.
drop policy if exists p_respostas_leitura on public.respostas;
create policy p_respostas_leitura on public.respostas for select to authenticated
  using (public.f_minha_mentoria(mentoria_id) or public.f_eh_mentora());

-- Questões ----------------------------------------------------
drop policy if exists p_questoes_leitura on public.questoes;
create policy p_questoes_leitura on public.questoes for select to authenticated
  using (
    public.f_eh_mentora()
    or (ativa and (edital_id is null or public.f_meu_edital(edital_id)))
  );

drop policy if exists p_alternativas_leitura on public.alternativas;
create policy p_alternativas_leitura on public.alternativas for select to authenticated
  using (
    public.f_eh_mentora() or exists (
      select 1 from public.questoes q
      where q.id = questao_id and q.ativa
        and (q.edital_id is null or public.f_meu_edital(q.edital_id))
    )
  );

-- Materiais ---------------------------------------------------
drop policy if exists p_materiais_leitura on public.materiais;
create policy p_materiais_leitura on public.materiais for select to authenticated
  using (
    public.f_eh_mentora()
    or (publicado and (edital_id is null or public.f_meu_edital(edital_id)))
  );

drop policy if exists p_materiais_mentora on public.materiais;
create policy p_materiais_mentora on public.materiais for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());

-- ─────────────────────────────────────────────────────────────
--  4. VISÕES DE ADMINISTRAÇÃO (com gabarito)
--     Só retornam linhas quando quem consulta é a mentora.
-- ─────────────────────────────────────────────────────────────
create or replace view public.vw_questoes_admin
with (security_invoker = false) as
select q.*,
  (select count(*) from public.alternativas a where a.questao_id = q.id) as qtd_alternativas,
  (select count(*) from public.respostas r where r.questao_id = q.id) as qtd_respostas
from public.questoes q
where public.f_eh_mentora();

create or replace view public.vw_alternativas_admin
with (security_invoker = false) as
select a.* from public.alternativas a
where public.f_eh_mentora();

grant select on public.vw_questoes_admin, public.vw_alternativas_admin to authenticated;

-- ─────────────────────────────────────────────────────────────
--  5. FUNÇÕES DA APLICAÇÃO
-- ─────────────────────────────────────────────────────────────

-- Aluno responde uma questão. Só aqui o gabarito é revelado,
-- e só depois de a resposta estar gravada.
create or replace function public.responder_questao(
  p_mentoria uuid,
  p_questao uuid,
  p_alternativa uuid,
  p_segundos int default null,
  p_sessao uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correta boolean;
  v_certa   uuid;
  v_letra   text;
  v_coment  text;
  v_topico  uuid;
begin
  if not (public.f_minha_mentoria(p_mentoria) or public.f_eh_mentora()) then
    raise exception 'Esta mentoria não é sua.';
  end if;

  select q.topico_id, q.comentario into v_topico, v_coment
  from public.questoes q
  join public.mentorias m on m.id = p_mentoria
  where q.id = p_questao
    and q.ativa
    and (q.edital_id is null or q.edital_id = m.edital_id);

  if not found then
    raise exception 'Questão não encontrada ou fora do seu edital.';
  end if;

  select a.id, a.letra into v_certa, v_letra
  from public.alternativas a
  where a.questao_id = p_questao and a.correta;

  v_correta := (p_alternativa is not null and p_alternativa = v_certa);

  insert into public.respostas
    (mentoria_id, questao_id, alternativa_id, correta, segundos, sessao_id)
  values
    (p_mentoria, p_questao, p_alternativa, v_correta, p_segundos, p_sessao);

  return jsonb_build_object(
    'correta', v_correta,
    'alternativa_correta', v_certa,
    'letra_correta', v_letra,
    'comentario', v_coment
  );
end $$;

-- Rever uma questão já respondida (gabarito + comentário).
create or replace function public.revisar_questao(p_mentoria uuid, p_questao uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_res jsonb;
begin
  if not (public.f_minha_mentoria(p_mentoria) or public.f_eh_mentora()) then
    raise exception 'Esta mentoria não é sua.';
  end if;

  if not public.f_eh_mentora() and not exists (
    select 1 from public.respostas
    where mentoria_id = p_mentoria and questao_id = p_questao
  ) then
    raise exception 'Responda a questão antes de ver o gabarito.';
  end if;

  select jsonb_build_object(
    'comentario', q.comentario,
    'alternativa_correta', (select a.id from public.alternativas a
                            where a.questao_id = q.id and a.correta),
    'letra_correta', (select a.letra from public.alternativas a
                      where a.questao_id = q.id and a.correta)
  ) into v_res
  from public.questoes q where q.id = p_questao;

  return v_res;
end $$;

-- Cadastrar ou editar uma questão com as alternativas, de uma vez.
-- Formato esperado em p_dados:
-- {
--   "id": null,                       -- preencher para editar
--   "edital_id": "...", "disciplina_id": "...", "topico_id": "...",
--   "tipo": "multipla_escolha", "enunciado": "...", "comentario": "...",
--   "banca": "Cesgranrio", "orgao": "Transpetro", "ano": 2023,
--   "dificuldade": "media", "fonte": "...", "ativa": true,
--   "alternativas": [ {"letra":"A","texto":"...","correta":false}, ... ]
-- }
create or replace function public.salvar_questao(p_dados jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id  uuid;
  v_alt jsonb;
  v_i   int := 0;
begin
  if not public.f_eh_mentora() then
    raise exception 'Apenas a mentora cadastra questões.';
  end if;

  v_id := nullif(p_dados->>'id', '')::uuid;

  if v_id is null then
    insert into public.questoes (
      edital_id, disciplina_id, topico_id, tipo, enunciado, comentario,
      banca, orgao, ano, cargo, dificuldade, fonte, imagem_url, ativa, criada_por
    ) values (
      nullif(p_dados->>'edital_id','')::uuid,
      nullif(p_dados->>'disciplina_id','')::uuid,
      nullif(p_dados->>'topico_id','')::uuid,
      coalesce(nullif(p_dados->>'tipo','')::tipo_questao, 'multipla_escolha'),
      p_dados->>'enunciado',
      p_dados->>'comentario',
      p_dados->>'banca',
      p_dados->>'orgao',
      nullif(p_dados->>'ano','')::int,
      p_dados->>'cargo',
      nullif(p_dados->>'dificuldade','')::nivel_dificuldade,
      p_dados->>'fonte',
      p_dados->>'imagem_url',
      coalesce((p_dados->>'ativa')::boolean, true),
      auth.uid()
    ) returning id into v_id;
  else
    update public.questoes set
      edital_id     = nullif(p_dados->>'edital_id','')::uuid,
      disciplina_id = nullif(p_dados->>'disciplina_id','')::uuid,
      topico_id     = nullif(p_dados->>'topico_id','')::uuid,
      tipo          = coalesce(nullif(p_dados->>'tipo','')::tipo_questao, tipo),
      enunciado     = coalesce(p_dados->>'enunciado', enunciado),
      comentario    = p_dados->>'comentario',
      banca         = p_dados->>'banca',
      orgao         = p_dados->>'orgao',
      ano           = nullif(p_dados->>'ano','')::int,
      cargo         = p_dados->>'cargo',
      dificuldade   = nullif(p_dados->>'dificuldade','')::nivel_dificuldade,
      fonte         = p_dados->>'fonte',
      imagem_url    = p_dados->>'imagem_url',
      ativa         = coalesce((p_dados->>'ativa')::boolean, ativa)
    where id = v_id;
  end if;

  if p_dados ? 'alternativas' then
    delete from public.alternativas where questao_id = v_id;
    for v_alt in select * from jsonb_array_elements(p_dados->'alternativas')
    loop
      v_i := v_i + 1;
      insert into public.alternativas (questao_id, letra, texto, correta, ordem)
      values (
        v_id,
        coalesce(v_alt->>'letra', chr(64 + v_i)),
        coalesce(v_alt->>'texto', ''),
        coalesce((v_alt->>'correta')::boolean, false),
        coalesce(nullif(v_alt->>'ordem','')::int, v_i)
      );
    end loop;
  end if;

  return v_id;
end $$;

-- Importar várias questões de uma vez (vindas da planilha modelo).
-- Uma questão com erro não derruba as outras: ela volta na lista de erros.
create or replace function public.importar_questoes(p_lista jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item   jsonb;
  v_ok     int := 0;
  v_erros  jsonb := '[]'::jsonb;
  v_linha  int := 0;
begin
  if not public.f_eh_mentora() then
    raise exception 'Apenas a mentora importa questões.';
  end if;

  for v_item in select * from jsonb_array_elements(p_lista)
  loop
    v_linha := v_linha + 1;
    begin
      perform public.salvar_questao(v_item);
      v_ok := v_ok + 1;
    exception when others then
      v_erros := v_erros || jsonb_build_object('linha', v_linha, 'erro', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('importadas', v_ok, 'erros', v_erros);
end $$;

create or replace function public.excluir_questao(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.f_eh_mentora() then
    raise exception 'Apenas a mentora exclui questões.';
  end if;
  delete from public.questoes where id = p_id;
end $$;

-- Criar ou editar a mentoria de um aluno (vínculo, datas, plano, recado).
-- Formato de p_dados:
-- { "id": null, "aluno_id": "...", "edital_id": "...", "plano_id": "...",
--   "data_prova": "2026-11-29", "cargo": "...", "recado": "...",
--   "meta_horas": 20, "meta_questoes": 300, "meta_conclusao": 100,
--   "meta_aprovamento": 70, "ativa": true }
create or replace function public.salvar_mentoria(p_dados jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if not public.f_eh_mentora() then
    raise exception 'Apenas a mentora gerencia mentorias.';
  end if;

  v_id := nullif(p_dados->>'id', '')::uuid;

  if v_id is null then
    insert into public.mentorias (
      aluno_id, mentora_id, edital_id, plano_id, data_prova, cargo, recado,
      meta_horas, meta_questoes, meta_conclusao, meta_aprovamento, ativa
    ) values (
      (p_dados->>'aluno_id')::uuid,
      auth.uid(),
      (p_dados->>'edital_id')::uuid,
      nullif(p_dados->>'plano_id','')::uuid,
      nullif(p_dados->>'data_prova','')::date,
      p_dados->>'cargo',
      p_dados->>'recado',
      nullif(p_dados->>'meta_horas','')::numeric,
      nullif(p_dados->>'meta_questoes','')::int,
      nullif(p_dados->>'meta_conclusao','')::int,
      nullif(p_dados->>'meta_aprovamento','')::int,
      coalesce((p_dados->>'ativa')::boolean, true)
    )
    on conflict (aluno_id, edital_id) do update
      set plano_id   = excluded.plano_id,
          data_prova = excluded.data_prova,
          ativa      = excluded.ativa
    returning id into v_id;
  else
    update public.mentorias set
      edital_id        = coalesce(nullif(p_dados->>'edital_id','')::uuid, edital_id),
      plano_id         = nullif(p_dados->>'plano_id','')::uuid,
      data_prova       = nullif(p_dados->>'data_prova','')::date,
      cargo            = p_dados->>'cargo',
      recado           = p_dados->>'recado',
      meta_horas       = nullif(p_dados->>'meta_horas','')::numeric,
      meta_questoes    = nullif(p_dados->>'meta_questoes','')::int,
      meta_conclusao   = nullif(p_dados->>'meta_conclusao','')::int,
      meta_aprovamento = nullif(p_dados->>'meta_aprovamento','')::int,
      ativa            = coalesce((p_dados->>'ativa')::boolean, ativa)
    where id = v_id;
  end if;

  return v_id;
end $$;

-- Ativar ou desativar um aluno (ex: mentoria encerrada).
create or replace function public.definir_ativo(p_perfil uuid, p_ativo boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.f_eh_mentora() then
    raise exception 'Apenas a mentora altera a situação de um aluno.';
  end if;
  update public.perfis set ativo = p_ativo where id = p_perfil;
end $$;

-- Definir quem é mentora e quem é aluno.
create or replace function public.definir_papel(p_perfil uuid, p_papel papel_usuario)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.f_eh_mentora() then
    raise exception 'Apenas a mentora altera papéis.';
  end if;
  update public.perfis set papel = p_papel where id = p_perfil;
end $$;

revoke all on function public.responder_questao(uuid, uuid, uuid, int, uuid) from anon;
revoke all on function public.salvar_questao(jsonb) from anon;
revoke all on function public.importar_questoes(jsonb) from anon;
revoke all on function public.excluir_questao(uuid) from anon;
revoke all on function public.definir_papel(uuid, papel_usuario) from anon;
revoke all on function public.definir_ativo(uuid, boolean) from anon;
revoke all on function public.salvar_mentoria(jsonb) from anon;
revoke all on function public.revisar_questao(uuid, uuid) from anon;

grant execute on function public.responder_questao(uuid, uuid, uuid, int, uuid) to authenticated;
grant execute on function public.revisar_questao(uuid, uuid) to authenticated;
grant execute on function public.salvar_questao(jsonb) to authenticated;
grant execute on function public.importar_questoes(jsonb) to authenticated;
grant execute on function public.excluir_questao(uuid) to authenticated;
grant execute on function public.definir_papel(uuid, papel_usuario) to authenticated;
grant execute on function public.definir_ativo(uuid, boolean) to authenticated;
grant execute on function public.salvar_mentoria(jsonb) to authenticated;

-- ─────────────────────────────────────────────────────────────
--  6. ARQUIVOS (PDFs)
--     Bucket privado. O aluno só abre o PDF de um material
--     publicado do edital dele, por link temporário.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('imagens-questoes', 'imagens-questoes', true)
on conflict (id) do nothing;

create or replace function public.f_material_liberado(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.materiais mt
    join public.mentorias m on m.edital_id = mt.edital_id
    where mt.caminho = p_caminho
      and mt.publicado
      and m.aluno_id = auth.uid()
      and m.ativa
  );
$$;

drop policy if exists p_storage_materiais_mentora on storage.objects;
create policy p_storage_materiais_mentora on storage.objects for all to authenticated
  using (bucket_id = 'materiais' and public.f_eh_mentora())
  with check (bucket_id = 'materiais' and public.f_eh_mentora());

drop policy if exists p_storage_materiais_aluno on storage.objects;
create policy p_storage_materiais_aluno on storage.objects for select to authenticated
  using (bucket_id = 'materiais' and public.f_material_liberado(name));

drop policy if exists p_storage_imagens_leitura on storage.objects;
create policy p_storage_imagens_leitura on storage.objects for select to anon, authenticated
  using (bucket_id = 'imagens-questoes');

drop policy if exists p_storage_imagens_mentora on storage.objects;
create policy p_storage_imagens_mentora on storage.objects for all to authenticated
  using (bucket_id = 'imagens-questoes' and public.f_eh_mentora())
  with check (bucket_id = 'imagens-questoes' and public.f_eh_mentora());
