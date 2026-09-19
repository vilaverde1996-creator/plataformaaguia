import { useMemo } from 'react';
import { useDados } from '../lib/dados.jsx';
import { horasCurtas } from './Estudar.jsx';

function ultimosDias(quantidade) {
  const lista = [];
  const d = new Date();
  for (let i = quantidade - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    lista.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`);
  }
  return lista;
}

export function resumoPorDisciplina(disciplinas, registros, estatisticasTopico) {
  return disciplinas.map((d) => {
    const topicos = d.grupos.flatMap((g) => g.topicos);
    const idsTopicos = new Set(topicos.map((t) => t.id));

    let segundos = 0;
    let acertos = 0;
    let erros = 0;
    let questoes = 0;

    for (const r of registros) {
      if (r.disciplina_id === d.id || (r.topico_id && idsTopicos.has(r.topico_id))) {
        segundos += r.segundos ?? 0;
      }
    }

    for (const t of topicos) {
      const e = estatisticasTopico[t.id];
      if (!e) continue;
      acertos += e.acertos;
      erros += e.erros;
      questoes += e.questoes;
    }

    const respondidas = acertos + erros;
    return {
      id: d.id,
      nome: d.nome,
      cor: d.cor || '#0D134C',
      segundos,
      questoes,
      acertos,
      erros,
      aproveitamento: respondidas ? Math.round((acertos / respondidas) * 100) : null,
      concluidos: topicos.filter((t) => estatisticasTopico[t.id]?.concluido).length,
      total: topicos.length,
    };
  });
}

export function topicosFracos(disciplinas, estatisticasTopico, minimo = 5) {
  const lista = [];
  for (const d of disciplinas) {
    for (const g of d.grupos) {
      for (const t of g.topicos) {
        const e = estatisticasTopico[t.id];
        if (!e) continue;
        const respondidas = e.acertos + e.erros;
        if (respondidas < minimo) continue;
        const pct = Math.round((e.acertos / respondidas) * 100);
        if (pct >= 70) continue;
        lista.push({ id: t.id, nome: t.nome, disciplina: d.nome, cor: d.cor, pct, respondidas });
      }
    }
  }
  return lista.sort((a, b) => a.pct - b.pct).slice(0, 10);
}

export default function Estatisticas() {
  const { disciplinas, registros, estatisticasTopico, totais, totalSegundos, carregando } = useDados();

  const porDisciplina = useMemo(
    () => resumoPorDisciplina(disciplinas, registros, estatisticasTopico),
    [disciplinas, registros, estatisticasTopico]
  );

  const fracos = useMemo(
    () => topicosFracos(disciplinas, estatisticasTopico),
    [disciplinas, estatisticasTopico]
  );

  const dias = useMemo(() => {
    const mapa = {};
    for (const r of registros) mapa[r.data] = (mapa[r.data] ?? 0) + (r.segundos ?? 0);
    return ultimosDias(14).map((d) => ({ data: d, segundos: mapa[d] ?? 0 }));
  }, [registros]);

  if (carregando) return <div className="pagina">Carregando…</div>;

  const maiorDia = Math.max(1, ...dias.map((d) => d.segundos));
  const maiorDisciplina = Math.max(1, ...porDisciplina.map((d) => d.segundos));

  const totalQuestoes = porDisciplina.reduce((s, d) => s + d.questoes, 0);
  const totalAcertos = porDisciplina.reduce((s, d) => s + d.acertos, 0);
  const totalErros = porDisciplina.reduce((s, d) => s + d.erros, 0);
  const geral = totalAcertos + totalErros
    ? Math.round((totalAcertos / (totalAcertos + totalErros)) * 100)
    : null;

  if (registros.length === 0 && totalQuestoes === 0) {
    return (
      <div className="pagina">
        <h1>Estatísticas</h1>
        <p className="vazio">
          Ainda não há dados. Registre alguns estudos na aba Estudar e os números aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="pagina">
      <h1>Estatísticas</h1>
      <p className="subtitulo">Onde seu tempo foi e onde estão seus erros.</p>

      <div className="grade">
        <div className="cartao indicador">
          <div className="numero">{horasCurtas(totalSegundos)}</div>
          <div className="rotulo">estudadas no total</div>
        </div>
        <div className="cartao indicador">
          <div className="numero">{totalQuestoes}</div>
          <div className="rotulo">questões resolvidas</div>
        </div>
        <div className="cartao indicador">
          <div className="numero">{geral === null ? '—' : `${geral}%`}</div>
          <div className="rotulo">de acerto geral</div>
        </div>
        <div className="cartao indicador">
          <div className="numero">{totais.pct}%</div>
          <div className="rotulo">do edital concluído</div>
        </div>
      </div>

      <div className="cartao" style={{ marginBottom: 16 }}>
        <h2>Últimos 14 dias</h2>
        <div className="colunas">
          {dias.map((d) => (
            <div className="coluna" key={d.data} title={`${d.data.slice(8)}/${d.data.slice(5, 7)}: ${horasCurtas(d.segundos)}`}>
              <div className="coluna-barra" style={{ height: `${Math.round((d.segundos / maiorDia) * 100)}%` }} />
              <span className="coluna-rotulo">{d.data.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cartao" style={{ marginBottom: 16 }}>
        <h2>Por disciplina</h2>
        {porDisciplina.map((d) => (
          <div className="linha-disciplina" key={d.id}>
            <div className="linha-disciplina-topo">
              <b>{d.nome}</b>
              <span>
                {horasCurtas(d.segundos)}
                {d.aproveitamento !== null && ` · ${d.aproveitamento}% de acerto`}
                {` · ${d.concluidos}/${d.total} tópicos`}
              </span>
            </div>
            <div className="linha-disciplina-barra">
              <span style={{ width: `${Math.round((d.segundos / maiorDisciplina) * 100)}%`, background: d.cor }} />
            </div>
          </div>
        ))}
      </div>

      {fracos.length > 0 && (
        <div className="cartao">
          <h2>Pontos de atenção</h2>
          <p className="subtitulo" style={{ marginBottom: 14 }}>
            Tópicos com menos de 70% de acerto. Comece a revisão por aqui.
          </p>
          {fracos.map((t) => (
            <div className="registro" key={t.id}>
              <div className="registro-texto">
                <b>{t.nome}</b>
                <div className="registro-detalhe">{t.disciplina} · {t.respondidas} questões</div>
              </div>
              <span className={`etiqueta ${t.pct < 60 ? 'etiqueta-alerta' : 'etiqueta-atencao'}`}>
                {t.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
