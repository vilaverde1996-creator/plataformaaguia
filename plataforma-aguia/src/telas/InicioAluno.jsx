import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function InicioAluno({ nome }) {
  const [resumo, setResumo] = useState(null);
  const [recado, setRecado] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: linha, error: e1 }, { data: mentoria, error: e2 }] = await Promise.all([
        supabase.from('vw_resumo_mentoria').select('*').eq('ativa', true).maybeSingle(),
        supabase.from('mentorias').select('recado').eq('ativa', true).maybeSingle(),
      ]);

      if (e1 || e2) setErro((e1 || e2).message);
      setResumo(linha ?? null);
      setRecado(mentoria?.recado ?? '');
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <div className="pagina">Carregando seus dados…</div>;

  if (!resumo) {
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
      <p className="subtitulo">{resumo.edital}</p>

      {recado && (
        <div className="recado">
          <h2>Recado da mentora</h2>
          <div>{recado}</div>
        </div>
      )}

      <div className="grade">
        <div className="cartao indicador">
          <div className="numero">{resumo.dias_para_prova ?? '—'}</div>
          <div className="rotulo">dias para a prova</div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{resumo.pct_edital ?? 0}%</div>
          <div className="rotulo">do edital concluído</div>
          <div className="detalhe">
            {resumo.topicos_concluidos} de {resumo.topicos_total} tópicos
          </div>
        </div>

        <div className="cartao indicador">
          <div className="numero">{resumo.horas_semana ?? 0}h</div>
          <div className="rotulo">estudadas nesta semana</div>
          {resumo.meta_horas && <div className="detalhe">Meta: {resumo.meta_horas}h</div>}
        </div>

        <div className="cartao indicador">
          <div className="numero">
            {resumo.aproveitamento === null ? '—' : `${resumo.aproveitamento}%`}
          </div>
          <div className="rotulo">de acerto nas questões</div>
          {resumo.meta_aprovamento && <div className="detalhe">Meta: {resumo.meta_aprovamento}%</div>}
        </div>
      </div>

      {(resumo.revisoes_hoje > 0 || resumo.revisoes_atrasadas > 0) && (
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
