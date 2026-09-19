import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useDados } from '../lib/dados.jsx';
import {
  embaralhar, filtrarQuestoes, historicoPorQuestao, opcoesDisponiveis,
  resumoSessao, SITUACOES,
} from '../lib/questoes.js';

const DIFICULDADES = [
  { id: '', rotulo: 'Qualquer nível' },
  { id: 'facil', rotulo: 'Fácil' },
  { id: 'media', rotulo: 'Média' },
  { id: 'dificil', rotulo: 'Difícil' },
];

export default function Questoes() {
  const { mentoria, disciplinas, aplicarResposta } = useDados();

  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState([]);
  const [marcadas, setMarcadas] = useState(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtros, setFiltros] = useState({
    disciplina_id: '', topico_id: '', banca: '', ano: '', dificuldade: '', situacao: 'todas',
  });

  const [fila, setFila] = useState([]);
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [respondendo, setRespondendo] = useState(false);
  const [sessao, setSessao] = useState([]);

  useEffect(() => {
    if (!mentoria) return;
    let ativo = true;

    (async () => {
      setCarregando(true);
      const [q, r, m] = await Promise.all([
        supabase
          .from('questoes')
          .select('id, enunciado, tipo, banca, orgao, ano, dificuldade, disciplina_id, topico_id, imagem_url, alternativas(id, letra, texto, ordem)')
          .eq('ativa', true)
          .or(`edital_id.eq.${mentoria.edital_id},edital_id.is.null`)
          .limit(500),
        supabase
          .from('respostas')
          .select('questao_id, correta, respondida_em')
          .eq('mentoria_id', mentoria.id),
        supabase
          .from('questoes_marcadas')
          .select('questao_id')
          .eq('mentoria_id', mentoria.id),
      ]);

      if (!ativo) return;
      const problema = q.error || r.error || m.error;
      if (problema) setErro(problema.message);

      setQuestoes(q.data ?? []);
      setRespostas(r.data ?? []);
      setMarcadas(new Set((m.data ?? []).map((x) => x.questao_id)));
      setCarregando(false);
    })();

    return () => { ativo = false; };
  }, [mentoria?.id]);

  const historico = useMemo(() => historicoPorQuestao(respostas), [respostas]);
  const opcoes = useMemo(() => opcoesDisponiveis(questoes), [questoes]);
  const disponiveis = useMemo(
    () => filtrarQuestoes(questoes, filtros, historico, marcadas),
    [questoes, filtros, historico, marcadas]
  );

  const topicos = useMemo(() => {
    const d = disciplinas.find((x) => x.id === filtros.disciplina_id);
    return d ? d.grupos.flatMap((g) => g.topicos) : [];
  }, [disciplinas, filtros.disciplina_id]);

  const nomes = useMemo(() => {
    const mapa = {};
    for (const d of disciplinas) {
      mapa[d.id] = d.nome;
      for (const g of d.grupos) for (const t of g.topicos) mapa[t.id] = t.nome;
    }
    return mapa;
  }, [disciplinas]);

  const atual = fila[indice] ?? null;

  function comecar() {
    setFila(embaralhar(disponiveis));
    setIndice(0);
    setEscolha(null);
    setResultado(null);
    setSessao([]);
  }

  async function responder() {
    if (!escolha || !atual) return;
    setRespondendo(true);

    const { data, error } = await supabase.rpc('responder_questao', {
      p_mentoria: mentoria.id,
      p_questao: atual.id,
      p_alternativa: escolha,
      p_segundos: null,
    });

    setRespondendo(false);
    if (error) { setErro(error.message); return; }

    setResultado(data);
    setSessao((s) => [...s, { questao_id: atual.id, correta: data.correta }]);
    setRespostas((r) => [
      ...r,
      { questao_id: atual.id, correta: data.correta, respondida_em: new Date().toISOString() },
    ]);
    if (atual.topico_id) aplicarResposta(atual.topico_id, data.correta);
  }

  function proxima() {
    setEscolha(null);
    setResultado(null);
    setIndice((i) => i + 1);
  }

  async function alternarMarcada() {
    if (!atual) return;
    const marcada = marcadas.has(atual.id);
    const novo = new Set(marcadas);

    if (marcada) {
      novo.delete(atual.id);
      await supabase.from('questoes_marcadas').delete()
        .eq('mentoria_id', mentoria.id).eq('questao_id', atual.id);
    } else {
      novo.add(atual.id);
      await supabase.from('questoes_marcadas')
        .insert({ mentoria_id: mentoria.id, questao_id: atual.id });
    }
    setMarcadas(novo);
  }

  if (carregando) return <div className="pagina">Carregando questões…</div>;

  if (questoes.length === 0) {
    return (
      <div className="pagina">
        <h1>Questões</h1>
        <p className="vazio">
          Ainda não há questões cadastradas para este edital. Sua mentora publica elas pela
          tela de importação.
        </p>
        {erro && <div className="aviso aviso-erro">{erro}</div>}
      </div>
    );
  }

  const placar = resumoSessao(sessao);

  return (
    <div className="pagina">
      <div className="painel-cabecalho">
        <div>
          <h1>Questões</h1>
          <p className="subtitulo" style={{ margin: 0 }}>
            {disponiveis.length} questões disponíveis com os filtros atuais
          </p>
        </div>
        {placar.total > 0 && (
          <div className="contagem">
            <b>{placar.acertos}/{placar.total}</b>
            <span>nesta sessão{placar.pct !== null ? ` · ${placar.pct}%` : ''}</span>
          </div>
        )}
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {!atual && (
        <div className="cartao">
          <h2>Montar o treino</h2>

          <div className="filtros-questoes">
            {SITUACOES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${filtros.situacao === s.id ? 'chip-ativo' : ''}`}
                onClick={() => setFiltros({ ...filtros, situacao: s.id })}
              >
                {s.rotulo}
              </button>
            ))}
          </div>

          <label>Disciplina</label>
          <select
            value={filtros.disciplina_id}
            onChange={(e) => setFiltros({ ...filtros, disciplina_id: e.target.value, topico_id: '' })}
          >
            <option value="">Todas</option>
            {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>

          {topicos.length > 0 && (
            <>
              <label>Tópico</label>
              <select
                value={filtros.topico_id}
                onChange={(e) => setFiltros({ ...filtros, topico_id: e.target.value })}
              >
                <option value="">Todos</option>
                {topicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </>
          )}

          <div className="linha-campos">
            <span>
              <label>Banca</label>
              <select value={filtros.banca} onChange={(e) => setFiltros({ ...filtros, banca: e.target.value })}>
                <option value="">Todas</option>
                {opcoes.bancas.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </span>
            <span>
              <label>Ano</label>
              <select value={filtros.ano} onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}>
                <option value="">Todos</option>
                {opcoes.anos.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </span>
            <span>
              <label>Dificuldade</label>
              <select
                value={filtros.dificuldade}
                onChange={(e) => setFiltros({ ...filtros, dificuldade: e.target.value })}
              >
                {DIFICULDADES.map((d) => <option key={d.id} value={d.id}>{d.rotulo}</option>)}
              </select>
            </span>
          </div>

          <button
            className="botao botao-destaque"
            type="button"
            disabled={disponiveis.length === 0}
            onClick={comecar}
          >
            {disponiveis.length === 0
              ? 'Nenhuma questão com esses filtros'
              : `Começar com ${disponiveis.length} questões`}
          </button>

          {placar.total > 0 && (
            <p className="previa" style={{ marginTop: 14 }}>
              Sessão anterior: {placar.acertos} acertos em {placar.total} questões ({placar.pct}%).
            </p>
          )}
        </div>
      )}

      {atual && (
        <div className="cartao questao">
          <div className="questao-topo">
            <span>
              {nomes[atual.disciplina_id] ?? 'Sem disciplina'}
              {atual.topico_id && ` · ${nomes[atual.topico_id]}`}
            </span>
            <span>
              {[atual.banca, atual.orgao, atual.ano].filter(Boolean).join(' · ')}
            </span>
          </div>

          <p className="questao-enunciado">{atual.enunciado}</p>

          {atual.imagem_url && <img className="questao-imagem" src={atual.imagem_url} alt="" />}

          <div className="alternativas">
            {[...atual.alternativas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map((a) => {
              const certa = resultado && a.id === resultado.alternativa_correta;
              const errada = resultado && a.id === escolha && !resultado.correta;
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={!!resultado}
                  className={`alternativa ${escolha === a.id ? 'alternativa-escolhida' : ''} ${certa ? 'alternativa-certa' : ''} ${errada ? 'alternativa-errada' : ''}`}
                  onClick={() => setEscolha(a.id)}
                >
                  <span className="alternativa-letra">{a.letra}</span>
                  <span>{a.texto}</span>
                </button>
              );
            })}
          </div>

          {!resultado ? (
            <button className="botao botao-destaque" type="button" disabled={!escolha || respondendo}
              onClick={responder}>
              {respondendo ? 'Conferindo…' : 'Responder'}
            </button>
          ) : (
            <>
              <div className={`aviso ${resultado.correta ? 'aviso-ok' : 'aviso-erro'}`}>
                <b>{resultado.correta ? 'Acertou!' : `Errou. A resposta certa é ${resultado.letra_correta}.`}</b>
                {resultado.comentario && <div style={{ marginTop: 6 }}>{resultado.comentario}</div>}
              </div>

              <div className="ciclo-botoes">
                <button className="botao botao-destaque" type="button" onClick={proxima}>
                  {indice + 1 < fila.length ? 'Próxima questão' : 'Terminar treino'}
                </button>
              </div>
            </>
          )}

          <div className="ciclo-secundarios">
            <span className="questao-contador">{indice + 1} de {fila.length}</span>
            <button className="botao-texto" type="button" onClick={alternarMarcada}>
              {marcadas.has(atual.id) ? 'desmarcar' : 'marcar para revisar'}
            </button>
            <button className="botao-texto" type="button" onClick={() => { setFila([]); setIndice(0); }}>
              trocar filtros
            </button>
          </div>
        </div>
      )}

      {!atual && fila.length > 0 && (
        <div className="cartao" style={{ marginTop: 16, textAlign: 'center' }}>
          <h2>Treino concluído</h2>
          <p className="subtitulo" style={{ margin: 0 }}>
            {placar.acertos} acertos em {placar.total} questões ({placar.pct}%).
            Os acertos já foram para os tópicos do seu edital.
          </p>
        </div>
      )}
    </div>
  );
}
