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

export function ProvedorDados({ children }) {
  const [mentorias, setMentorias] = useState([]);
  const [mentoriaId, setMentoriaId] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [plano, setPlano] = useState([]);
  const [registros, setRegistros] = useState([]);
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
          'meta_conclusao, meta_aprovamento, editais(nome, orgao, banca, cargo)'
        )
        .eq('ativa', true);

      if (!ativo) return;
      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }

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

    const [arvore, prog, secoes, regs] = await Promise.all([
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
    ]);

    const problema = arvore.error || prog.error || secoes.error || regs.error;
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
