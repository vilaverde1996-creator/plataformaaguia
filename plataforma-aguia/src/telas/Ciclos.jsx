import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { gerarSequencia } from '../lib/ciclo.js';

export default function Ciclos() {
  const [editais, setEditais] = useState([]);
  const [editalId, setEditalId] = useState('');
  const [disciplinas, setDisciplinas] = useState([]);
  const [pesos, setPesos] = useState({});
  const [estado, setEstado] = useState({ tipo: '', mensagem: '' });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase
      .from('editais')
      .select('id, nome, cargo')
      .order('criado_em', { ascending: false })
      .then(({ data }) => setEditais(data ?? []));
  }, []);

  useEffect(() => {
    if (!editalId) { setDisciplinas([]); setPesos({}); return; }
    let ativo = true;

    (async () => {
      const [{ data: discs }, { data: itens }] = await Promise.all([
        supabase.from('disciplinas').select('id, nome, cor, ordem').eq('edital_id', editalId),
        supabase.from('ciclo_itens').select('disciplina_id, peso').eq('edital_id', editalId),
      ]);

      if (!ativo) return;
      const ordenadas = [...(discs ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      setDisciplinas(ordenadas);

      const mapa = {};
      for (const d of ordenadas) mapa[d.id] = 1;
      for (const i of itens ?? []) mapa[i.disciplina_id] = i.peso;
      setPesos(mapa);
      setEstado({ tipo: '', mensagem: '' });
    })();

    return () => { ativo = false; };
  }, [editalId]);

  const previa = useMemo(() => {
    const itens = disciplinas.map((d, i) => ({ disciplina_id: d.id, peso: pesos[d.id] ?? 1, ordem: i }));
    const sequencia = gerarSequencia(itens);
    const nomes = new Map(disciplinas.map((d) => [d.id, d]));
    return sequencia.map((id) => nomes.get(id));
  }, [disciplinas, pesos]);

  async function salvar() {
    setSalvando(true);
    setEstado({ tipo: '', mensagem: '' });

    const linhas = disciplinas.map((d, i) => ({
      edital_id: editalId,
      disciplina_id: d.id,
      peso: Number(pesos[d.id] ?? 1),
      ordem: i,
    }));

    const { error } = await supabase
      .from('ciclo_itens')
      .upsert(linhas, { onConflict: 'edital_id,disciplina_id' });

    setSalvando(false);
    setEstado(
      error
        ? { tipo: 'erro', mensagem: error.message }
        : { tipo: 'ok', mensagem: `Ciclo salvo: ${previa.length} ciclos por volta completa da fila.` }
    );
  }

  return (
    <div className="pagina">
      <h1>Ciclos</h1>
      <p className="subtitulo">
        Defina quantas vezes cada disciplina aparece em uma volta da fila. Peso 2 faz a disciplina
        voltar duas vezes mais rápido; peso 0 tira ela do ciclo.
      </p>

      {estado.mensagem && (
        <div className={`aviso ${estado.tipo === 'erro' ? 'aviso-erro' : 'aviso-ok'}`}>
          {estado.mensagem}
        </div>
      )}

      <div className="cartao">
        <label>Edital</label>
        <select value={editalId} onChange={(e) => setEditalId(e.target.value)}>
          <option value="">Selecione…</option>
          {editais.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}{e.cargo ? ` — ${e.cargo}` : ''}</option>
          ))}
        </select>

        {disciplinas.map((d) => (
          <div className="peso" key={d.id}>
            <span className="disciplina-cor" style={{ background: d.cor || '#0D134C' }} />
            <span className="peso-nome">{d.nome}</span>
            <div className="peso-controles">
              <button className="peso-botao" type="button"
                onClick={() => setPesos({ ...pesos, [d.id]: Math.max(0, (pesos[d.id] ?? 1) - 1) })}>
                −
              </button>
              <b>{pesos[d.id] ?? 1}</b>
              <button className="peso-botao" type="button"
                onClick={() => setPesos({ ...pesos, [d.id]: Math.min(10, (pesos[d.id] ?? 1) + 1) })}>
                +
              </button>
            </div>
          </div>
        ))}

        {disciplinas.length > 0 && (
          <>
            <h2 style={{ marginTop: 22 }}>Como a fila vai ficar</h2>
            <div className="fila">
              {previa.map((d, i) => (
                <span className="fila-item" key={i} style={{ borderColor: d?.cor || '#0D134C' }}>
                  <b>{i + 1}</b> {d?.nome}
                </span>
              ))}
              {previa.length === 0 && (
                <p className="vazio" style={{ padding: 12 }}>
                  Todas as disciplinas estão com peso 0: o ciclo ficaria vazio.
                </p>
              )}
            </div>
            <p className="subtitulo">
              Depois do último, a fila recomeça do primeiro, sempre puxando o próximo tópico não
              concluído de cada disciplina.
            </p>

            <button className="botao botao-destaque" type="button" disabled={salvando} onClick={salvar}>
              {salvando ? 'Salvando…' : 'Salvar ciclo'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
