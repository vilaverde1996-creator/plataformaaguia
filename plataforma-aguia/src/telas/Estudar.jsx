import { useState } from 'react';
import { useDados } from '../lib/dados.jsx';
import { horasCurtas } from '../lib/cronometro.jsx';
import { TIPOS, hoje } from './FecharEstudo.jsx';
import Ciclo from './Ciclo.jsx';

// Aba "Estudar": o que estudar agora (o ciclo), mais o registro de
// estudos feitos fora da plataforma e o histórico. O cronômetro tem
// aba própria.
export default function Estudar({ irPara }) {
  const { registros, adicionarRegistro, excluirRegistro, disciplinas, carregando } = useDados();
  const [aviso, setAviso] = useState('');

  if (carregando) return <div className="pagina">Carregando…</div>;

  return (
    <>
      <Ciclo irPara={irPara} />

      <div className="pagina" style={{ paddingTop: 0 }}>
        {aviso && <div className="aviso aviso-ok">{aviso}</div>}

        <RegistroManual
          disciplinas={disciplinas}
          adicionarRegistro={adicionarRegistro}
          setAviso={setAviso}
        />

        <Historico
          registros={registros}
          disciplinas={disciplinas}
          excluirRegistro={excluirRegistro}
        />
      </div>
    </>
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
