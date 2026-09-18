# Plataforma Método Águia

Site da mentoria. O banco de dados e o login ficam no Supabase; o site fica
hospedado na Cloudflare Pages.

Nesta primeira versão funcionam: entrar com e-mail e senha, recuperar senha,
painel da mentora com todos os alunos e tela inicial do aluno.

**Você não precisa instalar nada no computador.** A Cloudflare monta o site
sozinha a partir dos arquivos que você envia para o GitHub.

---

## Antes de começar

No Supabase, confirme que já fez:

- SQL Editor: rodou os arquivos `sql/01`, `sql/02` e `sql/03`.
- Authentication → Sign In / Providers → Email: desligou
  **Allow new users to sign up**.
- Authentication → Users → Add user: criou o seu usuário e o de cada aluno,
  marcando *Auto Confirm User*.
- SQL Editor: rodou o `sql/04_configuracao_inicial.sql` com os e-mails reais.

---

## Passo 1 — Colocar os arquivos no GitHub

1. Entre em https://github.com e clique em **New** (botão verde) para criar um
   repositório.
2. Nome: `plataforma-aguia`. Marque **Private**. Clique em **Create repository**.
3. Na página que abrir, clique no link **uploading an existing file**.
4. Abra a pasta `plataforma-aguia` que você extraiu do arquivo .zip, selecione
   tudo o que está **dentro** dela (Ctrl+A) e arraste para a área de envio do
   GitHub. As subpastas `src` e `sql` vão junto.
5. Clique em **Commit changes**.

## Passo 2 — Pegar as chaves do Supabase

No Supabase, vá em **Project Settings → API** e deixe esta página aberta.
Você vai copiar dois valores:

- **Project URL** (algo como `https://abcdefgh.supabase.co`)
- **anon public** (uma chave longa)

A chave *anon public* pode ficar no site sem risco: ela só funciona dentro das
regras de acesso do banco. A chave **service_role nunca deve ser usada aqui**.

## Passo 3 — Publicar na Cloudflare

1. Crie uma conta gratuita em https://dash.cloudflare.com
2. No menu lateral, abra **Workers & Pages**.
3. Clique em **Create application → Pages → Connect to Git**.
4. Autorize o acesso ao GitHub e escolha o repositório `plataforma-aguia`.
5. Nas configurações de build, preencha:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Em **Environment variables**, clique em *Add variable* duas vezes:
   - `VITE_SUPABASE_URL` → cole o Project URL
   - `VITE_SUPABASE_ANON_KEY` → cole a chave anon public
7. Clique em **Save and Deploy** e espere de 1 a 3 minutos.

No fim aparece um endereço como `plataforma-aguia.pages.dev`. Esse é o seu site.

## Passo 4 — Avisar o Supabase qual é o endereço

No Supabase, em **Authentication → URL Configuration**, coloque o endereço do
site em *Site URL* e salve. Sem isso, o link de recuperação de senha não
funciona.

## Passo 5 — Testar

Abra o endereço do site e entre com o seu e-mail: deve aparecer o painel com a
lista de alunos. Entre com o e-mail do aluno (em uma janela anônima, para não
misturar): deve aparecer a tela dele, com dias para a prova e o % do edital.

---

## Como atualizar o site depois

Quando houver arquivos novos, abra o repositório no GitHub, clique em
**Add file → Upload files**, arraste os arquivos e confirme. A Cloudflare
publica a nova versão sozinha em poucos minutos.

---

## Estrutura das pastas

```
src/
  lib/supabase.js      conexão com o banco
  lib/sessao.jsx       quem está logado e qual o papel
  telas/Entrar.jsx     login e recuperação de senha
  telas/NovaSenha.jsx
  telas/PainelMentora.jsx
  telas/InicioAluno.jsx
  App.jsx              decide qual tela mostrar
  estilos.css          identidade visual
sql/                   estrutura do banco (já rodada no Supabase)
```

## O que vem a seguir

1. Módulo Mentoria completo: cronômetro, edital marcável, registro de questões,
   revisões e estatísticas.
2. Importação do progresso que os alunos já têm no arquivo antigo.
3. Módulo Questões.
4. Módulo Conteúdos em PDF.
