import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useDados, nivelDaSequencia, NIVEIS } from '../lib/dados.jsx';
import { horasCurtas } from './Estudar.jsx';
import { separarRevisoes } from './Revisoes.jsx';

export default function Painel({ nome, irPara }) {
  const {
    mentoria, mentorias, totais, registros, estatisticasTopico, revisoes,
    totalSegundos, sequencia, frase, diasAtivos, carregando,
  } = useDados();

  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    if (!mentoria) return;
    let ativo = true;
    (async () => {
      const { data } = await supabase
        .from('vw_resumo_mentoria')
        .select('*')
        .eq('mentoria_id', mentoria.id)
        .maybeSingle();
      if (ativo) setResumo(data ?? null);
    })();
    return () => { ativo = false; };
  }, [mentoria?.id]);

  if (carregando && !mentoria) return <div className="pagina">Carregando seus dados…</div>;

  if (mentorias.length === 0) {
    return (
      <div className="pagina">
        <h1>Olá, {nome}</h1>
        <p className="subtitulo">
          Sua mentoria ainda não foi liberada. Avise sua mentora para concluir a matrícula.
        </p>
      </div>
    );
  }

  // Questões: soma o que veio do banco de questões com o anotado à mão
  let acertos = 0;
  let erros = 0;
  for (const e of Object.values(estatisticasTopico)) {
    acertos += e.acertos;
    erros += e.erros;
  }
  for (const r of registros) {
    if (r.topico_id) continue;          // já contado acima
    acertos += r.acertos ?? 0;
    erros += r.erros ?? 0;
  }
  const feitas = acertos + erros;
  const aproveitamento = feitas ? Math.round((acertos / feitas) * 100) : null;

  const nivel = nivelDaSequencia(sequencia);
  const pendentes = separarRevisoes(revisoes);
  const estudouHoje = diasAtivos.some((d) => d.estudou && d.data === diasAtivos[0]?.data);

  return (
    <div className="pagina">
      <div className="painel-cabecalho">
        <div>
          <h1>Olá, {nome}</h1>
          <p className="subtitulo" style={{ margin: 0 }}>{mentoria?.nomeEdital}</p>
        </div>
        {resumo?.dias_para_prova != null && (
          <div className="contagem">
            <b>{resumo.dias_para_prova}</b>
            <span>dias para a prova</span>
          </div>
        )}
      </div>

      {frase && (
        <div className="frase">
          <p>“{frase.texto}”</p>
          <span>{frase.autor}{frase.tipo === 'versiculo' ? '' : ''}</span>
        </div>
      )}

      {mentoria?.recado && (
        <div className="recado">
          <h2>Recado da mentora</h2>
          <div>{mentoria.recado}</div>
        </div>
      )}

      <div className="cartao ofensiva">
        <div className="ofensiva-icone">{nivel.icone}</div>
        <div className="ofensiva-texto">
          <b>
            {sequencia === 0
              ? 'Comece sua sequência hoje'
              : `${sequencia} ${sequencia === 1 ? 'dia seguido' : 'dias seguidos'}`}
          </b>
          <div className="ofensiva-nivel">
            Nível: {nivel.nome}
            {nivel.proximo && ` · faltam ${nivel.faltam} para ${nivel.proximo.nome}`}
          </div>
          <div className="ofensiva-trilha">
            {NIVEIS.map((n) => (
              <span
                key={n.nome}
                className={sequencia >= n.minimo ? 'marco marco-feito' : 'marco'}
                title={`${n.nome} — ${n.minimo} dias`}
              >
                {n.icone}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grade">
        <div className="cartao indicador">
          <div className="numero">{totais.pct}%</div>
          <div className="rotulo">do edital estudado</div>
          <div className="detalhe">{totais.concluidos} de {totais.total} tópicos</div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{horasCurtas(totalSegundos)}</div>
          <div className="rotulo">de estudo no total</div>
          <div className="detalhe">
            {resumo?.horas_semana ?? 0}h nesta semana
            {mentoria?.meta_horas ? ` · meta ${mentoria.meta_horas}h` : ''}
          </div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{feitas}</div>
          <div className="rotulo">questões feitas</div>
          <div className="detalhe">
            <span className="acerto">{acertos} certas</span> · <span className="erro">{erros} erradas</span>
          </div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{aproveitamento === null ? '—' : `${aproveitamento}%`}</div>
          <div className="rotulo">de aproveitamento</div>
          {mentoria?.meta_aprovamento && (
            <div className="detalhe">Meta: {mentoria.meta_aprovamento}%</div>
          )}
        </div>
      </div>

      <div className="atalhos">
        <button className="atalho" type="button" onClick={() => irPara('estudar')}>
          <b>{estudouHoje ? 'Continuar estudando' : 'Começar a estudar'}</b>
          <span>cronômetro e registro</span>
        </button>

        <button className="atalho" type="button" onClick={() => irPara('revisoes')}>
          <b>
            {pendentes.atrasadas.length + pendentes.hoje.length > 0
              ? `${pendentes.atrasadas.length + pendentes.hoje.length} revisões esperando`
              : 'Revisões em dia'}
          </b>
          <span>
            {pendentes.atrasadas.length > 0
              ? `${pendentes.atrasadas.length} atrasadas`
              : `${pendentes.proximas.length} agendadas`}
          </span>
        </button>

        {mentoria?.link_agendamento ? (
          <a
            className="atalho atalho-destaque"
            href={mentoria.link_agendamento}
            target="_blank"
            rel="noreferrer"
          >
            <b>Agendar mentoria</b>
            <span>falar com sua mentora</span>
          </a>
        ) : (
          <button className="atalho" type="button" onClick={() => irPara('plano')}>
            <b>Plano de voo</b>
            <span>sua estratégia</span>
          </button>
        )}
      </div>
    </div>
  );
}
