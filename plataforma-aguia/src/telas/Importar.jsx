import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  lerCSV, prepararQuestoes, indexarEdital, MODELO_EDITAL, MODELO_QUESTOES,
} from '../lib/planilha.js';

function baixar(nome, conteudo, tipo = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Importar() {
  const [editais, setEditais] = useState([]);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    supabase
      .from('editais')
      .select('id, nome, orgao, banca, cargo, ano')
      .order('criado_em', { ascending: false })
      .then(({ data }) => setEditais(data ?? []));
  }, [recarregar]);

  return (
    <div className="pagina">
      <h1>Importar</h1>
      <p className="subtitulo">Cadastre editais e questões em lote, sem digitar um a um.</p>

      <ImportarEdital aoTerminar={() => setRecarregar((n) => n + 1)} />
      <ImportarQuestoes editais={editais} />
    </div>
  );
}

function ImportarEdital({ aoTerminar }) {
  const [form, setForm] = useState({ nome: '', orgao: '', banca: '', cargo: '', ano: '' });
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState({ tipo: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);

  const previa = useMemo(() => {
    let disciplinas = 0;
    let topicos = 0;
    for (const linha of texto.split('\n')) {
      const l = linha.trim();
      if (!l) continue;
      if (l.startsWith('##')) continue;
      if (l.startsWith('#')) disciplinas += 1;
      else topicos += 1;
    }
    return { disciplinas, topicos };
  }, [texto]);

  async function importar() {
    if (!form.nome.trim()) {
      setEstado({ tipo: 'erro', mensagem: 'Dê um nome ao edital.' });
      return;
    }
    setEnviando(true);
    setEstado({ tipo: '', mensagem: '' });

    const { data, error } = await supabase.rpc('criar_edital', {
      p_nome: form.nome.trim(),
      p_orgao: form.orgao.trim() || null,
      p_banca: form.banca.trim() || null,
      p_cargo: form.cargo.trim() || null,
      p_ano: form.ano ? Number(form.ano) : null,
      p_texto: texto,
    });

    setEnviando(false);
    if (error) {
      setEstado({ tipo: 'erro', mensagem: error.message });
      return;
    }
    setEstado({
      tipo: 'ok',
      mensagem: `Pronto: ${data.disciplinas_novas} disciplinas novas e ${data.topicos_novos} tópicos novos. ` +
        `O edital tem agora ${data.topicos_total} tópicos.`,
    });
    setTexto('');
    aoTerminar?.();
  }

  return (
    <div className="cartao" style={{ marginBottom: 20 }}>
      <h2>Edital completo</h2>
      <p className="subtitulo">
        Cole o edital verticalizado. Uma cerquilha (#) marca a disciplina, duas (##) marcam um
        grupo, e as demais linhas viram tópicos. Numeração e marcadores são limpos sozinhos.
      </p>

      <button className="botao botao-claro" type="button"
        onClick={() => baixar('modelo-edital.txt', MODELO_EDITAL)}>
        Baixar modelo de edital
      </button>

      {estado.mensagem && (
        <div className={`aviso ${estado.tipo === 'erro' ? 'aviso-erro' : 'aviso-ok'}`} style={{ marginTop: 14 }}>
          {estado.mensagem}
        </div>
      )}

      <div className="linha-campos" style={{ marginTop: 14 }}>
        <span>
          <label>Nome do edital</label>
          <input type="text" value={form.nome} placeholder="Banco do Brasil - Escriturário"
            onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </span>
        <span>
          <label>Órgão</label>
          <input type="text" value={form.orgao}
            onChange={(e) => setForm({ ...form, orgao: e.target.value })} />
        </span>
      </div>

      <div className="linha-campos">
        <span>
          <label>Banca</label>
          <input type="text" value={form.banca}
            onChange={(e) => setForm({ ...form, banca: e.target.value })} />
        </span>
        <span>
          <label>Cargo</label>
          <input type="text" value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
        </span>
        <span>
          <label>Ano</label>
          <input type="number" value={form.ano}
            onChange={(e) => setForm({ ...form, ano: e.target.value })} />
        </span>
      </div>

      <label>Conteúdo do edital</label>
      <textarea
        className="area-texto"
        rows={12}
        value={texto}
        placeholder={'# LÍNGUA PORTUGUESA\n## Sintaxe\n1. Regência verbal\n2. Concordância'}
        onChange={(e) => setTexto(e.target.value)}
      />

      {texto.trim() && (
        <p className="previa">
          Prévia: {previa.disciplinas} disciplinas e {previa.topicos} tópicos serão processados.
        </p>
      )}

      <button className="botao botao-destaque" type="button" disabled={enviando || !texto.trim()}
        onClick={importar}>
        {enviando ? 'Importando…' : 'Importar edital'}
      </button>

      <p className="subtitulo" style={{ margin: '12px 0 0' }}>
        Importar de novo o mesmo edital não duplica nada: só entra o que ainda não existe.
      </p>
    </div>
  );
}

function ImportarQuestoes({ editais }) {
  const [editalId, setEditalId] = useState('');
  const [texto, setTexto] = useState('');
  const [arvore, setArvore] = useState([]);
  const [estado, setEstado] = useState({ tipo: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!editalId) { setArvore([]); return; }
    supabase
      .from('disciplinas')
      .select('id, nome, grupos(id, nome, topicos(id, nome))')
      .eq('edital_id', editalId)
      .then(({ data }) => setArvore(data ?? []));
  }, [editalId]);

  const analise = useMemo(() => {
    if (!texto.trim() || !editalId) return null;
    const { cabecalho, linhas } = lerCSV(texto);
    if (!cabecalho.includes('enunciado')) {
      return { erroGeral: 'A planilha precisa ter uma coluna chamada "enunciado". Use o modelo.' };
    }
    return prepararQuestoes(linhas, indexarEdital(arvore), editalId);
  }, [texto, editalId, arvore]);

  function lerArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setTexto(String(leitor.result ?? ''));
    leitor.readAsText(arquivo, 'utf-8');
  }

  async function importar() {
    if (!analise?.prontas?.length) return;
    setEnviando(true);
    setEstado({ tipo: '', mensagem: '' });

    const { data, error } = await supabase.rpc('importar_questoes', { p_lista: analise.prontas });

    setEnviando(false);
    if (error) {
      setEstado({ tipo: 'erro', mensagem: error.message });
      return;
    }
    const falhas = data?.erros?.length ?? 0;
    setEstado({
      tipo: 'ok',
      mensagem: `${data.importadas} questões importadas` + (falhas ? `, ${falhas} recusadas pelo banco.` : '.'),
    });
    setTexto('');
  }

  return (
    <div className="cartao">
      <h2>Questões prontas</h2>
      <p className="subtitulo">
        Preencha a planilha modelo no Excel ou no Google Planilhas, salve como CSV e envie aqui.
        As questões são ligadas ao tópico do edital pelo nome, e é isso que faz o desempenho do
        aluno aparecer no tópico certo.
      </p>

      <button className="botao botao-claro" type="button"
        onClick={() => baixar('modelo-questoes.csv', MODELO_QUESTOES, 'text/csv;charset=utf-8')}>
        Baixar planilha modelo
      </button>

      {estado.mensagem && (
        <div className={`aviso ${estado.tipo === 'erro' ? 'aviso-erro' : 'aviso-ok'}`} style={{ marginTop: 14 }}>
          {estado.mensagem}
        </div>
      )}

      <label style={{ marginTop: 14 }}>Edital de destino</label>
      <select value={editalId} onChange={(e) => setEditalId(e.target.value)}>
        <option value="">Selecione…</option>
        {editais.map((e) => (
          <option key={e.id} value={e.id}>{e.nome}{e.cargo ? ` — ${e.cargo}` : ''}</option>
        ))}
      </select>

      <label>Arquivo CSV</label>
      <input type="file" accept=".csv,.txt,.tsv" onChange={lerArquivo} />

      <label>Ou cole o conteúdo da planilha</label>
      <textarea
        className="area-texto"
        rows={7}
        value={texto}
        placeholder="disciplina;topico;enunciado;a;b;c;d;e;gabarito;comentario;banca;orgao;ano;dificuldade"
        onChange={(e) => setTexto(e.target.value)}
      />

      {!editalId && texto.trim() && (
        <div className="aviso aviso-erro">Escolha o edital de destino para conferir a planilha.</div>
      )}

      {analise?.erroGeral && <div className="aviso aviso-erro">{analise.erroGeral}</div>}

      {analise && !analise.erroGeral && (
        <div className="conferencia">
          <p>
            <b>{analise.prontas.length}</b> questões prontas para importar
            {analise.prontas.filter((q) => q.topico_id).length > 0 &&
              ` · ${analise.prontas.filter((q) => q.topico_id).length} já ligadas a um tópico`}
          </p>

          {analise.problemas.length > 0 && (
            <div className="aviso aviso-erro">
              <b>{analise.problemas.length} linhas serão ignoradas:</b>
              <ul>
                {analise.problemas.slice(0, 5).map((p) => (
                  <li key={p.linha}>linha {p.linha}: {p.erro}</li>
                ))}
                {analise.problemas.length > 5 && <li>…e mais {analise.problemas.length - 5}.</li>}
              </ul>
            </div>
          )}

          {analise.avisos.length > 0 && (
            <div className="aviso aviso-atencao">
              <b>{analise.avisos.length} avisos:</b>
              <ul>
                {analise.avisos.slice(0, 5).map((a, i) => (
                  <li key={i}>linha {a.linha}: {a.aviso}</li>
                ))}
                {analise.avisos.length > 5 && <li>…e mais {analise.avisos.length - 5}.</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        className="botao botao-destaque"
        type="button"
        disabled={enviando || !analise?.prontas?.length}
        onClick={importar}
      >
        {enviando ? 'Importando…' : `Importar ${analise?.prontas?.length ?? 0} questões`}
      </button>
    </div>
  );
}
