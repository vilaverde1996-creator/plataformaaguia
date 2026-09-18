-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA MÉTODO ÁGUIA — Conteúdo inicial
--  Arquivo 3 de 3: edital da Transpetro e plano de estudos,
--  extraídos do HTML que já está em uso.
--
--  A coluna chave_legado guarda o identificador antigo de cada tópico.
--  É por ela que o progresso atual dos alunos será importado.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  v_edital uuid;
  v_plano  uuid;
  v_disc   uuid;
  v_grupo  uuid;
begin

-- ── EDITAL ──────────────────────────────────────────────────
select id into v_edital from public.editais
  where nome = 'Petrobras Transporte S.A - Transpetro' and coalesce(cargo,'') = 'Administração e Controle';

if v_edital is null then
  insert into public.editais (nome, orgao, banca, cargo, ano)
  values ('Petrobras Transporte S.A - Transpetro', 'Transpetro', 'Cesgranrio', 'Administração e Controle', 2026)
  returning id into v_edital;
end if;

-- LÍNGUA PORTUGUESA
select id into v_disc from public.disciplinas
  where edital_id = v_edital and nome = 'LÍNGUA PORTUGUESA';
if v_disc is null then
  insert into public.disciplinas (edital_id, nome, cor, ordem)
  values (v_edital, 'LÍNGUA PORTUGUESA', '#C8102E', 0)
  returning id into v_disc;
end if;
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Compreensão e Interpretação de Texto';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Compreensão e Interpretação de Texto', 0)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1. Compreensão de textos de gêneros variados.', 0, 'lingua-portuguesa_compreens-o-e-interpreta-o-de-texto_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_compreens-o-e-interpreta-o-de-texto_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3. Mecanismos de coesão textual.', 1, 'lingua-portuguesa_compreens-o-e-interpreta-o-de-texto_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_compreens-o-e-interpreta-o-de-texto_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '8. Significação das palavras.', 2, 'lingua-portuguesa_compreens-o-e-interpreta-o-de-texto_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_compreens-o-e-interpreta-o-de-texto_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Gramática e Normas Gramaticais';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Gramática e Normas Gramaticais', 1)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2. Ortografia oficial.', 0, 'lingua-portuguesa_gram-tica-e-normas-gramaticais_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_gram-tica-e-normas-gramaticais_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4. Emprego das classes de palavras.', 1, 'lingua-portuguesa_gram-tica-e-normas-gramaticais_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_gram-tica-e-normas-gramaticais_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5. Concordância nominal e verbal.', 2, 'lingua-portuguesa_gram-tica-e-normas-gramaticais_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_gram-tica-e-normas-gramaticais_2');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '6. Emprego do sinal indicativo de crase', 3, 'lingua-portuguesa_gram-tica-e-normas-gramaticais_3'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_gram-tica-e-normas-gramaticais_3');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '7. Sinais de pontuação.', 4, 'lingua-portuguesa_gram-tica-e-normas-gramaticais_4'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'lingua-portuguesa_gram-tica-e-normas-gramaticais_4');

-- MATEMÁTICA
select id into v_disc from public.disciplinas
  where edital_id = v_edital and nome = 'MATEMÁTICA';
if v_disc is null then
  insert into public.disciplinas (edital_id, nome, cor, ordem)
  values (v_edital, 'MATEMÁTICA', '#0D134C', 1)
  returning id into v_disc;
end if;
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Aritmética e Conjuntos Numéricos';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Aritmética e Conjuntos Numéricos', 0)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1. Conjuntos numéricos: naturais, inteiros, racionais e reais; ordem, operações e suas propriedades.', 0, 'matematica_aritm-tica-e-conjuntos-num-ricos_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_aritm-tica-e-conjuntos-num-ricos_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2. Razão e proporção: regra de três simples e regra de três composta; porcentagem.', 1, 'matematica_aritm-tica-e-conjuntos-num-ricos_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_aritm-tica-e-conjuntos-num-ricos_1');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Álgebra e Funções';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Álgebra e Funções', 1)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3. Relações, funções: funções polinomiais, exponenciais, logarítmicas e trigonométricas.', 0, 'matematica_-lgebra-e-fun-es_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_-lgebra-e-fun-es_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4. Equações: equações do 1º grau, do 2º grau, exponenciais, logarítmicas e sistemas de equações lineares.', 1, 'matematica_-lgebra-e-fun-es_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_-lgebra-e-fun-es_1');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Estatística e Probabilidade';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Estatística e Probabilidade', 2)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5. Análise combinatória: princípio fundamental da contagem; permutação; arranjo e combinação.', 0, 'matematica_estat-stica-e-probabilidade_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_estat-stica-e-probabilidade_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '6. Probabilidade básica: probabilidade em espaços equiprováveis.', 1, 'matematica_estat-stica-e-probabilidade_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_estat-stica-e-probabilidade_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '7. Estatística básica: representação tabular e gráfica; medidas de tendência central (média, mediana, moda); medidas de dispersão (amplitude, variância, desvio padrão).', 2, 'matematica_estat-stica-e-probabilidade_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_estat-stica-e-probabilidade_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Matemática Financeira';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Matemática Financeira', 3)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '8. Matemática financeira: juros simples e juros compostos (cálculo do montante, do tempo, da taxa e do juro).', 0, 'matematica_matem-tica-financeira_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_matem-tica-financeira_0');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Geometria';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Geometria', 4)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '9. Geometria plana: relações métricas no triângulo retângulo; perímetros e áreas.', 0, 'matematica_geometria_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_geometria_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '10. Geometria espacial: áreas e volumes.', 1, 'matematica_geometria_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'matematica_geometria_1');

-- PROCESSOS ADMINISTRATIVOS E LEGISLAÇÃO
select id into v_disc from public.disciplinas
  where edital_id = v_edital and nome = 'PROCESSOS ADMINISTRATIVOS E LEGISLAÇÃO';
if v_disc is null then
  insert into public.disciplinas (edital_id, nome, cor, ordem)
  values (v_edital, 'PROCESSOS ADMINISTRATIVOS E LEGISLAÇÃO', '#E255BE', 2)
  returning id into v_disc;
end if;
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Recursos Humanos';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Recursos Humanos', 0)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.1 recrutamento e seleção;', 0, 'processos-administrativos-e-legislacao_recursos-humanos_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_recursos-humanos_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.2 plano de cargos e carreira;', 1, 'processos-administrativos-e-legislacao_recursos-humanos_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_recursos-humanos_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.3 treinamento, desenvolvimento e educação;', 2, 'processos-administrativos-e-legislacao_recursos-humanos_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_recursos-humanos_2');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.4 gerenciamento de desempenho e gestão de competências;', 3, 'processos-administrativos-e-legislacao_recursos-humanos_3'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_recursos-humanos_3');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.5 relações de trabalho e benefícios.', 4, 'processos-administrativos-e-legislacao_recursos-humanos_4'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_recursos-humanos_4');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Sistema de Gestão Integrado';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Sistema de Gestão Integrado', 1)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.1 Princípios de integração de sistemas de gestão;', 0, 'processos-administrativos-e-legislacao_sistema-de-gest-o-integrado_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_sistema-de-gest-o-integrado_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.2 Auditorias internas e ações corretivas/preventivas;', 1, 'processos-administrativos-e-legislacao_sistema-de-gest-o-integrado_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_sistema-de-gest-o-integrado_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.3 Melhoria contínua e gestão de riscos integrada.', 2, 'processos-administrativos-e-legislacao_sistema-de-gest-o-integrado_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_sistema-de-gest-o-integrado_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Função Administração Patrimonial';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Função Administração Patrimonial', 2)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.1 Controle e inventário patrimonial;', 0, 'processos-administrativos-e-legislacao_fun-o-administra-o-patrimonial_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_fun-o-administra-o-patrimonial_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.2 Classificação, avaliação e depreciação de bens:', 1, 'processos-administrativos-e-legislacao_fun-o-administra-o-patrimonial_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_fun-o-administra-o-patrimonial_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.3 Gestão de ativos.', 2, 'processos-administrativos-e-legislacao_fun-o-administra-o-patrimonial_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_fun-o-administra-o-patrimonial_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Gestão da Manutenção';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Gestão da Manutenção', 3)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.1 Manutenções preventiva, corretiva e preditiva;', 0, 'processos-administrativos-e-legislacao_gest-o-da-manuten-o_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_gest-o-da-manuten-o_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.2 Planejamento e controle da manutenção.', 1, 'processos-administrativos-e-legislacao_gest-o-da-manuten-o_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_gest-o-da-manuten-o_1');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Gestão de Indicadores';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Gestão de Indicadores', 4)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5.1 Acompanhamento de indicadores;', 0, 'processos-administrativos-e-legislacao_gest-o-de-indicadores_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_gest-o-de-indicadores_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5.2 Análise de indicadores para tomada de decisão;', 1, 'processos-administrativos-e-legislacao_gest-o-de-indicadores_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_gest-o-de-indicadores_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5.3 Indicadores de desempenho ESG.', 2, 'processos-administrativos-e-legislacao_gest-o-de-indicadores_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'processos-administrativos-e-legislacao_gest-o-de-indicadores_2');

-- FINANÇAS E CONTABILIDADE
select id into v_disc from public.disciplinas
  where edital_id = v_edital and nome = 'FINANÇAS E CONTABILIDADE';
if v_disc is null then
  insert into public.disciplinas (edital_id, nome, cor, ordem)
  values (v_edital, 'FINANÇAS E CONTABILIDADE', '#A7C3BB', 3)
  returning id into v_disc;
end if;
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Matemática Financeira';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Matemática Financeira', 0)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.1 Descontos, Juros Simples, Juros Compostos e Porcentagem.', 0, 'financas-e-contabilidade_matem-tica-financeira_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_matem-tica-financeira_0');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Registros Contábeis';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Registros Contábeis', 1)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.1 Princípios e práticas contábeis fundamentais;', 0, 'financas-e-contabilidade_registros-cont-beis_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_registros-cont-beis_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.2 Obrigações acessórias e controle fiscal.', 1, 'financas-e-contabilidade_registros-cont-beis_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_registros-cont-beis_1');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Fluxo de Caixa';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Fluxo de Caixa', 2)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.1 Conceitos e tipos de fluxo de caixa;', 0, 'financas-e-contabilidade_fluxo-de-caixa_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_fluxo-de-caixa_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.2 Elaboração e análise do fluxo de caixa direto e indireto;', 1, 'financas-e-contabilidade_fluxo-de-caixa_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_fluxo-de-caixa_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.3 Gestão de entradas e saídas;', 2, 'financas-e-contabilidade_fluxo-de-caixa_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_fluxo-de-caixa_2');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.4 Integração com orçamento e projeções financeiras.', 3, 'financas-e-contabilidade_fluxo-de-caixa_3'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_fluxo-de-caixa_3');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Balanço Patrimonial e DRE';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Balanço Patrimonial e DRE', 3)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.1 Estrutura do Balanço Patrimonial, estrutura da DRE;', 0, 'financas-e-contabilidade_balan-o-patrimonial-e-dre_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_balan-o-patrimonial-e-dre_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.2 Relação entre balanço, DRE e demais demonstrações contábeis.', 1, 'financas-e-contabilidade_balan-o-patrimonial-e-dre_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'financas-e-contabilidade_balan-o-patrimonial-e-dre_1');

-- LOGÍSTICA E GESTÃO DA CADEIA DE SUPRIMENTOS
select id into v_disc from public.disciplinas
  where edital_id = v_edital and nome = 'LOGÍSTICA E GESTÃO DA CADEIA DE SUPRIMENTOS';
if v_disc is null then
  insert into public.disciplinas (edital_id, nome, cor, ordem)
  values (v_edital, 'LOGÍSTICA E GESTÃO DA CADEIA DE SUPRIMENTOS', '#EFBD7B', 4)
  returning id into v_disc;
end if;
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Logística e Cadeia de Suprimentos';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Logística e Cadeia de Suprimentos', 0)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.1 Conceitos e aplicações;', 0, 'logistica-e-gestao-da-cadeia-de-suprimentos_log-stica-e-cadeia-de-suprimentos_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_log-stica-e-cadeia-de-suprimentos_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.2 Sustentabilidade e logística verde;', 1, 'logistica-e-gestao-da-cadeia-de-suprimentos_log-stica-e-cadeia-de-suprimentos_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_log-stica-e-cadeia-de-suprimentos_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1.3 Tecnologias emergentes para logística.', 2, 'logistica-e-gestao-da-cadeia-de-suprimentos_log-stica-e-cadeia-de-suprimentos_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_log-stica-e-cadeia-de-suprimentos_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Modalidades de Transporte';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Modalidades de Transporte', 1)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.1 Tipos de transporte;', 0, 'logistica-e-gestao-da-cadeia-de-suprimentos_modalidades-de-transporte_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_modalidades-de-transporte_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.2 Intermodalidade e multimodalidade;', 1, 'logistica-e-gestao-da-cadeia-de-suprimentos_modalidades-de-transporte_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_modalidades-de-transporte_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2.3 Regulação e legislação do transporte.', 2, 'logistica-e-gestao-da-cadeia-de-suprimentos_modalidades-de-transporte_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_modalidades-de-transporte_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Gestão de Estoques';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Gestão de Estoques', 2)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.1 Classificação e métodos de gestão de estoques;', 0, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-estoques_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-estoques_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.2 Políticas de estoque e níveis de serviço;', 1, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-estoques_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-estoques_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3.3 Tecnologias para automação do controle de estoque.', 2, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-estoques_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-estoques_2');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Armazenagem e Manuseio de Materiais';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Armazenagem e Manuseio de Materiais', 3)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.1 Tipos de armazéns e suas funções;', 0, 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.2 Layout e organização do armazém;', 1, 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4.3 Tecnologias.', 2, 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_2');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5.1 Equipamentos de movimentação de materiais;', 3, 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_3'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_3');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5.2 Princípios de movimentação eficiente;', 4, 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_4'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_4');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '5.3 Tecnologias de automação do manuseio de materiais.', 5, 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_5'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_armazenagem-e-manuseio-de-materiais_5');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Embalagem';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Embalagem', 4)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '6.1 Tipos e funções da embalagem;', 0, 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '6.2 Sustentabilidade na escolha de materiais de embalagem;', 1, 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '6.3 Unitização de cargas;', 2, 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_2');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '6.4 Segurança no transporte.', 3, 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_3'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_embalagem_3');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Gestão de Compras e Contratos';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Gestão de Compras e Contratos', 5)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '7.1 Modalidades de compras e orçamento;', 0, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_0');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '7.2 Planejamento de compras;', 1, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_1'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_1');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '7.3 Lei nº 13.303/2016 (artigos 28 ao 91), Nova lei geral de licitações nº 14.133/2021.', 2, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_2'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_2');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '8.1 Ciclo de vida do contrato;', 3, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_3'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_3');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '8.2 Fiscalização e gestão de contratos;', 4, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_4'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_4');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '8.3 Gestão de riscos e aditivos contratuais;', 5, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_5'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_5');
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '8.4 Contratos digitais e integração com sistemas de gestão.', 6, 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_6'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'logistica-e-gestao-da-cadeia-de-suprimentos_gest-o-de-compras-e-contratos_6');

-- NOÇÕES DE INFORMÁTICA
select id into v_disc from public.disciplinas
  where edital_id = v_edital and nome = 'NOÇÕES DE INFORMÁTICA';
if v_disc is null then
  insert into public.disciplinas (edital_id, nome, cor, ordem)
  values (v_edital, 'NOÇÕES DE INFORMÁTICA', '#AFE8D0', 5)
  returning id into v_disc;
end if;
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Fundamentos e Hardware/Software';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Fundamentos e Hardware/Software', 0)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '1 Fundamentos de computação: componentes de um computador (hardware e software); características dos principais processadores do mercado; sistemas operacionais - utilitários, aplicativos e manipulação de arquivos nos ambientes Windows (Windows 11).', 0, 'nocões-de-informatica_fundamentos-e-hardware-software_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'nocões-de-informatica_fundamentos-e-hardware-software_0');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Aplicativos e Produtividade';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Aplicativos e Produtividade', 1)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '2 Principais aplicativos comerciais para: edição de textos, planilhas e geração de material escrito e multimídia (Microsoft Office 2024).', 0, 'nocões-de-informatica_aplicativos-e-produtividade_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'nocões-de-informatica_aplicativos-e-produtividade_0');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Redes e Navegação';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Redes e Navegação', 2)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '3 Conceito de internet e intranet e principais navegadores.', 0, 'nocões-de-informatica_redes-e-navega-o_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'nocões-de-informatica_redes-e-navega-o_0');
select id into v_grupo from public.grupos
  where disciplina_id = v_disc and nome = 'Segurança da Informação e Legislação';
if v_grupo is null then
  insert into public.grupos (disciplina_id, nome, ordem)
  values (v_disc, 'Segurança da Informação e Legislação', 3)
  returning id into v_grupo;
end if;
insert into public.topicos (grupo_id, nome, ordem, chave_legado)
  select v_grupo, '4. Noções sobre segurança da informação e Lei Geral de Proteção de Dados Pessoais - LGPD (Lei nº 13.709, de 14 de agosto de 2018, e suas alterações).', 0, 'nocões-de-informatica_seguran-a-da-informa-o-e-legisla-o_0'
  where not exists (select 1 from public.topicos
    where grupo_id = v_grupo and chave_legado = 'nocões-de-informatica_seguran-a-da-informa-o-e-legisla-o_0');

-- ── PLANO DE ESTUDOS ────────────────────────────────────────
select id into v_plano from public.planos
  where nome = 'Método Águia — 82 dias (Transpetro)';
if v_plano is null then
  insert into public.planos (nome, edital_id)
  values ('Método Águia — 82 dias (Transpetro)', v_edital) returning id into v_plano;
else
  delete from public.plano_secoes where plano_id = v_plano;
end if;

insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'titulo', '🦅 Plano de Voo: 82 Dias até a Posse', null, null, null, null, 0);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'destaque', 'A Estratégia do Método Águia', null, 'Para cobrir os 73 tópicos do edital em 82 dias, adotaremos um ritmo de **no máximo 2 matérias por dia** (ou 1 matéria caso seja muito densa).

==REGRA DE OURO: QUESTÕES TODOS OS DIAS.== A teoria inicial deve ser superficial e estratégica; o aprofundamento virá através dos erros nas questões.

**🎯 Ataque ao Alvo:** resolução massiva de questões da Cesgranrio.
**🦅 Afiando as Garras:** revise seus erros ciclicamente usando o agendamento de 7, 15 e 30 dias.', null, null, 1);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'fase', 'Fase 1: Voo de Reconhecimento (Dias 1 a 20)', 'Contato inicial rápido e superficial com a base do edital.', 'Avanço rápido pela teoria de Língua Portuguesa, Matemática e Informática. Não trave em dúvidas; faça leitura dinâmica ou assista aulas em velocidade acelerada. Termine o dia sempre com uma bateria de questões dos temas lidos. Crie resumos curtos apenas do que errar.', '🔭', 'azul', 2);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'fase', 'Fase 2: Foco no Alvo (Dias 21 a 45)', 'Absorção do núcleo técnico (Logística e Administração).', 'Ataque a Processos Administrativos e Logística/Cadeia de Suprimentos (Recursos Humanos, Gestão de Estoques, Modalidades de Transporte). A teoria continua objetiva, mas a carga de questões dobra. Comece a agendar revisões das disciplinas da Fase 1 no cronômetro.', '⚡', 'laranja', 3);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'fase', 'Fase 3: Mergulho Tático (Dias 46 a 70)', 'Dominar os gigantes densos do edital.', 'Dedicação intensa a Contabilidade (Balanço, DRE), Finanças (Mat. Financeira e Fluxo de Caixa) e Legislação (Leis nº 13.303 e 14.133). Devido à alta densidade, estude apenas 1 matéria nestes dias. Muitas questões e leitura atenta da letra da lei.', '🌊', 'amarelo', 4);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'fase', 'Fase 4: O Bote — Reta Final (Dias 71 a 82)', 'Fechamento de lacunas e resistência de prova.', 'Zero teoria nova. Simulados completos cronometrados. Vá no painel de Estatísticas, identifique os tópicos com aproveitamento abaixo de 70% e revise-os brutalmente. Leitura intensiva da Lei Seca nas vésperas.', '🦅', 'vermelho', 5);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'titulo', '🗓️ Ciclo Semanal Focado (Máx. 2 Matérias/Dia)', null, null, null, null, 6);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'texto', null, null, 'Para avançar pelos 73 tópicos sem sobrecarga, este ciclo foca na profundidade de aprendizado diário.
**Dias com matérias densas (como Legislação e Contabilidade) possuem apenas um tema.** Nos demais, combinamos uma disciplina principal e uma secundária.
==Importante: reserve sempre os últimos 40 minutos do seu estudo diário para resolver questões dos temas lidos.==', null, null, 7);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'dia', 'Segunda-feira', null, '**Língua Portuguesa** (foco no tópico do dia)
**Noções de Informática**
🎯 Bateria de questões (ambas)', null, 'normal', 8);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'dia', 'Terça-feira (foco em densidade)', null, '**Processos Administrativos e Legislação** | Avanço focado nas Leis 13.303/14.133 ou RH
🎯 Questões de Legislação + Lei Seca', null, 'denso', 9);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'dia', 'Quarta-feira', null, '**Logística e Cadeia de Suprimentos**
**Matemática / Raciocínio Lógico**
🎯 Bateria de questões (ambas)', null, 'normal', 10);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'dia', 'Quinta-feira (foco em densidade)', null, '**Finanças e Contabilidade** | Balanço, DRE ou Fluxo de Caixa
🎯 Bateria de questões + fixação de fórmulas', null, 'denso', 11);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'dia', 'Sexta-feira', null, '**Língua Portuguesa** (treino de compreensão)
**Logística ou Adm. Patrimonial**
🎯 Bateria de questões (ambas)', null, 'normal', 12);
insert into public.plano_secoes (plano_id, secao, titulo, subtitulo, texto, icone, estilo, ordem)
values (v_plano, 'dia', 'Sábado (revisão e prática)', null, '**Resolução do agendamento de revisões**
**Revisão dos erros da semana**
🎯 Questões variadas de todos os temas vistos', null, 'revisao', 13);

raise notice 'Edital e plano importados. Tópicos esperados: %', 73;
end $$;

-- Conferência rápida:
select d.nome as disciplina, count(t.id) as topicos
from public.disciplinas d
join public.grupos g on g.disciplina_id = d.id
join public.topicos t on t.grupo_id = g.id
group by d.nome, d.ordem order by d.ordem;
