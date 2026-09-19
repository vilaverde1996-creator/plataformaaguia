import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useDados } from '../lib/dados.jsx';

export default function InicioAluno({ nome }) {
  const { mentoria, mentorias, carregando: carregandoDados, totais } = useDados();
  const [resumo, setResumo] = useState(null);
  const [buscando, setBuscando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!mentoria) return;
    let ativo = true;

    (async () => {
      setBuscando(true);
      const { data, error } = await supabase
        .from('vw_resumo_mentoria')
        .select('*')
        .eq('mentoria_id', mentoria.id)
        .maybeSingle();

      if (!ativo) return;
      if (error) setErro(error.message);
      setResumo(data ?? null);
      setBuscando(false);
    })();

    return () => { ativo = false; };
  }, [mentoria?.id]);

  if (carregandoDados && !mentoria) return <div className="pagina">Carregando seus dados…</div>;

  if (mentorias.length === 0) {
    return (
      <div className="pagina">
        <h1>Olá, {nome}</h1>
        <p className="subtitulo">
          Sua mentoria ainda não foi liberada. Avise sua mentora para concluir a matrícula.
        </p>
        {erro && <div className="aviso aviso-erro">{erro}</div>}
      </div>
    );
  }

  return (
    <div className="pagina">
      <h1>Olá, {nome}</h1>
      <p className="subtitulo">{mentoria?.nomeEdital}</p>

      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {mentoria?.recado && (
        <div className="recado">
          <h2>Recado da mentora</h2>
          <div>{mentoria.recado}</div>
        </div>
      )}

      <div className="grade">
        <div className="cartao indicador">
          <div className="numero">{resumo?.dias_para_prova ?? '—'}</div>
          <div className="rotulo">dias para a prova</div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{totais.pct}%</div>
          <div className="rotulo">do edital concluído</div>
          <div className="detalhe">
            {totais.concluidos} de {totais.total} tópicos
          </div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{buscando ? '…' : `${resumo?.horas_semana ?? 0}h`}</div>
          <div className="rotulo">estudadas nesta semana</div>
          {mentoria?.meta_horas && <div className="detalhe">Meta: {mentoria.meta_horas}h</div>}
        </div>

        <div className="cartao indicador">
          <div className="numero">
            {resumo?.aproveitamento == null ? '—' : `${resumo.aproveitamento}%`}
          </div>
          <div className="rotulo">de acerto nas questões</div>
          {mentoria?.meta_aprovamento && (
            <div className="detalhe">Meta: {mentoria.meta_aprovamento}%</div>
          )}
        </div>
      </div>

      {(resumo?.revisoes_hoje > 0 || resumo?.revisoes_atrasadas > 0) && (
        <div className="cartao">
          <h2>Revisões</h2>
          <p style={{ margin: 0 }}>
            {resumo.revisoes_hoje > 0 && `${resumo.revisoes_hoje} para hoje. `}
            {resumo.revisoes_atrasadas > 0 && `${resumo.revisoes_atrasadas} atrasadas.`}
          </p>
        </div>
      )}
    </div>
  );
}
