// Cronograma em ciclos.
//
// A fila é montada a partir dos pesos que a mentora define por edital.
// Peso 2 = a disciplina aparece duas vezes por volta. Peso 0 = fora.
// A fila não tem data: ela só anda quando o aluno conclui um ciclo.

// Distribui os pesos de forma espalhada, em vez de repetir a mesma
// disciplina duas vezes seguidas. A volta começa pela ordem que a
// mentora definiu, e as repetições dos pesos maiores vêm depois.
// Ex: Legislação 2, Português 1, Matemática 1
//     → Legislação, Português, Matemática, Legislação
export function gerarSequencia(itens) {
  const marcas = [];

  (itens ?? []).forEach((item, indice) => {
    const peso = Number(item.peso ?? 1);
    if (!Number.isFinite(peso) || peso <= 0) return;
    for (let k = 0; k < peso; k++) {
      marcas.push({
        disciplina_id: item.disciplina_id,
        posicao: k / peso,
        desempate: item.ordem ?? indice,
      });
    }
  });

  marcas.sort((a, b) => a.posicao - b.posicao || a.desempate - b.desempate);
  return marcas.map((m) => m.disciplina_id);
}

function topicosPendentes(disciplina, progresso, consumidos) {
  if (!disciplina) return [];
  const lista = [];
  for (const g of disciplina.grupos ?? []) {
    for (const t of g.topicos ?? []) {
      if (progresso[t.id]?.concluido) continue;
      if (consumidos?.has(t.id)) continue;
      lista.push({ ...t, grupo: g.nome });
    }
  }
  return lista;
}

// Qual é o ciclo de agora. Disciplinas já 100% concluídas são puladas
// sozinhas, para o aluno nunca ficar travado numa fila sem conteúdo.
export function cicloEm(sequencia, posicao, disciplinas, progresso, consumidos = new Set()) {
  if (!sequencia || sequencia.length === 0) return null;

  const mapa = new Map(disciplinas.map((d) => [d.id, d]));

  for (let salto = 0; salto < sequencia.length; salto++) {
    const indice = (posicao + salto) % sequencia.length;
    const disciplina = mapa.get(sequencia[indice]);
    const pendentes = topicosPendentes(disciplina, progresso, consumidos);

    if (pendentes.length > 0) {
      return {
        posicao: posicao + salto,
        indice,
        disciplina,
        topico: pendentes[0],
        alternativas: pendentes.slice(0, 12),
        restantes: pendentes.length,
        puladas: salto,
        volta: Math.floor((posicao + salto) / sequencia.length) + 1,
      };
    }
  }

  return null; // todo o edital concluído
}

// Os próximos ciclos, para o aluno ver o que vem pela frente.
export function proximosCiclos(sequencia, posicao, disciplinas, progresso, quantidade = 5) {
  const lista = [];
  const consumidos = new Set();
  let atual = posicao;

  for (let i = 0; i < quantidade; i++) {
    const ciclo = cicloEm(sequencia, atual, disciplinas, progresso, consumidos);
    if (!ciclo) break;
    consumidos.add(ciclo.topico.id);
    lista.push(ciclo);
    atual = ciclo.posicao + 1;
  }

  return lista;
}

// Quantos ciclos faltam para terminar o edital (1 ciclo = 1 tópico).
export function ciclosRestantes(disciplinas, progresso, sequencia) {
  const ativas = new Set(sequencia ?? []);
  let total = 0;
  for (const d of disciplinas) {
    if (ativas.size > 0 && !ativas.has(d.id)) continue;
    for (const g of d.grupos ?? []) {
      for (const t of g.topicos ?? []) {
        if (!progresso[t.id]?.concluido) total += 1;
      }
    }
  }
  return total;
}
