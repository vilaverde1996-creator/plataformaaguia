import { useMemo, useState } from 'react';
import { useDados } from '../lib/dados.jsx';
import { gerarSequencia, cicloEm, proximosCiclos, ciclosRestantes } from '../lib/ciclo.js';

export default function Ciclo({ irPara }) {
  const {
    mentoria, disciplinas, progresso, cicloItens,
    concluirCiclo, pularCiclo, voltarCiclo, carregando,
  } = useDados();

  const [trocando, setTrocando] = useState(false);
  const [escolhido, setEscolhido] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const posicao = mentoria?.ciclo_posicao ?? 0;
  const sequencia = useMemo(() => gerarSequencia(cicloItens), [cicloItens]);
  const atual = useMemo(
    () => cicloEm(sequencia, posicao, disciplinas, progresso),
    [sequencia, posicao, disciplinas, progresso]
  );
  const proximos = useMemo(
    () => proximosCiclos(sequencia, posicao, disciplinas, progresso, 6).slice(1),
    [sequencia, posicao, disciplinas, progresso]
  );
  const restantes = useMemo(
    () => ciclosRestantes(disciplinas, progresso, sequencia),
    [disciplinas, progresso, sequencia]
  );

  if (carregando) return <div className="pagina">Carregando…</div>;

  if (sequencia.length === 0) {
    return (
      <div className="pagina">
        <h1>Ciclos</h1>
        <p className="vazio">
          Sua mentora ainda não montou o ciclo deste edital.
        </p>
      </div>
    );
  }

  if (!atual) {
    return (
      <div className="pagina">
        <h1>Ciclos</h1>
        <div className="cartao" style={{ textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: '2.4rem' }}>🦅</div>
          <h2>Edital concluído</h2>
          <p className="subtitulo" style={{ margin: 0 }}>
            Todos os tópicos do ciclo estão marcados. Agora é revisão e questões.
          </p>
        </div>
      </div>
    );
  }

  const topico = escolhido ?? atual.topico;

  async function concluir() {
    setOcupado(true);
    await concluirCiclo({ ...atual, topico });
    setEscolhido(null);
    setTrocando(false);
    setOcupado(false);
  }

  async function pular() {
    setOcupado(true);
    await pularCiclo(atual);
    setEscolhido(null);
    setTrocando(false);
    setOcupado(false);
  }

  return (
    <div className="pagina">
      <div className="painel-cabecalho">
        <div>
          <h1>Seu ciclo</h1>
          <p className="subtitulo" style={{ margin: 0 }}>
            Sem dia marcado: a fila anda quando você conclui um tópico.
          </p>
        </div>
        <div className="contagem">
          <b>{restantes}</b>
          <span>ciclos até fechar o edital</span>
        </div>
      </div>

      <div className="cartao ciclo-atual" style={{ borderTopColor: atual.disciplina?.cor || '#0D134C' }}>
        <div className="ciclo-etiqueta">
          Ciclo {atual.posicao + 1} · {atual.volta}ª volta da fila
          {atual.puladas > 0 && ' · disciplina anterior já concluída'}
        </div>

        <h2 className="ciclo-disciplina" style={{ color: atual.disciplina?.cor || 'inherit' }}>
          {atual.disciplina?.nome}
        </h2>

        <div className="ciclo-topico">{topico.nome}</div>
        <div className="ciclo-grupo">
          {topico.grupo} · faltam {atual.restantes} tópicos nesta disciplina
        </div>

        {trocando && (
          <div className="ciclo-troca">
            <label>Estudar outro tópico desta disciplina</label>
            <select
              value={topico.id}
              onChange={(e) =>
                setEscolhido(atual.alternativas.find((t) => t.id === e.target.value) ?? null)
              }
            >
              {atual.alternativas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="ciclo-botoes">
          <button className="botao botao-destaque" type="button" disabled={ocupado}
            onClick={() => irPara('estudar')}>
            Estudar agora
          </button>
          <button className="botao botao-claro" type="button" disabled={ocupado} onClick={concluir}>
            {ocupado ? 'Salvando…' : 'Concluir ciclo'}
          </button>
        </div>

        <div className="ciclo-secundarios">
          <button className="botao-texto" type="button" onClick={() => setTrocando(!trocando)}>
            {trocando ? 'manter o tópico sugerido' : 'trocar de tópico'}
          </button>
          <button className="botao-texto" type="button" disabled={ocupado} onClick={pular}>
            pular esta disciplina
          </button>
          {posicao > 0 && (
            <button className="botao-texto" type="button" onClick={voltarCiclo}>
              voltar um ciclo
            </button>
          )}
        </div>
      </div>

      <p className="subtitulo" style={{ marginTop: 22 }}>
        Concluir o ciclo marca o tópico no edital e agenda as revisões de 7, 15 e 30 dias.
      </p>

      {proximos.length > 0 && (
        <div className="cartao">
          <h2>Depois vem</h2>
          {proximos.map((c, i) => (
            <div className="registro" key={`${c.posicao}-${c.topico.id}`}>
              <span className="ciclo-numero">{i + 2}º</span>
              <div className="registro-texto">
                <b style={{ color: c.disciplina?.cor || 'inherit' }}>{c.disciplina?.nome}</b>
                <div className="registro-detalhe">{c.topico.nome}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
