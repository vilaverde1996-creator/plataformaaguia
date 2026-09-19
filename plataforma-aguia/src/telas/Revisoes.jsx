import { useMemo, useState } from 'react';
import { useDados } from '../lib/dados.jsx';

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function porExtenso(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function diferencaEmDias(de, ate) {
  const d1 = new Date(de + 'T12:00:00');
  const d2 = new Date(ate + 'T12:00:00');
  return Math.round((d2 - d1) / 86400000);
}

export function separarRevisoes(revisoes, dia = hoje()) {
  const abertas = revisoes.filter((r) => !r.feita);
  return {
    atrasadas: abertas.filter((r) => r.data_revisao < dia),
    hoje: abertas.filter((r) => r.data_revisao === dia),
    proximas: abertas.filter((r) => r.data_revisao > dia),
    feitas: revisoes.filter((r) => r.feita),
  };
}

export default function Revisoes() {
  const { disciplinas, revisoes, alternarRevisao, excluirRevisao, agendarRevisoes, carregando } = useDados();
  const [mostrarFeitas, setMostrarFeitas] = useState(false);
  const [novo, setNovo] = useState({ topico_id: '', dias: '7' });

  const nomes = useMemo(() => {
    const mapa = {};
    for (const d of disciplinas) {
      for (const g of d.grupos) for (const t of g.topicos) mapa[t.id] = { topico: t.nome, disciplina: d.nome, cor: d.cor };
    }
    return mapa;
  }, [disciplinas]);

  const grupos = useMemo(() => separarRevisoes(revisoes), [revisoes]);

  if (carregando) return <div className="pagina">Carregando…</div>;

  function Lista({ titulo, itens, tom }) {
    if (itens.length === 0) return null;
    return (
      <div className="cartao" style={{ marginBottom: 14 }}>
        <h2>
          {titulo} <span className={`etiqueta ${tom}`}>{itens.length}</span>
        </h2>
        {itens.map((r) => {
          const info = nomes[r.topico_id] ?? { topico: 'Tópico removido', disciplina: '' };
          const atraso = diferencaEmDias(r.data_revisao, hoje());
          return (
            <div className="registro" key={r.id}>
              <input
                type="checkbox"
                checked={!!r.feita}
                onChange={(e) => alternarRevisao(r.id, e.target.checked)}
                aria-label={`Marcar revisão de ${info.topico}`}
              />
              <div className="registro-texto">
                <b>{info.topico}</b>
                <div className="registro-detalhe">
                  {info.disciplina} · revisão de {r.dias} dias · {porExtenso(r.data_revisao)}
                  {!r.feita && atraso > 0 && ` · ${atraso} ${atraso === 1 ? 'dia' : 'dias'} de atraso`}
                </div>
              </div>
              <button className="botao-texto" type="button" onClick={() => excluirRevisao(r.id)}>
                excluir
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  const todosTopicos = disciplinas.flatMap((d) =>
    d.grupos.flatMap((g) => g.topicos.map((t) => ({ ...t, disciplina: d.nome })))
  );

  return (
    <div className="pagina">
      <h1>Revisões</h1>
      <p className="subtitulo">
        Revisar o que já estudou é o que fixa o conteúdo. O ciclo padrão é 7, 15 e 30 dias.
      </p>

      <Lista titulo="Atrasadas" itens={grupos.atrasadas} tom="etiqueta-alerta" />
      <Lista titulo="Para hoje" itens={grupos.hoje} tom="etiqueta-atencao" />
      <Lista titulo="Próximas" itens={grupos.proximas} tom="" />

      {revisoes.length === 0 && (
        <p className="vazio">
          Nenhuma revisão agendada. Elas são criadas sozinhas quando você registra um estudo com
          tópico, ou você pode agendar uma aqui embaixo.
        </p>
      )}

      <div className="cartao" style={{ marginTop: 14 }}>
        <h2>Agendar uma revisão</h2>
        <label>Tópico</label>
        <select value={novo.topico_id} onChange={(e) => setNovo({ ...novo, topico_id: e.target.value })}>
          <option value="">Selecione…</option>
          {todosTopicos.map((t) => (
            <option key={t.id} value={t.id}>{t.disciplina} · {t.nome}</option>
          ))}
        </select>

        <label>Revisar daqui a</label>
        <select value={novo.dias} onChange={(e) => setNovo({ ...novo, dias: e.target.value })}>
          <option value="1">1 dia</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
          <option value="7,15,30">7, 15 e 30 dias (ciclo completo)</option>
        </select>

        <button
          className="botao botao-destaque"
          type="button"
          disabled={!novo.topico_id}
          onClick={() => {
            agendarRevisoes(novo.topico_id, hoje(), novo.dias.split(',').map(Number));
            setNovo({ topico_id: '', dias: '7' });
          }}
        >
          Agendar
        </button>
      </div>

      {grupos.feitas.length > 0 && (
        <>
          <button
            className="botao botao-claro largura-total"
            type="button"
            onClick={() => setMostrarFeitas(!mostrarFeitas)}
          >
            {mostrarFeitas ? 'Ocultar' : `Ver ${grupos.feitas.length} revisões já feitas`}
          </button>
          {mostrarFeitas && <Lista titulo="Feitas" itens={grupos.feitas} tom="" />}
        </>
      )}
    </div>
  );
}
