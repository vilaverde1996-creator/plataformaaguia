import { useMemo, useState } from 'react';
import { useDados } from '../lib/dados.jsx';
import { useCronometro, horasCurtas } from '../lib/cronometro.jsx';

const TIPOS = [
  { id: 'teoria', rotulo: 'Teoria' },
  { id: 'questoes', rotulo: 'Questões' },
  { id: 'revisao', rotulo: 'Revisão' },
  { id: 'lei_seca', rotulo: 'Lei seca' },
  { id: 'simulado', rotulo: 'Simulado' },
  { id: 'aula', rotulo: 'Aula' },
  { id: 'discursiva', rotulo: 'Discursiva' },
  { id: 'jurisprudencia', rotulo: 'Jurisprudência' },
  { id: 'outro', rotulo: 'Outro' },
];

export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export { TIPOS };

// Aparece quando o aluno toca em encerrar, em qualquer tela.
export default function FecharEstudo() {
  const { disciplinas, adicionarRegistro, agendarRevisoes } = useDados();
  const {
    decorrido, zerar, contexto, definirContexto, encerrando, cancelarEncerramento,
  } = useCronometro();

  const [extras, setExtras] = useState({ questoes: '', acertos: '', erros: '', obs: '' });
  const [agendar, setAgendar] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const topicos = useMemo(() => {
    const d = disciplinas.find((x) => x.id === contexto.disciplina_id);
    return d ? d.grupos.flatMap((g) => g.topicos) : [];
  }, [disciplinas, contexto.disciplina_id]);

  if (!encerrando) return null;

  const questoes = Number(extras.questoes) || 0;
  const acertos = Number(extras.acertos) || 0;
  const erros = Number(extras.erros) || 0;

  async function salvar() {
    if (decorrido < 60) {
      setErro('A sessão precisa ter pelo menos 1 minuto.');
      return;
    }
    if (acertos + erros > 0 && questoes > 0 && acertos + erros !== questoes) {
      setErro(`Você marcou ${questoes} questões, mas ${acertos} certas e ${erros} erradas somam ${acertos + erros}.`);
      return;
    }

    setErro('');
    setSalvando(true);

    const resultado = await adicionarRegistro({
      data: hoje(),
      disciplina_id: contexto.disciplina_id,
      topico_id: contexto.topico_id,
      tipo: contexto.tipo,
      segundos: decorrido,
      questoes: questoes || acertos + erros,
      acertos,
      erros,
      obs: extras.obs,
      origem: 'cronometro',
    });

    if (!resultado?.ok) {
      setSalvando(false);
      setErro('Não foi possível salvar. Tente de novo.');
      return;
    }

    if (agendar && contexto.topico_id) {
      await agendarRevisoes(contexto.topico_id, hoje(), [7, 15, 30]);
    }

    setSalvando(false);
    setExtras({ questoes: '', acertos: '', erros: '', obs: '' });
    zerar();
    cancelarEncerramento();
  }

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Encerrar estudo</h2>
        <p className="subtitulo">
          {horasCurtas(decorrido)} cronometrados. Confirme o que você estudou.
        </p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <label>Disciplina</label>
        <select
          value={contexto.disciplina_id}
          onChange={(e) => definirContexto({ disciplina_id: e.target.value, topico_id: '' })}
        >
          <option value="">Selecione…</option>
          {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>

        <label>Conteúdo estudado</label>
        <select
          value={contexto.topico_id}
          disabled={!contexto.disciplina_id}
          onChange={(e) => definirContexto({ topico_id: e.target.value })}
        >
          <option value="">Selecione…</option>
          {topicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>

        <label>Tipo de estudo</label>
        <select value={contexto.tipo} onChange={(e) => definirContexto({ tipo: e.target.value })}>
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.rotulo}</option>)}
        </select>

        <div className="linha-campos">
          <span>
            <label>Questões feitas</label>
            <input type="number" min="0" value={extras.questoes}
              onChange={(e) => setExtras({ ...extras, questoes: e.target.value })} />
          </span>
          <span>
            <label>Certas</label>
            <input type="number" min="0" value={extras.acertos}
              onChange={(e) => setExtras({ ...extras, acertos: e.target.value })} />
          </span>
          <span>
            <label>Erradas</label>
            <input type="number" min="0" value={extras.erros}
              onChange={(e) => setExtras({ ...extras, erros: e.target.value })} />
          </span>
        </div>

        <label>Observação</label>
        <input type="text" value={extras.obs} placeholder="O que travou? O que revisar?"
          onChange={(e) => setExtras({ ...extras, obs: e.target.value })} />

        {contexto.topico_id && (
          <label className="caixa-linha">
            <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} />
            Agendar revisões deste conteúdo para 7, 15 e 30 dias
          </label>
        )}

        <div className="ciclo-botoes">
          <button className="botao botao-destaque" type="button" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando…' : 'Salvar e zerar'}
          </button>
          <button className="botao botao-claro" type="button" onClick={cancelarEncerramento}>
            Voltar
          </button>
        </div>

        <p className="subtitulo" style={{ margin: '12px 0 0' }}>
          Tudo isso vai para o histórico e para as estatísticas.
        </p>
      </div>
    </div>
  );
}
