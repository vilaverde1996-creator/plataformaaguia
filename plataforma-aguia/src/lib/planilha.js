// Leitura de planilhas em texto (CSV/TSV) e preparo das questões
// para importação. Sem bibliotecas externas: o arquivo vem do Excel,
// do Google Planilhas ou colado direto na tela.

export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function detectarSeparador(primeiraLinha) {
  const candidatos = [';', ',', '\t'];
  let melhor = ';';
  let mais = -1;
  for (const c of candidatos) {
    const quantidade = primeiraLinha.split(c).length;
    if (quantidade > mais) { mais = quantidade; melhor = c; }
  }
  return melhor;
}

// Lê o texto respeitando aspas: um campo entre aspas pode conter
// o separador e quebras de linha, como o Excel exporta.
export function lerCSV(texto) {
  const limpo = String(texto ?? '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').trim();
  if (!limpo) return { cabecalho: [], linhas: [] };

  const sep = detectarSeparador(limpo.split('\n')[0]);
  const linhas = [];
  let campo = '';
  let atual = [];
  let dentroDeAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];

    if (dentroDeAspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') { campo += '"'; i++; }
        else dentroDeAspas = false;
      } else campo += c;
      continue;
    }

    if (c === '"') { dentroDeAspas = true; continue; }
    if (c === sep) { atual.push(campo.trim()); campo = ''; continue; }
    if (c === '\n') { atual.push(campo.trim()); linhas.push(atual); atual = []; campo = ''; continue; }
    campo += c;
  }
  atual.push(campo.trim());
  linhas.push(atual);

  const cabecalho = (linhas.shift() ?? []).map((c) => normalizar(c));
  const uteis = linhas.filter((l) => l.some((c) => c !== ''));

  return {
    cabecalho,
    linhas: uteis.map((valores) => {
      const objeto = {};
      cabecalho.forEach((nome, i) => { objeto[nome] = valores[i] ?? ''; });
      return objeto;
    }),
  };
}

export const COLUNAS_QUESTOES = [
  'disciplina', 'topico', 'enunciado', 'a', 'b', 'c', 'd', 'e',
  'gabarito', 'comentario', 'banca', 'orgao', 'ano', 'dificuldade',
];

const DIFICULDADES = { facil: 'facil', media: 'media', dificil: 'dificil',
                       médio: 'media', medio: 'media' };

// Monta o índice de nomes → identificadores do edital escolhido.
export function indexarEdital(disciplinas) {
  const porDisciplina = new Map();
  const porTopico = new Map();

  for (const d of disciplinas) {
    porDisciplina.set(normalizar(d.nome), d.id);
    for (const g of d.grupos ?? []) {
      for (const t of g.topicos ?? []) {
        porTopico.set(`${normalizar(d.nome)}|${normalizar(t.nome)}`, t.id);
        if (!porTopico.has(normalizar(t.nome))) porTopico.set(normalizar(t.nome), t.id);
      }
    }
  }
  return { porDisciplina, porTopico };
}

// Transforma as linhas da planilha em questões prontas para o banco,
// apontando linha a linha o que está faltando.
export function prepararQuestoes(linhas, indice, editalId) {
  const prontas = [];
  const problemas = [];
  const avisos = [];

  linhas.forEach((linha, i) => {
    const numero = i + 2; // +1 do cabeçalho, +1 porque planilha começa em 1
    const enunciado = linha.enunciado;
    if (!enunciado) {
      problemas.push({ linha: numero, erro: 'sem enunciado' });
      return;
    }

    const gabarito = normalizar(linha.gabarito).toUpperCase();
    const alternativas = [];

    const certoErrado = !linha.b && ['C', 'E', 'CERTO', 'ERRADO'].includes(gabarito);
    if (certoErrado) {
      const certa = gabarito.startsWith('C');
      alternativas.push({ letra: 'C', texto: 'Certo', correta: certa });
      alternativas.push({ letra: 'E', texto: 'Errado', correta: !certa });
    } else {
      for (const letra of ['a', 'b', 'c', 'd', 'e']) {
        const texto = linha[letra];
        if (!texto) continue;
        alternativas.push({
          letra: letra.toUpperCase(),
          texto,
          correta: gabarito === letra.toUpperCase(),
        });
      }
    }

    if (alternativas.length < 2) {
      problemas.push({ linha: numero, erro: 'precisa de pelo menos duas alternativas' });
      return;
    }
    if (!alternativas.some((a) => a.correta)) {
      problemas.push({ linha: numero, erro: `gabarito "${linha.gabarito}" não corresponde a nenhuma alternativa` });
      return;
    }

    const chaveDisc = normalizar(linha.disciplina);
    const disciplinaId = indice.porDisciplina.get(chaveDisc) ?? null;
    if (linha.disciplina && !disciplinaId) {
      avisos.push({ linha: numero, aviso: `disciplina "${linha.disciplina}" não existe neste edital` });
    }

    const chaveTopico = normalizar(linha.topico);
    const topicoId = chaveTopico
      ? indice.porTopico.get(`${chaveDisc}|${chaveTopico}`) ?? indice.porTopico.get(chaveTopico) ?? null
      : null;
    if (linha.topico && !topicoId) {
      avisos.push({ linha: numero, aviso: `tópico "${linha.topico}" não encontrado; a questão entra sem tópico` });
    }

    prontas.push({
      edital_id: editalId,
      disciplina_id: disciplinaId,
      topico_id: topicoId,
      tipo: certoErrado ? 'certo_errado' : 'multipla_escolha',
      enunciado,
      comentario: linha.comentario || null,
      banca: linha.banca || null,
      orgao: linha.orgao || null,
      ano: linha.ano ? Number(String(linha.ano).replace(/\D/g, '')) || null : null,
      dificuldade: DIFICULDADES[normalizar(linha.dificuldade)] ?? null,
      ativa: true,
      alternativas,
    });
  });

  return { prontas, problemas, avisos };
}

export const MODELO_EDITAL = `# LÍNGUA PORTUGUESA
## Compreensão e Interpretação de Texto
1. Ideias principais e secundárias
2. Inferências e pressupostos
## Sintaxe
1. Regência verbal e nominal
2. Concordância verbal e nominal

# RACIOCÍNIO LÓGICO
- Proposições e conectivos
- Sequências numéricas

# LEGISLAÇÃO
## Lei nº 13.303/2016
- Disposições gerais
- Licitações e contratos

Como preencher:
  #  uma cerquilha  = disciplina
  ## duas cerquilhas = grupo dentro da disciplina (opcional)
  As demais linhas são os tópicos.
  Numeração (1., 1.2, a), traços e marcadores são removidos sozinhos.
  Apague este bloco de instruções antes de importar.
`;

export const MODELO_QUESTOES =
  'disciplina;topico;enunciado;a;b;c;d;e;gabarito;comentario;banca;orgao;ano;dificuldade\n' +
  'LÍNGUA PORTUGUESA;Regência verbal e nominal;"Assinale a alternativa correta quanto à regência:";' +
  '"Assisti o filme ontem.";"Assisti ao filme ontem.";"Obedeci o regulamento.";"Cheguei na escola cedo.";;' +
  'B;"O verbo assistir, no sentido de ver, exige a preposição a.";Cesgranrio;Transpetro;2023;media\n' +
  'RACIOCÍNIO LÓGICO;Proposições e conectivos;"A negação de \'\'todo aluno estuda\'\' é:";' +
  '"Nenhum aluno estuda.";"Algum aluno não estuda.";"Todo aluno não estuda.";"Poucos alunos estudam.";;' +
  'B;"A negação de um quantificador universal é existencial.";FGV;;2024;facil\n' +
  'LEGISLAÇÃO;Disposições gerais;"A estatal pode contratar sem licitação em qualquer hipótese.";;;;;;' +
  'E;"Item errado: as hipóteses são taxativas na Lei 13.303/2016.";Cesgranrio;;2023;media\n';
