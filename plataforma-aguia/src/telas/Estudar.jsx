import { useMemo, useState } from 'react';
import { useDados } from '../lib/dados.jsx';
import { useCronometro, relogio, horasCurtas } from '../lib/cronometro.jsx';

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

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export { relogio, horasCurtas };

export default function Estudar() {
  const { disciplinas, registros, adicionarRegistro, excluirRegistro, agendarRevisoes, carregando } = useDados();

  // ── Cronômetro (o mesmo que aparece na caixinha flutuante) ──
  const { rodando, decorrido, iniciar, pausar, zerar, contexto, definirContexto } = useCronometro();

  const discCrono = contexto.disciplina_id;
  const topicoCrono = contexto.topico_id;
  const tipoCrono = contexto.tipo;
  const setDiscCrono = (v) => definirContexto({ disciplina_id: v, topico_id: '' });
  const setTopicoCrono = (v) => definirContexto({ topico_id: v });
  const setTipoCrono = (v) => definirContexto({ tipo: v });

  const [fecharSessao, setFecharSessao] = useState(false);
  const [extras, setExtras] = useState({ questoes: '', acertos: '', erros: '', obs: '' });
  const [agendar, setAgendar] = useState(true);
  const [aviso, setAviso] = useState('');

  async function registrarSessao() {
    const segundos = decorrido;
    if (segundos < 60) {
      setAviso('A sessão precisa ter pelo menos 1 minuto.');
      return;
    }

    const resultado = await adicionarRegistro({
      data: hoje(),
      disciplina_id: discCrono,
      topico_id: topicoCrono,
      tipo: tipoCrono,
      segundos,
      questoes: Number(extras.questoes) || 0,
      acertos: Number(extras.acertos) || 0,
      erros: Number(extras.erros) || 0,
      obs: extras.obs,
      origem: 'cronometro',
    });

    if (resultado?.ok) {
      if (agendar && topicoCrono) {
        await agendarRevisoes(topicoCrono, hoje(), [7, 15, 30]);
        setAviso(`Sessão de ${horasCurtas(segundos)} registrada. Revisões agendadas para 7, 15 e 30 dias.`);
      } else {
        setAviso(`Sessão de ${horasCurtas(segundos)} registrada.`);
      }
      setExtras({ questoes: '', acertos: '', erros: '', obs: '' });
      setFecharSessao(false);
      zerar();
    }
  }

  const topicosCrono = useMemo(
    () => listarTopicos(disciplinas, discCrono),
    [disciplinas, discCrono]
  );

  if (carregando) return <div className="pagina">Carregando…</div>;

  return (
    <div className="pagina">
      <h1>Estudar</h1>
      <p className="subtitulo">Use o cronômetro durante o estudo ou anote depois, à mão.</p>

      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      <div className="cartao cronometro">
        <div className="crono-display">{relogio(decorrido)}</div>

        <div className="crono-campos">
          <select value={discCrono} onChange={(e) => { setDiscCrono(e.target.value); setTopicoCrono(''); }}>
            <option value="">Disciplina…</option>
            {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>

          <select value={topicoCrono} onChange={(e) => setTopicoCrono(e.target.value)} disabled={!discCrono}>
            <option value="">Tópico (opcional)…</option>
            {topicosCrono.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>

          <select value={tipoCrono} onChange={(e) => setTipoCrono(e.target.value)}>
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
            onClick={() => setFecharSessao(true)}
          >
            Registrar
          </button>

          <button className="botao botao-claro" type="button" onClick={zerar} disabled={decorrido === 0}>
            Zerar
          </button>
        </div>

        {fecharSessao && (
          <div className="crono-fechamento">
            <p className="crono-fechamento-titulo">
              Fechando {horasCurtas(decorrido)} de {TIPOS.find((t) => t.id === tipoCrono)?.rotulo.toLowerCase()}
            </p>
            <div className="linha-campos">
              <span>
                <label>Questões</label>
                <input type="number" min="0" value={extras.questoes}
                  onChange={(e) => setExtras({ ...extras, questoes: e.target.value })} />
              </span>
              <span>
                <label>Acertos</label>
                <input type="number" min="0" value={extras.acertos}
                  onChange={(e) => setExtras({ ...extras, acertos: e.target.value })} />
              </span>
              <span>
                <label>Erros</label>
                <input type="number" min="0" value={extras.erros}
                  onChange={(e) => setExtras({ ...extras, erros: e.target.value })} />
              </span>
            </div>
            <label>Observação</label>
            <input type="text" value={extras.obs} placeholder="O que travou? O que revisar?"
              onChange={(e) => setExtras({ ...extras, obs: e.target.value })} />

            {topicoCrono && (
              <label className="caixa-linha">
                <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} />
                Agendar revisões deste tópico para 7, 15 e 30 dias
              </label>
            )}

            <button className="botao botao-destaque" type="button" onClick={registrarSessao}>
              Salvar sessão
            </button>
          </div>
        )}
      </div>

      <RegistroManual disciplinas={disciplinas} adicionarRegistro={adicionarRegistro} setAviso={setAviso} />

      <Historico registros={registros} disciplinas={disciplinas} excluirRegistro={excluirRegistro} />
    </div>
  );
}

function listarTopicos(disciplinas, discId) {
  const d = disciplinas.find((x) => x.id === discId);
  if (!d) return [];
  return d.grupos.flatMap((g) => g.topicos);
}

function RegistroManual({ disciplinas, adicionarRegistro, setAviso }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    data: hoje(), disciplina_id: '', topico_id: '', tipo: 'teoria',
    horas: '', minutos: '', questoes: '', acertos: '', erros: '', obs: '',
  });
  const [erro, setErro] = useState('');

  const topicos = useMemo(
    () => listarTopicos(disciplinas, form.disciplina_id),
    [disciplinas, form.disciplina_id]
  );

  async function salvar() {
    const segundos = (Number(form.horas) || 0) * 3600 + (Number(form.minutos) || 0) * 60;
    const questoes = Number(form.questoes) || 0;

    if (segundos === 0 && questoes === 0) {
      setErro('Informe o tempo estudado ou a quantidade de questões.');
      return;
    }

    setErro('');
    const r = await adicionarRegistro({
      data: form.data,
      disciplina_id: form.disciplina_id,
      topico_id: form.topico_id,
      tipo: form.tipo,
      segundos,
      questoes,
      acertos: Number(form.acertos) || 0,
      erros: Number(form.erros) || 0,
      obs: form.obs,
      origem: 'manual',
    });

    if (r?.ok) {
      setAviso('Estudo anotado.');
      setForm({ ...form, horas: '', minutos: '', questoes: '', acertos: '', erros: '', obs: '' });
      setAberto(false);
    }
  }

  if (!aberto) {
    return (
      <button className="botao botao-claro largura-total" type="button" onClick={() => setAberto(true)}>
        + Anotar um estudo que já fiz
      </button>
    );
  }

  return (
    <div className="cartao" style={{ marginTop: 16 }}>
      <h2>Anotar estudo</h2>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="linha-campos">
        <span>
          <label>Data</label>
          <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </span>
        <span>
          <label>Horas</label>
          <input type="number" min="0" value={form.horas}
            onChange={(e) => setForm({ ...form, horas: e.target.value })} />
        </span>
        <span>
          <label>Minutos</label>
          <input type="number" min="0" max="59" value={form.minutos}
            onChange={(e) => setForm({ ...form, minutos: e.target.value })} />
        </span>
      </div>

      <label>Disciplina</label>
      <select value={form.disciplina_id}
        onChange={(e) => setForm({ ...form, disciplina_id: e.target.value, topico_id: '' })}>
        <option value="">Selecione…</option>
        {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
      </select>

      <label>Tópico (opcional)</label>
      <select value={form.topico_id} disabled={!form.disciplina_id}
        onChange={(e) => setForm({ ...form, topico_id: e.target.value })}>
        <option value="">Selecione…</option>
        {topicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </select>

      <label>Tipo de estudo</label>
      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
        {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.rotulo}</option>)}
      </select>

      <div className="linha-campos">
        <span>
          <label>Questões</label>
          <input type="number" min="0" value={form.questoes}
            onChange={(e) => setForm({ ...form, questoes: e.target.value })} />
        </span>
        <span>
          <label>Acertos</label>
          <input type="number" min="0" value={form.acertos}
            onChange={(e) => setForm({ ...form, acertos: e.target.value })} />
        </span>
        <span>
          <label>Erros</label>
          <input type="number" min="0" value={form.erros}
            onChange={(e) => setForm({ ...form, erros: e.target.value })} />
        </span>
      </div>

      <label>Observação</label>
      <input type="text" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />

      <div className="crono-botoes">
        <button className="botao botao-destaque" type="button" onClick={salvar}>Salvar</button>
        <button className="botao botao-claro" type="button" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </div>
  );
}

function Historico({ registros, disciplinas, excluirRegistro }) {
  const nomes = useMemo(() => {
    const mapa = {};
    for (const d of disciplinas) {
      mapa[d.id] = d.nome;
      for (const g of d.grupos) for (const t of g.topicos) mapa[t.id] = t.nome;
    }
    return mapa;
  }, [disciplinas]);

  const porDia = useMemo(() => {
    const grupos = {};
    for (const r of registros) (grupos[r.data] ??= []).push(r);
    return Object.entries(grupos).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 30);
  }, [registros]);

  if (registros.length === 0) {
    return <p className="vazio">Nenhum estudo registrado ainda. Comece pelo cronômetro.</p>;
  }

  return (
    <div style={{ marginTop: 28 }}>
      <h2>Histórico</h2>

      {porDia.map(([dia, lista]) => {
        const segundos = lista.reduce((s, r) => s + (r.segundos ?? 0), 0);
        const [ano, mes, d] = dia.split('-');

        return (
          <div className="cartao dia" key={dia}>
            <div className="dia-topo">
              <b>{d}/{mes}/{ano}</b>
              <span>{horasCurtas(segundos)}</span>
            </div>

            {lista.map((r) => {
              const respondidas = (r.acertos ?? 0) + (r.erros ?? 0);
              return (
                <div className="registro" key={r.id}>
                  <div className="registro-texto">
                    <b>{nomes[r.disciplina_id] ?? 'Sem disciplina'}</b>
                    {r.topico_id && <span className="registro-topico"> · {nomes[r.topico_id]}</span>}
                    <div className="registro-detalhe">
                      {horasCurtas(r.segundos ?? 0)}
                      {r.tipo && ` · ${TIPOS.find((t) => t.id === r.tipo)?.rotulo ?? r.tipo}`}
                      {r.questoes > 0 && ` · ${r.questoes} questões`}
                      {respondidas > 0 && ` · ${Math.round((r.acertos / respondidas) * 100)}% de acerto`}
                      {r.origem === 'cronometro' && ' · cronômetro'}
                    </div>
                    {r.obs && <div className="registro-obs">{r.obs}</div>}
                  </div>
                  <button
                    className="botao-texto"
                    type="button"
                    title="Excluir este registro"
                    onClick={() => excluirRegistro(r.id)}
                  >
                    excluir
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
