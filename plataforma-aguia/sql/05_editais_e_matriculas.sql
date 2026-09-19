-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA MÉTODO ÁGUIA — Cadastrar editais e matricular alunos
--  Arquivo 5: ferramentas de uso no SQL Editor do Supabase
--
--  Estas funções só funcionam pelo SQL Editor (onde só você entra).
--  Nem aluno nem visitante conseguem executá-las pelo site.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  criar_edital(nome, órgão, banca, cargo, ano, texto)
--
--  O texto é o edital verticalizado, colado assim:
--
--    # LÍNGUA PORTUGUESA
--    ## Compreensão e Interpretação de Texto
--    - Ideias principais e secundárias
--    - Inferências
--    ## Sintaxe
--    - Regência verbal e nominal
--    # MATEMÁTICA
--    - Razão e proporção
--
--  Uma linha com # é disciplina, com ## é grupo (opcional), e as
--  demais são tópicos. O tracinho no começo é opcional.
--  Rodar de novo com o mesmo nome de edital não duplica nada:
--  os tópicos que já existem são mantidos e os novos entram no fim.
-- ─────────────────────────────────────────────────────────────
create or replace function public.criar_edital(
  p_nome  text,
  p_orgao text,
  p_banca text,
  p_cargo text,
  p_ano   int,
  p_texto text
)
returns jsonb
language plpgsql
as $$
declare
  v_edital  uuid;
  v_disc    uuid;
  v_grupo   uuid;
  v_linha   text;
  v_limpa   text;
  v_ordem_d int := 0;
  v_ordem_g int := 0;
  v_ordem_t int := 0;
  v_qtd_d   int := 0;
  v_qtd_t   int := 0;
  v_cores   text[] := array['#C8102E','#0D134C','#E255BE','#A7C3BB','#EFBD7B',
                            '#AFE8D0','#7c3aed','#0d9488','#ea580c','#BAFF38'];
begin
  select id into v_edital from public.editais
   where nome = p_nome and coalesce(cargo,'') = coalesce(p_cargo,'');

  if v_edital is null then
    insert into public.editais (nome, orgao, banca, cargo, ano)
    values (p_nome, p_orgao, p_banca, p_cargo, p_ano)
    returning id into v_edital;
  end if;

  select coalesce(max(ordem) + 1, 0) into v_ordem_d
    from public.disciplinas where edital_id = v_edital;

  foreach v_linha in array string_to_array(replace(p_texto, e'\r', ''), e'\n')
  loop
    v_limpa := btrim(v_linha);
    continue when v_limpa = '';

    if v_limpa like '##%' then
      -- grupo
      v_limpa := btrim(ltrim(v_limpa, '#'));
      if v_disc is null then
        raise exception 'Apareceu um grupo (##) antes de qualquer disciplina (#): %', v_limpa;
      end if;

      select id into v_grupo from public.grupos
       where disciplina_id = v_disc and nome = v_limpa;

      if v_grupo is null then
        select coalesce(max(ordem) + 1, 0) into v_ordem_g
          from public.grupos where disciplina_id = v_disc;
        insert into public.grupos (disciplina_id, nome, ordem)
        values (v_disc, v_limpa, v_ordem_g)
        returning id into v_grupo;
      end if;

    elsif v_limpa like '#%' then
      -- disciplina
      v_limpa := btrim(ltrim(v_limpa, '#'));
      v_grupo := null;

      select id into v_disc from public.disciplinas
       where edital_id = v_edital and nome = v_limpa;

      if v_disc is null then
        insert into public.disciplinas (edital_id, nome, cor, ordem)
        values (v_edital, v_limpa,
                v_cores[1 + (v_ordem_d % array_length(v_cores, 1))],
                v_ordem_d)
        returning id into v_disc;
        v_ordem_d := v_ordem_d + 1;
        v_qtd_d := v_qtd_d + 1;
      end if;

    else
      -- tópico
      if v_disc is null then
        raise exception 'Apareceu um tópico antes de qualquer disciplina (#): %', v_limpa;
      end if;

      -- sem grupo declarado, usa um grupo único chamado "Conteúdo"
      if v_grupo is null then
        select id into v_grupo from public.grupos
         where disciplina_id = v_disc and nome = 'Conteúdo';
        if v_grupo is null then
          select coalesce(max(ordem) + 1, 0) into v_ordem_g
            from public.grupos where disciplina_id = v_disc;
          insert into public.grupos (disciplina_id, nome, ordem)
          values (v_disc, 'Conteúdo', v_ordem_g)
          returning id into v_grupo;
        end if;
      end if;

      v_limpa := btrim(ltrim(v_limpa, '-•* '));
      continue when v_limpa = '';

      if not exists (select 1 from public.topicos
                      where grupo_id = v_grupo and nome = v_limpa) then
        select coalesce(max(ordem) + 1, 0) into v_ordem_t
          from public.topicos where grupo_id = v_grupo;
        insert into public.topicos (grupo_id, nome, ordem)
        values (v_grupo, v_limpa, v_ordem_t);
        v_qtd_t := v_qtd_t + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'edital_id', v_edital,
    'disciplinas_novas', v_qtd_d,
    'topicos_novos', v_qtd_t,
    'topicos_total', (select count(*) from public.topicos t
                       join public.grupos g on g.id = t.grupo_id
                       join public.disciplinas d on d.id = g.disciplina_id
                      where d.edital_id = v_edital)
  );
end $$;

-- ─────────────────────────────────────────────────────────────
--  matricular(e-mail do aluno, nome do edital, data da prova)
--
--  Cria o vínculo do aluno com o edital. Se o aluno já estiver
--  matriculado nesse edital, só atualiza a data da prova.
--  O mesmo aluno pode ter vários editais ao mesmo tempo.
-- ─────────────────────────────────────────────────────────────
create or replace function public.matricular(
  p_email_aluno   text,
  p_nome_edital   text,
  p_data_prova    date default null,
  p_meta_horas    numeric default 20,
  p_meta_questoes int default 300
)
returns jsonb
language plpgsql
as $$
declare
  v_aluno   uuid;
  v_mentora uuid;
  v_edital  uuid;
  v_plano   uuid;
  v_id      uuid;
begin
  select id into v_aluno from public.perfis where lower(email) = lower(btrim(p_email_aluno));
  if v_aluno is null then
    raise exception 'Não existe conta com o e-mail %. Crie o usuário em Authentication → Users primeiro.', p_email_aluno;
  end if;

  select id into v_mentora from public.perfis where papel = 'mentora' order by criado_em limit 1;
  if v_mentora is null then
    raise exception 'Nenhuma conta está marcada como mentora.';
  end if;

  select id into v_edital from public.editais where nome = p_nome_edital;
  if v_edital is null then
    raise exception 'Não existe edital chamado %. Use a função criar_edital antes.', p_nome_edital;
  end if;

  select id into v_plano from public.planos where edital_id = v_edital order by criado_em limit 1;

  insert into public.mentorias (
    aluno_id, mentora_id, edital_id, plano_id, data_prova, meta_horas, meta_questoes,
    meta_conclusao, meta_aprovamento
  ) values (
    v_aluno, v_mentora, v_edital, v_plano, p_data_prova, p_meta_horas, p_meta_questoes, 100, 70
  )
  on conflict (aluno_id, edital_id) do update
    set data_prova = coalesce(excluded.data_prova, public.mentorias.data_prova),
        ativa = true
  returning id into v_id;

  return jsonb_build_object(
    'mentoria_id', v_id,
    'aluno', (select nome from public.perfis where id = v_aluno),
    'edital', p_nome_edital,
    'topicos', (select count(*) from public.topicos t
                 join public.grupos g on g.id = t.grupo_id
                 join public.disciplinas d on d.id = g.disciplina_id
                where d.edital_id = v_edital)
  );
end $$;

-- Ninguém alcança estas funções pelo site: só pelo SQL Editor.
revoke all on function public.criar_edital(text, text, text, text, int, text) from anon, authenticated;
revoke all on function public.matricular(text, text, date, numeric, int) from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
--  COMO USAR
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Cadastrar um edital novo (exemplo com duas disciplinas):
/*
select public.criar_edital(
  'Banco do Brasil - Escriturário',   -- nome do edital
  'Banco do Brasil',                  -- órgão
  'Cesgranrio',                       -- banca
  'Agente Comercial',                 -- cargo
  2026,                               -- ano
$$
# LÍNGUA PORTUGUESA
## Compreensão e Interpretação de Texto
- Ideias principais e secundárias
- Inferências e pressupostos
## Sintaxe
- Regência verbal e nominal
- Concordância

# MATEMÁTICA FINANCEIRA
- Juros simples e compostos
- Desconto e taxas
$$
);
*/

-- 2) Matricular um aluno nesse edital:
/*
select public.matricular('aluno@exemplo.com', 'Banco do Brasil - Escriturário', '2026-12-13');
*/

-- 3) Ver quem está matriculado em quê:
/*
select aluno, edital, data_prova, dias_para_prova, topicos_total, pct_edital
from public.vw_resumo_mentoria order by aluno;
*/

-- 4) Encerrar uma matrícula sem apagar o histórico:
/*
update public.mentorias set ativa = false
 where aluno_id = (select id from public.perfis where email = 'aluno@exemplo.com')
   and edital_id = (select id from public.editais where nome = 'Banco do Brasil - Escriturário');
*/
