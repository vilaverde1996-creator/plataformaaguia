import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const Contexto = createContext(null);
const CHAVE_ESCOLHA = 'aguia:mentoria';

function ordenar(lista) {
  return [...(lista ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

function lembrar(id) {
  try { localStorage.setItem(CHAVE_ESCOLHA, id); } catch { /* navegação privada */ }
}

function lembrada() {
  try { return localStorage.getItem(CHAVE_ESCOLHA); } catch { return null; }
}

// Marca que o aluno entrou hoje e devolve os dias ativos recentes.
async function registrarPresenca() {
  const { data: usuario } = await supabase.auth.getUser();
  const id = usuario?.user?.id;
  if (!id) return [];

  const hoje = diaDeHoje();
  await supabase
    .from('dias_ativos')
    .upsert({ aluno_id: id, data: hoje }, { onConflict: 'aluno_id,data', ignoreDuplicates: true });

  const limite = new Date();
  limite.setDate(limite.getDate() - 200);

  const { data } = await supabase
    .from('dias_ativos')
    .select('data, estudou')
    .eq('aluno_id', id)
    .gte('data', limite.toISOString().slice(0, 10))
    .order('data', { ascending: false });

  const dias = data ?? [];
  if (!dias.some((d) => d.data === hoje)) dias.unshift({ data: hoje, estudou: false });
  return dias;
}

export function diaDeHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Quantos dias seguidos o aluno apareceu, contando de hoje para trás.
// Se ele ainda não entrou hoje, a sequência de ontem continua valendo.
export function calcularSequencia(dias, hoje = diaDeHoje()) {
  const conjunto = new Set((dias ?? []).map((d) => (typeof d === 'string' ? d : d.data)));
  if (conjunto.size === 0) return 0;

  const data = new Date(hoje + 'T12:00:00');
  if (!conjunto.has(hoje)) data.setDate(data.getDate() - 1);

  let total = 0;
  for (;;) {
    const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    if (!conjunto.has(iso)) break;
    total += 1;
    data.setDate(data.getDate() - 1);
  }
  return total;
}

export const NIVEIS = [
  { minimo: 0, nome: 'No ninho', icone: '🥚' },
  { minimo: 3, nome: 'Primeiro voo', icone: '🐣' },
  { minimo: 7, nome: 'Batendo asas', icone: '🪽' },
  { minimo: 14, nome: 'Planando alto', icone: '🦅' },
  { minimo: 30, nome: 'Olhar de águia', icone: '👁️' },
  { minimo: 60, nome: 'Senhora dos céus', icone: '👑' },
  { minimo: 100, nome: 'Lenda', icone: '🏆' },
];

export function nivelDaSequencia(sequencia) {
  let atual = NIVEIS[0];
  let proximo = null;
  for (const n of NIVEIS) {
    if (sequencia >= n.minimo) atual = n;
    else { proximo = n; break; }
  }
  return { ...atual, proximo, faltam: proximo ? proximo.minimo - sequencia : 0 };
}

// A frase é a mesma para todos no mesmo dia, e muda todo dia.
export function fraseDoDia(frases, hoje = diaDeHoje()) {
  if (!frases || frases.length === 0) return null;
  const dias = Math.floor(new Date(hoje + 'T12:00:00').getTime() / 86400000);
  return frases[dias % frases.length];
}

export function ProvedorDados({ children }) {
  const [mentorias, setMentorias] = useState([]);
  const [mentoriaId, setMentoriaId] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [plano, setPlano] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [revisoes, setRevisoes] = useState([]);
  const [frases, setFrases] = useState([]);
  const [diasAtivos, setDiasAtivos] = useState([]);
  const [cicloItens, setCicloItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const mentoria = mentorias.find((m) => m.id === mentoriaId) ?? null;

  // 1. Quais editais este aluno está seguindo
  useEffect(() => {
    let ativo = true;

    (async () => {
      const { data, error } = await supabase
        .from('mentorias')
        .select(
          'id, edital_id, plano_id, data_prova, cargo, recado, meta_horas, meta_questoes, ' +
          'meta_conclusao, meta_aprovamento, link_agendamento, editais(nome, orgao, banca, cargo)'
        )
        .eq('ativa', true);

      if (!ativo) return;
      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }

      registrarPresenca().then((dias) => { if (ativo) setDiasAtivos(dias); });

      supabase
        .from('frases')
        .select('id, texto, autor, referencia, tipo')
        .eq('ativa', true)
        .then(({ data: f }) => { if (ativo) setFrases(f ?? []); });

      const lista = (data ?? []).map((m) => ({ ...m, nomeEdital: m.editais?.nome ?? 'Edital' }));
      setMentorias(lista);

      if (lista.length === 0) {
        setCarregando(false);
        return;
      }

      const salva = lembrada();
      setMentoriaId((lista.find((m) => m.id === salva) ?? lista[0]).id);
    })();

    return () => { ativo = false; };
  }, []);

  // 2. Conteúdo do edital escolhido
  const carregarConteudo = useCallback(async (m) => {
    if (!m) return;
    setCarregando(true);
    setErro('');

    const [arvore, prog, secoes, regs, revs, ciclo] = await Promise.all([
      supabase
        .from('disciplinas')
        .select('id, nome, cor, ordem, grupos(id, nome, ordem, topicos(id, nome, ordem))')
        .eq('edital_id', m.edital_id),
      supabase
        .from('topico_progresso')
        .select('topico_id, concluido, concluido_em, acertos, erros, questoes')
        .eq('mentoria_id', m.id),
      m.plano_id
        ? supabase
            .from('plano_secoes')
            .select('id, secao, titulo, subtitulo, texto, icone, estilo, ordem')
            .eq('plano_id', m.plano_id)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('registros')
        .select('id, data, disciplina_id, topico_id, tipo, segundos, questoes, acertos, erros, obs, origem')
        .eq('mentoria_id', m.id)
        .order('data', { ascending: false })
        .limit(400),
      supabase
        .from('revisoes')
        .select('id, topico_id, data_estudo, data_revisao, dias, feita, feita_em')
        .eq('mentoria_id', m.id)
        .order('data_revisao', { ascending: true }),
      supabase
        .from('ciclo_itens')
        .select('disciplina_id, peso, ordem')
        .eq('edital_id', m.edital_id)
        .order('ordem', { ascending: true }),
    ]);

    const problema = arvore.error || prog.error || secoes.error || regs.error || revs.error;
    if (problema) setErro(problema.message);

    setDisciplinas(
      ordenar(arvore.data).map((d) => ({
        ...d,
        grupos: ordenar(d.grupos).map((g) => ({ ...g, topicos: ordenar(g.topicos) })),
      }))
    );

    const mapa = {};
    for (const linha of prog.data ?? []) mapa[linha.topico_id] = linha;
    setProgresso(mapa);

    setPlano(ordenar(secoes.data));
    setRegistros(regs.data ?? []);
    setRevisoes(revs.data ?? []);
    setCicloItens(ciclo.data ?? []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (mentoria) carregarConteudo(mentoria);
  }, [mentoria?.id, carregarConteudo]);

  const trocarMentoria = useCallback((id) => {
    setMentoriaId(id);
    lembrar(id);
  }, []);

  // Marca ou desmarca um tópico. A tela muda na hora e o banco é
  // atualizado em seguida; se falhar, o estado anterior volta.
  const marcarTopico = useCallback(async (topicoId, concluido) => {
    if (!mentoria) return;
    const anterior = progresso[topicoId];

    setProgresso((atual) => ({
      ...atual,
      [topicoId]: {
        ...(anterior ?? { topico_id: topicoId, acertos: 0, erros: 0, questoes: 0 }),
        concluido,
      },
    }));

    const { error } = await supabase
      .from('topico_progresso')
      .upsert(
        { mentoria_id: mentoria.id, topico_id: topicoId, concluido },
        { onConflict: 'mentoria_id,topico_id' }
      );

    if (error) {
      setErro('Não foi possível salvar: ' + error.message);
      setProgresso((atual) => ({ ...atual, [topicoId]: anterior }));
    }
  }, [mentoria, progresso]);


  // ── Registros de estudo ────────────────────────────────────────
  const adicionarRegistro = useCallback(async (dados) => {
    if (!mentoria) return { erro: 'Nenhum edital selecionado.' };

    const linha = {
      mentoria_id: mentoria.id,
      data: dados.data,
      disciplina_id: dados.disciplina_id || null,
      topico_id: dados.topico_id || null,
      tipo: dados.tipo || null,
      segundos: Math.max(0, Math.round(dados.segundos || 0)),
      questoes: Math.max(0, dados.questoes || 0),
      acertos: Math.max(0, dados.acertos || 0),
      erros: Math.max(0, dados.erros || 0),
      obs: dados.obs || null,
      origem: dados.origem || 'manual',
    };

    const { data, error } = await supabase
      .from('registros')
      .insert(linha)
      .select('id, data, disciplina_id, topico_id, tipo, segundos, questoes, acertos, erros, obs, origem')
      .single();

    if (error) {
      setErro('Não foi possível salvar o estudo: ' + error.message);
      return { erro: error.message };
    }

    setRegistros((atual) => [data, ...atual]);
    return { ok: true, registro: data };
  }, [mentoria]);

  const excluirRegistro = useCallback(async (id) => {
    const antes = registros;
    setRegistros((atual) => atual.filter((r) => r.id !== id));

    const { error } = await supabase.from('registros').delete().eq('id', id);
    if (error) {
      setErro('Não foi possível excluir: ' + error.message);
      setRegistros(antes);
    }
  }, [registros]);

  // Soma, por tópico, o que veio das questões da plataforma
  // (topico_progresso) com o que o aluno anotou à mão (registros).
  const estatisticasTopico = (() => {
    const mapa = {};
    const pegar = (id) =>
      (mapa[id] ??= { acertos: 0, erros: 0, questoes: 0, segundos: 0, concluido: false });

    for (const [id, p] of Object.entries(progresso)) {
      const e = pegar(id);
      e.acertos += p.acertos ?? 0;
      e.erros += p.erros ?? 0;
      e.questoes += p.questoes ?? 0;
      e.concluido = !!p.concluido;
    }

    for (const r of registros) {
      if (!r.topico_id) continue;
      const e = pegar(r.topico_id);
      e.acertos += r.acertos ?? 0;
      e.erros += r.erros ?? 0;
      e.questoes += r.questoes ?? 0;
      e.segundos += r.segundos ?? 0;
    }

    return mapa;
  })();

  const totalSegundos = registros.reduce((s, r) => s + (r.segundos ?? 0), 0);


  // ── Revisões espaçadas ─────────────────────────────────────────
  const agendarRevisoes = useCallback(async (topicoId, dataEstudo, dias = [7, 15, 30]) => {
    if (!mentoria || !topicoId) return;

    const novas = dias
      .map((d) => {
        const data = new Date(dataEstudo + 'T12:00:00');
        data.setDate(data.getDate() + d);
        const iso = data.toISOString().slice(0, 10);
        return { mentoria_id: mentoria.id, topico_id: topicoId, data_estudo: dataEstudo,
                 data_revisao: iso, dias: d, feita: false };
      })
      .filter((nova) => !revisoes.some(
        (r) => r.topico_id === nova.topico_id && r.data_revisao === nova.data_revisao && !r.feita
      ));

    if (novas.length === 0) return;

    const { data, error } = await supabase
      .from('revisoes')
      .insert(novas)
      .select('id, topico_id, data_estudo, data_revisao, dias, feita, feita_em');

    if (error) { setErro('Não foi possível agendar as revisões: ' + error.message); return; }
    setRevisoes((atual) => [...atual, ...(data ?? [])].sort(
      (a, b) => (a.data_revisao < b.data_revisao ? -1 : 1)
    ));
  }, [mentoria, revisoes]);

  const alternarRevisao = useCallback(async (id, feita) => {
    const antes = revisoes;
    setRevisoes((atual) => atual.map(
      (r) => (r.id === id ? { ...r, feita, feita_em: feita ? new Date().toISOString() : null } : r)
    ));

    const { error } = await supabase
      .from('revisoes')
      .update({ feita, feita_em: feita ? new Date().toISOString() : null })
      .eq('id', id);

    if (error) { setErro('Não foi possível salvar a revisão: ' + error.message); setRevisoes(antes); }
  }, [revisoes]);

  const excluirRevisao = useCallback(async (id) => {
    const antes = revisoes;
    setRevisoes((atual) => atual.filter((r) => r.id !== id));
    const { error } = await supabase.from('revisoes').delete().eq('id', id);
    if (error) { setErro('Não foi possível excluir: ' + error.message); setRevisoes(antes); }
  }, [revisoes]);


  // ── Ciclos ─────────────────────────────────────────────────────
  // A fila só anda aqui: ao concluir (ou pular) um ciclo.
  const avancarCiclo = useCallback(async ({ posicao, disciplinaId, topicoId, pulado }) => {
    if (!mentoria) return;
    const proxima = posicao + 1;

    setMentorias((atual) =>
      atual.map((m) => (m.id === mentoria.id ? { ...m, ciclo_posicao: proxima } : m))
    );

    const [{ error: erroPosicao }, { error: erroHistorico }] = await Promise.all([
      supabase.from('mentorias').update({ ciclo_posicao: proxima }).eq('id', mentoria.id),
      supabase.from('ciclo_execucoes').insert({
        mentoria_id: mentoria.id,
        posicao,
        disciplina_id: disciplinaId ?? null,
        topico_id: topicoId ?? null,
        pulado: !!pulado,
      }),
    ]);

    const problema = erroPosicao || erroHistorico;
    if (problema) {
      setErro('Não foi possível avançar o ciclo: ' + problema.message);
      setMentorias((atual) =>
        atual.map((m) => (m.id === mentoria.id ? { ...m, ciclo_posicao: posicao } : m))
      );
    }
  }, [mentoria]);

  const concluirCiclo = useCallback(async (ciclo, { agendarRevisao = true } = {}) => {
    if (!ciclo) return;
    await marcarTopico(ciclo.topico.id, true);
    if (agendarRevisao) await agendarRevisoes(ciclo.topico.id, diaDeHoje(), [7, 15, 30]);
    await avancarCiclo({
      posicao: ciclo.posicao,
      disciplinaId: ciclo.disciplina?.id,
      topicoId: ciclo.topico.id,
    });
  }, [marcarTopico, agendarRevisoes, avancarCiclo]);

  const pularCiclo = useCallback(async (ciclo) => {
    if (!ciclo) return;
    await avancarCiclo({
      posicao: ciclo.posicao,
      disciplinaId: ciclo.disciplina?.id,
      topicoId: ciclo.topico?.id,
      pulado: true,
    });
  }, [avancarCiclo]);

  const voltarCiclo = useCallback(async () => {
    const posicao = Math.max(0, (mentoria?.ciclo_posicao ?? 0) - 1);
    setMentorias((atual) =>
      atual.map((m) => (m.id === mentoria.id ? { ...m, ciclo_posicao: posicao } : m))
    );
    await supabase.from('mentorias').update({ ciclo_posicao: posicao }).eq('id', mentoria.id);
  }, [mentoria]);

  const totais = (() => {
    let total = 0;
    let concluidos = 0;
    for (const d of disciplinas) {
      for (const g of d.grupos) {
        for (const t of g.topicos) {
          total += 1;
          if (progresso[t.id]?.concluido) concluidos += 1;
        }
      }
    }
    return { total, concluidos, pct: total ? Math.round((concluidos / total) * 100) : 0 };
  })();

  return (
    <Contexto.Provider
      value={{
        mentorias, mentoria, trocarMentoria,
        disciplinas, progresso, plano, totais,
        registros, adicionarRegistro, excluirRegistro,
        revisoes, agendarRevisoes, alternarRevisao, excluirRevisao,
        frases, diasAtivos, cicloItens,
        concluirCiclo, pularCiclo, voltarCiclo,
        sequencia: calcularSequencia(diasAtivos),
        frase: fraseDoDia(frases),
        estatisticasTopico, totalSegundos,
        carregando, erro, marcarTopico,
        recarregar: () => carregarConteudo(mentoria),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useDados() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useDados precisa estar dentro de ProvedorDados');
  return valor;
}

// Conta os tópicos de uma disciplina e quantos estão concluídos.
export function contarDisciplina(disciplina, progresso) {
  let total = 0;
  let concluidos = 0;
  for (const g of disciplina.grupos) {
    for (const t of g.topicos) {
      total += 1;
      if (progresso[t.id]?.concluido) concluidos += 1;
    }
  }
  return { total, concluidos, pct: total ? Math.round((concluidos / total) * 100) : 0 };
}
