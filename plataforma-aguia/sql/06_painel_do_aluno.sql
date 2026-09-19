-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA ASAS DE ÁGUIA — Painel do aluno
--  Arquivo 6: frase do dia, sequência de dias e link da mentoria
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  1. LINK DE AGENDAMENTO DA MENTORIA
--     Pode ser o seu Calendly, Google Agenda ou link do WhatsApp.
-- ─────────────────────────────────────────────────────────────
alter table public.mentorias
  add column if not exists link_agendamento text;

-- Para preencher (troque pelo seu link):
-- update public.mentorias set link_agendamento = 'https://calendly.com/seu-usuario';

-- ─────────────────────────────────────────────────────────────
--  2. DIAS ATIVOS — a "ofensiva"
--     Uma linha por dia em que o aluno entrou na plataforma.
--     A coluna estudou marca os dias em que ele registrou estudo.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.dias_ativos (
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  data     date not null default current_date,
  estudou  boolean not null default false,
  primary key (aluno_id, data)
);

alter table public.dias_ativos enable row level security;
grant select, insert, update on public.dias_ativos to authenticated;

drop policy if exists p_dias_ativos on public.dias_ativos;
create policy p_dias_ativos on public.dias_ativos for all to authenticated
  using (aluno_id = auth.uid() or public.f_eh_mentora())
  with check (aluno_id = auth.uid());

-- Marca o dia em que o aluno estudou de verdade.
create or replace function public.f_registro_marca_dia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_aluno uuid;
begin
  select aluno_id into v_aluno from public.mentorias where id = new.mentoria_id;
  if v_aluno is null then return new; end if;

  insert into public.dias_ativos (aluno_id, data, estudou)
  values (v_aluno, new.data, true)
  on conflict (aluno_id, data) do update set estudou = true;

  return new;
end $$;

drop trigger if exists tg_registro_marca_dia on public.registros;
create trigger tg_registro_marca_dia after insert on public.registros
  for each row execute function public.f_registro_marca_dia();

-- ─────────────────────────────────────────────────────────────
--  3. FRASES DO DIA
--     Citações e versículos. Você pode acrescentar quantas quiser:
--     insert into public.frases (texto, autor, tipo) values ('...', '...', 'citacao');
-- ─────────────────────────────────────────────────────────────
create table if not exists public.frases (
  id         int generated always as identity primary key,
  texto      text not null,
  autor      text,
  referencia text,
  tipo       text not null default 'citacao',   -- citacao | versiculo
  ativa      boolean not null default true
);

alter table public.frases enable row level security;
grant select on public.frases to authenticated;

drop policy if exists p_frases_leitura on public.frases;
create policy p_frases_leitura on public.frases for select to authenticated
  using (ativa);

drop policy if exists p_frases_mentora on public.frases;
create policy p_frases_mentora on public.frases for all to authenticated
  using (public.f_eh_mentora()) with check (public.f_eh_mentora());
grant insert, update, delete on public.frases to authenticated;

insert into public.frases (texto, autor, tipo)
select * from (values
  ('A disciplina é a ponte entre metas e realizações.', 'Jim Rohn', 'citacao'),
  ('Não é a força, mas a constância dos bons resultados que conduz ao sucesso.', 'Nietzsche', 'citacao'),
  ('A sorte é o que acontece quando a preparação encontra a oportunidade.', 'Sêneca', 'citacao'),
  ('Começar já é metade de toda ação.', 'Provérbio grego', 'citacao'),
  ('Cai sete vezes, levanta oito.', 'Provérbio japonês', 'citacao'),
  ('A persistência realiza o impossível.', 'Provérbio chinês', 'citacao'),
  ('Aquele que move montanhas começa carregando pequenas pedras.', 'Confúcio', 'citacao'),
  ('Não espere por circunstâncias ideais. Comece de onde está.', 'Napoleon Hill', 'citacao'),
  ('O que você faz hoje pode melhorar todos os seus amanhãs.', 'Ralph Marston', 'citacao'),
  ('A educação é a arma mais poderosa para mudar o mundo.', 'Nelson Mandela', 'citacao'),
  ('Tudo parece impossível até que seja feito.', 'Nelson Mandela', 'citacao'),
  ('O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.', 'Winston Churchill', 'citacao'),
  ('Não conte os dias. Faça os dias contarem.', 'Muhammad Ali', 'citacao'),
  ('A mente que se abre a uma nova ideia jamais volta ao tamanho original.', 'Oliver Wendell Holmes', 'citacao'),
  ('Conhece-te a ti mesmo.', 'Sócrates', 'citacao'),
  ('Só sei que nada sei.', 'Sócrates', 'citacao'),
  ('Somos aquilo que repetidamente fazemos. A excelência é um hábito.', 'Aristóteles', 'citacao'),
  ('Nenhum vento é favorável a quem não sabe para onde vai.', 'Sêneca', 'citacao'),
  ('Não é porque é difícil que não ousamos: é porque não ousamos que é difícil.', 'Sêneca', 'citacao'),
  ('Enquanto adiamos, a vida passa.', 'Sêneca', 'citacao'),
  ('Se você conhece o inimigo e conhece a si mesmo, não tema o resultado de cem batalhas.', 'Sun Tzu', 'citacao'),
  ('O gênio é 1% de inspiração e 99% de transpiração.', 'Thomas Edison', 'citacao'),
  ('Não falhei. Encontrei modos que não funcionam.', 'Thomas Edison', 'citacao'),
  ('Um objetivo sem plano é apenas um desejo.', 'Antoine de Saint-Exupéry', 'citacao'),
  ('Nossa maior fraqueza é desistir. O caminho mais certo é tentar uma vez mais.', 'Thomas Edison', 'citacao'),
  ('A jornada de mil quilômetros começa com um passo.', 'Lao-Tsé', 'citacao'),
  ('Quem tem um porquê enfrenta quase todo como.', 'Viktor Frankl', 'citacao'),
  ('Entre o estímulo e a resposta existe um espaço: ali está a nossa liberdade.', 'Viktor Frankl', 'citacao'),
  ('A vida é 10% o que acontece e 90% como você reage.', 'Charles Swindoll', 'citacao'),
  ('Acredite que é possível e você já percorreu metade do caminho.', 'Theodore Roosevelt', 'citacao'),
  ('Faça o que pode, com o que tem, onde estiver.', 'Theodore Roosevelt', 'citacao'),
  ('Disciplina é escolher entre o que você quer agora e o que você mais quer.', 'Abraham Lincoln', 'citacao'),
  ('Dê-me seis horas para derrubar uma árvore e passarei as quatro primeiras afiando o machado.', 'Abraham Lincoln', 'citacao'),
  ('O futuro pertence a quem se prepara hoje.', 'Malcolm X', 'citacao'),
  ('A melhor maneira de prever o futuro é criá-lo.', 'Peter Drucker', 'citacao'),
  ('Ninguém pode fazer você se sentir inferior sem o seu consentimento.', 'Eleanor Roosevelt', 'citacao'),
  ('Tudo tem seu tempo, e tudo o que é vivo amadurece.', 'Machado de Assis', 'citacao'),
  ('Ensinar não é transferir conhecimento, mas criar as possibilidades para a sua produção.', 'Paulo Freire', 'citacao'),
  ('Ninguém educa ninguém, ninguém educa a si mesmo: os homens se educam entre si.', 'Paulo Freire', 'citacao'),
  ('O saber a gente aprende com os mestres e os livros. A sabedoria, com a vida.', 'Cora Coralina', 'citacao'),
  ('Feliz aquele que transfere o que sabe e aprende o que ensina.', 'Cora Coralina', 'citacao'),
  ('O correr da vida embrulha tudo; a vida é assim: esquenta e esfria, aperta e afrouxa.', 'Guimarães Rosa', 'citacao'),
  ('Vencer a si mesmo é a maior das vitórias.', 'Platão', 'citacao'),
  ('Águias não caçam moscas.', 'Provérbio latino', 'citacao'),
  ('Não pare quando estiver cansado. Pare quando tiver terminado.', 'Provérbio', 'citacao'),
  ('Os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.', 'Isaías 40:31', 'versiculo'),
  ('Posso todas as coisas naquele que me fortalece.', 'Filipenses 4:13', 'versiculo'),
  ('Entrega o teu caminho ao Senhor; confia nele, e ele o fará.', 'Salmos 37:5', 'versiculo'),
  ('Tudo quanto te vier à mão para fazer, faze-o conforme as tuas forças.', 'Eclesiastes 9:10', 'versiculo'),
  ('O Senhor é o meu pastor; nada me faltará.', 'Salmos 23:1', 'versiculo'),
  ('Sê forte e corajoso; não temas, nem te espantes.', 'Josué 1:9', 'versiculo'),
  ('Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', 'Salmos 119:105', 'versiculo'),
  ('A mão dos diligentes dominará.', 'Provérbios 12:24', 'versiculo'),
  ('Os planos do diligente tendem à abundância.', 'Provérbios 21:5', 'versiculo'),
  ('Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.', 'Provérbios 3:5', 'versiculo'),
  ('Não te deixes vencer do mal, mas vence o mal com o bem.', 'Romanos 12:21', 'versiculo'),
  ('Combati o bom combate, acabei a carreira, guardei a fé.', '2 Timóteo 4:7', 'versiculo'),
  ('Corramos com paciência a carreira que nos está proposta.', 'Hebreus 11:1 e 12:1', 'versiculo'),
  ('Não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.', 'Gálatas 6:9', 'versiculo'),
  ('Aquietai-vos e sabei que eu sou Deus.', 'Salmos 46:10', 'versiculo'),
  ('Ainda que a visão demore, espera-a, porque certamente virá.', 'Habacuque 2:3', 'versiculo'),
  ('O Senhor pelejará por vós, e vós vos calareis.', 'Êxodo 14:14', 'versiculo'),
  ('Tudo tem o seu tempo determinado debaixo do céu.', 'Eclesiastes 3:1', 'versiculo'),
  ('Em todo trabalho há proveito.', 'Provérbios 14:23', 'versiculo'),
  ('Ensina-nos a contar os nossos dias, de tal maneira que alcancemos corações sábios.', 'Salmos 90:12', 'versiculo'),
  ('Alegrai-vos na esperança, sede pacientes na tribulação.', 'Romanos 12:12', 'versiculo'),
  ('O coração do homem prudente adquire o conhecimento.', 'Provérbios 18:15', 'versiculo'),
  ('Aplica o teu coração ao ensino e os teus ouvidos às palavras do conhecimento.', 'Provérbios 23:12', 'versiculo'),
  ('Buscai primeiro o reino de Deus, e todas estas coisas vos serão acrescentadas.', 'Mateus 6:33', 'versiculo'),
  ('Bem-aventurado o homem que acha sabedoria.', 'Provérbios 3:13', 'versiculo'),
  ('Tudo posso, mas nem tudo me convém.', '1 Coríntios 10:23', 'versiculo')
) as novas(texto, autor, tipo)
where not exists (select 1 from public.frases);

-- Versículos na versão Almeida, de domínio público.

select count(*) as frases_cadastradas from public.frases;
