import { useMemo } from 'react';
import { useDados } from '../lib/dados.jsx';
import { useCronometro, relogio } from '../lib/cronometro.jsx';
import { TIPOS } from './FecharEstudo.jsx';

export default function Cronometro() {
  const { disciplinas, carregando } = useDados();
  const {
    rodando, decorrido, iniciar, pausar, zerar, contexto, definirContexto, pedirEncerramento,
  } = useCronometro();

  const topicos = useMemo(() => {
    const d = disciplinas.find((x) => x.id === contexto.disciplina_id);
    return d ? d.grupos.flatMap((g) => g.topicos) : [];
  }, [disciplinas, contexto.disciplina_id]);

  if (carregando) return <div className="pagina">Carregando…</div>;

  return (
    <div className="pagina">
      <h1>Cronômetro</h1>
      <p className="subtitulo">
        O tempo continua correndo se você trocar de aba. A caixinha no canto acompanha você.
      </p>

      <div className="cartao cronometro">
        <div className="crono-display">{relogio(decorrido)}</div>

        <div className="crono-campos">
          <select
            value={contexto.disciplina_id}
            onChange={(e) => definirContexto({ disciplina_id: e.target.value, topico_id: '' })}
          >
            <option value="">Disciplina…</option>
            {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>

          <select
            value={contexto.topico_id}
            disabled={!contexto.disciplina_id}
            onChange={(e) => definirContexto({ topico_id: e.target.value })}
          >
            <option value="">Conteúdo (opcional)…</option>
            {topicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>

          <select value={contexto.tipo} onChange={(e) => definirContexto({ tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.rotulo}</option>)}
          </select>
        </div>

        <div className="crono-botoes">
          {!rodando ? (
            <button className="botao botao-destaque" type="button" onClick={iniciar}>
              {decorrido > 0 ? 'Continuar' : 'Iniciar'}
            </button>
          ) : (
            <button className="botao" type="button" onClick={pausar}>Pausar</button>
          )}

          <button
            className="botao botao-claro"
            type="button"
            disabled={decorrido < 60}
            onClick={() => { if (rodando) pausar(); pedirEncerramento(); }}
          >
            Encerrar e registrar
          </button>

          <button className="botao botao-claro" type="button" disabled={decorrido === 0} onClick={zerar}>
            Zerar
          </button>
        </div>

        {decorrido > 0 && decorrido < 60 && (
          <p className="subtitulo" style={{ margin: '14px 0 0' }}>
            A partir de 1 minuto você já pode encerrar e registrar a sessão.
          </p>
        )}
      </div>
    </div>
  );
}
