import { useState } from 'react';
import { contarDisciplina, useDados } from '../lib/dados.jsx';

const FILTROS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'pendentes', rotulo: 'Pendentes' },
  { id: 'concluidos', rotulo: 'Concluídos' },
];

export default function Edital() {
  const { disciplinas, progresso, estatisticasTopico, totais, carregando, erro, marcarTopico } = useDados();
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [abertas, setAbertas] = useState({});

  if (carregando) return <div className="pagina">Carregando o edital…</div>;

  const termo = busca.trim().toLowerCase();

  function topicosVisiveis(grupo) {
    return grupo.topicos.filter((t) => {
      const feito = !!progresso[t.id]?.concluido;
      if (filtro === 'pendentes' && feito) return false;
      if (filtro === 'concluidos' && !feito) return false;
      if (termo && !t.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }

  return (
    <div className="pagina">
      <h1>Edital verticalizado</h1>
      <p className="subtitulo">
        {totais.concluidos} de {totais.total} tópicos concluídos · {totais.pct}% do edital
      </p>

      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="barra-geral" aria-hidden="true">
        <div className="barra-geral-preenchida" style={{ width: `${totais.pct}%` }} />
      </div>

      <div className="filtros">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip ${filtro === f.id ? 'chip-ativo' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.rotulo}
          </button>
        ))}
        <input
          type="text"
          className="busca"
          placeholder="Buscar tópico"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {disciplinas.map((d) => {
        const conta = contarDisciplina(d, progresso);
        const grupos = d.grupos
          .map((g) => ({ ...g, visiveis: topicosVisiveis(g) }))
          .filter((g) => g.visiveis.length > 0);

        if (grupos.length === 0) return null;
        const aberta = abertas[d.id] ?? true;

        return (
          <section className="disciplina" key={d.id}>
            <button
              type="button"
              className="disciplina-topo"
              onClick={() => setAbertas((a) => ({ ...a, [d.id]: !aberta }))}
              aria-expanded={aberta}
            >
              <span className="disciplina-cor" style={{ background: d.cor || '#0D134C' }} />
              <span className="disciplina-nome">{d.nome}</span>
              <span className="disciplina-conta">
                {conta.concluidos}/{conta.total}
              </span>
              <span className="disciplina-barra">
                <span style={{ width: `${conta.pct}%`, background: d.cor || '#0D134C' }} />
              </span>
              <span className="disciplina-seta">{aberta ? '▾' : '▸'}</span>
            </button>

            {aberta &&
              grupos.map((g) => (
                <div className="grupo" key={g.id}>
                  <h3 className="grupo-nome">{g.nome}</h3>
                  <ul className="topicos">
                    {g.visiveis.map((t) => {
                      const p = progresso[t.id];
                      const e = estatisticasTopico[t.id];
                      const respondidas = (e?.acertos ?? 0) + (e?.erros ?? 0);
                      const pct = respondidas ? Math.round((e.acertos / respondidas) * 100) : null;
                      return (
                        <li key={t.id} className={p?.concluido ? 'topico topico-feito' : 'topico'}>
                          <label>
                            <input
                              type="checkbox"
                              checked={!!p?.concluido}
                              onChange={(e) => marcarTopico(t.id, e.target.checked)}
                            />
                            <span className="topico-nome">{t.nome}</span>
                          </label>
                          {pct !== null && (
                            <span
                              className={`etiqueta ${pct < 60 ? 'etiqueta-alerta' : pct < 75 ? 'etiqueta-atencao' : ''}`}
                              title={`${e.acertos} acertos e ${e.erros} erros`}
                            >
                              {pct}%
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </section>
        );
      })}

      {disciplinas.length === 0 && (
        <p className="vazio">Nenhuma disciplina cadastrada neste edital.</p>
      )}
    </div>
  );
}
