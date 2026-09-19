// Apoio do módulo de questões: filtros e sorteio.
// Fica separado da tela para poder ser testado sozinho.

export function embaralhar(lista, aleatorio = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export const SITUACOES = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'nao_respondidas', rotulo: 'Inéditas' },
  { id: 'erradas', rotulo: 'Que errei' },
  { id: 'marcadas', rotulo: 'Marcadas' },
];

// Resume o histórico de respostas por questão: se já respondeu e se
// a última resposta foi certa.
export function historicoPorQuestao(respostas) {
  const mapa = new Map();
  for (const r of respostas ?? []) {
    const atual = mapa.get(r.questao_id);
    if (!atual || new Date(r.respondida_em) > new Date(atual.respondida_em)) {
      mapa.set(r.questao_id, r);
    }
  }
  return mapa;
}

export function filtrarQuestoes(questoes, filtros, historico, marcadas) {
  const {
    disciplina_id = '', topico_id = '', banca = '', ano = '',
    dificuldade = '', situacao = 'todas',
  } = filtros ?? {};

  return (questoes ?? []).filter((q) => {
    if (disciplina_id && q.disciplina_id !== disciplina_id) return false;
    if (topico_id && q.topico_id !== topico_id) return false;
    if (banca && (q.banca ?? '') !== banca) return false;
    if (ano && String(q.ano ?? '') !== String(ano)) return false;
    if (dificuldade && q.dificuldade !== dificuldade) return false;

    const resposta = historico?.get(q.id);
    if (situacao === 'nao_respondidas' && resposta) return false;
    if (situacao === 'erradas' && (!resposta || resposta.correta)) return false;
    if (situacao === 'marcadas' && !marcadas?.has(q.id)) return false;

    return true;
  });
}

// Opções que realmente existem nas questões carregadas, para os
// filtros não oferecerem uma banca ou um ano sem nenhuma questão.
export function opcoesDisponiveis(questoes) {
  const bancas = new Set();
  const anos = new Set();
  for (const q of questoes ?? []) {
    if (q.banca) bancas.add(q.banca);
    if (q.ano) anos.add(q.ano);
  }
  return {
    bancas: [...bancas].sort(),
    anos: [...anos].sort((a, b) => b - a),
  };
}

export function resumoSessao(respondidas) {
  const total = respondidas.length;
  const acertos = respondidas.filter((r) => r.correta).length;
  return {
    total,
    acertos,
    erros: total - acertos,
    pct: total ? Math.round((acertos / total) * 100) : null,
  };
}
