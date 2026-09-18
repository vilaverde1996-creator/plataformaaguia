import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function situacao(aluno) {
  if (aluno.dias_sem_estudar === null) return { texto: 'Ainda não começou', classe: 'etiqueta-atencao' };
  if (aluno.dias_sem_estudar >= 3) return { texto: `${aluno.dias_sem_estudar} dias sem estudar`, classe: 'etiqueta-alerta' };
  if (aluno.revisoes_atrasadas >= 5) return { texto: `${aluno.revisoes_atrasadas} revisões atrasadas`, classe: 'etiqueta-atencao' };
  if (aluno.dias_sem_estudar === 0) return { texto: 'Estudou hoje', classe: '' };
  return { texto: `Estudou há ${aluno.dias_sem_estudar} dia(s)`, classe: '' };
}

export default function PainelMentora() {
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('vw_resumo_mentoria')
        .select('*')
        .eq('ativa', true)
        .order('dias_sem_estudar', { ascending: false, nullsFirst: false });

      if (error) setErro(error.message);
      else setAlunos(data ?? []);
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <div className="pagina">Carregando alunos…</div>;

  return (
    <div className="pagina">
      <h1>Seus alunos</h1>
      <p className="subtitulo">
        {alunos.length === 1 ? '1 mentoria ativa' : `${alunos.length} mentorias ativas`}
      </p>

      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="cartao" style={{ padding: 0 }}>
        {alunos.length === 0 && (
          <p className="vazio">
            Nenhum aluno matriculado ainda. Cadastre o aluno em Authentication e rode o passo 3
            do arquivo 04_configuracao_inicial.sql.
          </p>
        )}

        {alunos.map((aluno) => {
          const marca = situacao(aluno);
          return (
            <div className="aluno" key={aluno.mentoria_id}>
              <div className="aluno-nome">
                {aluno.aluno}
                <div>
                  <span className={`etiqueta ${marca.classe}`}>{marca.texto}</span>
                </div>
              </div>

              <div className="aluno-dado">
                <b>{aluno.horas_semana ?? 0}h</b>
                <span>na semana{aluno.meta_horas ? ` · meta ${aluno.meta_horas}h` : ''}</span>
              </div>

              <div className="aluno-dado">
                <b>{aluno.questoes_semana ?? 0}</b>
                <span>questões na semana</span>
              </div>

              <div className="aluno-dado">
                <b>{aluno.pct_edital ?? 0}%</b>
                <span>do edital</span>
              </div>

              <div className="aluno-dado">
                <b>{aluno.aproveitamento === null ? '—' : `${aluno.aproveitamento}%`}</b>
                <span>de acerto</span>
              </div>

              <div className="aluno-dado">
                <b>{aluno.dias_para_prova ?? '—'}</b>
                <span>dias para a prova</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
