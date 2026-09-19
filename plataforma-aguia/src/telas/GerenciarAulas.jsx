import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function caminhoSeguro(nome) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export default function GerenciarAulas() {
  const [editais, setEditais] = useState([]);
  const [editalId, setEditalId] = useState('');
  const [disciplinas, setDisciplinas] = useState([]);
  const [materiais, setMateriais] = useState([]);

  const [form, setForm] = useState({ titulo: '', descricao: '', disciplina_id: '', topico_id: '' });
  const [arquivo, setArquivo] = useState(null);
  const [estado, setEstado] = useState({ tipo: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.from('editais').select('id, nome, cargo').order('criado_em', { ascending: false })
      .then(({ data }) => setEditais(data ?? []));
  }, []);

  useEffect(() => {
    if (!editalId) { setDisciplinas([]); setMateriais([]); return; }
    let ativo = true;

    (async () => {
      const [{ data: discs }, { data: mats }] = await Promise.all([
        supabase.from('disciplinas').select('id, nome, ordem, grupos(id, topicos(id, nome))').eq('edital_id', editalId),
        supabase.from('materiais').select('id, titulo, publicado, caminho, disciplina_id, criado_em')
          .eq('edital_id', editalId).order('criado_em', { ascending: false }),
      ]);
      if (!ativo) return;
      setDisciplinas([...(discs ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)));
      setMateriais(mats ?? []);
    })();

    return () => { ativo = false; };
  }, [editalId]);

  const topicos = useMemo(() => {
    const d = disciplinas.find((x) => x.id === form.disciplina_id);
    return d ? (d.grupos ?? []).flatMap((g) => g.topicos ?? []) : [];
  }, [disciplinas, form.disciplina_id]);

  async function enviar() {
    if (!editalId || !arquivo || !form.titulo.trim()) {
      setEstado({ tipo: 'erro', mensagem: 'Escolha o edital, dê um título e selecione o arquivo.' });
      return;
    }

    setEnviando(true);
    setEstado({ tipo: '', mensagem: '' });

    const caminho = `${editalId}/${Date.now()}-${caminhoSeguro(arquivo.name)}`;

    const { error: erroUpload } = await supabase
      .storage
      .from('materiais')
      .upload(caminho, arquivo, { contentType: arquivo.type || 'application/pdf', upsert: false });

    if (erroUpload) {
      setEnviando(false);
      setEstado({ tipo: 'erro', mensagem: 'Falha no envio: ' + erroUpload.message });
      return;
    }

    const { data, error } = await supabase
      .from('materiais')
      .insert({
        edital_id: editalId,
        disciplina_id: form.disciplina_id || null,
        topico_id: form.topico_id || null,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        tipo: 'pdf',
        caminho,
        tamanho_bytes: arquivo.size,
        publicado: true,
        ordem: materiais.length,
      })
      .select('id, titulo, publicado, caminho, disciplina_id, criado_em')
      .single();

    setEnviando(false);
    if (error) {
      setEstado({ tipo: 'erro', mensagem: error.message });
      return;
    }

    setMateriais((m) => [data, ...m]);
    setForm({ titulo: '', descricao: '', disciplina_id: '', topico_id: '' });
    setArquivo(null);
    setEstado({ tipo: 'ok', mensagem: 'Aula publicada. Os alunos deste edital já conseguem abrir.' });
  }

  async function alternarPublicacao(material) {
    const novo = !material.publicado;
    setMateriais((m) => m.map((x) => (x.id === material.id ? { ...x, publicado: novo } : x)));
    await supabase.from('materiais').update({ publicado: novo }).eq('id', material.id);
  }

  async function excluir(material) {
    setMateriais((m) => m.filter((x) => x.id !== material.id));
    await supabase.from('materiais').delete().eq('id', material.id);
    if (material.caminho) await supabase.storage.from('materiais').remove([material.caminho]);
  }

  return (
    <div className="pagina">
      <h1>Aulas em PDF</h1>
      <p className="subtitulo">
        Os arquivos ficam protegidos: só quem é aluno do edital abre, por link temporário.
      </p>

      {estado.mensagem && (
        <div className={`aviso ${estado.tipo === 'erro' ? 'aviso-erro' : 'aviso-ok'}`}>
          {estado.mensagem}
        </div>
      )}

      <div className="cartao" style={{ marginBottom: 16 }}>
        <h2>Publicar uma aula</h2>

        <label>Edital</label>
        <select value={editalId} onChange={(e) => setEditalId(e.target.value)}>
          <option value="">Selecione…</option>
          {editais.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}{e.cargo ? ` — ${e.cargo}` : ''}</option>
          ))}
        </select>

        <label>Título</label>
        <input type="text" value={form.titulo} placeholder="Resumo de Regência Verbal"
          onChange={(e) => setForm({ ...form, titulo: e.target.value })} />

        <label>Descrição (opcional)</label>
        <input type="text" value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })} />

        <div className="linha-campos">
          <span>
            <label>Disciplina</label>
            <select value={form.disciplina_id}
              onChange={(e) => setForm({ ...form, disciplina_id: e.target.value, topico_id: '' })}>
              <option value="">Geral</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </span>
          <span>
            <label>Tópico (opcional)</label>
            <select value={form.topico_id} disabled={!form.disciplina_id}
              onChange={(e) => setForm({ ...form, topico_id: e.target.value })}>
              <option value="">Nenhum</option>
              {topicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </span>
        </div>

        <label>Arquivo PDF</label>
        <input type="file" accept="application/pdf"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />

        <button className="botao botao-destaque" type="button" disabled={enviando} onClick={enviar}>
          {enviando ? 'Enviando…' : 'Publicar aula'}
        </button>
      </div>

      {editalId && (
        <div className="cartao">
          <h2>Aulas deste edital</h2>
          {materiais.length === 0 && <p className="subtitulo" style={{ margin: 0 }}>Nenhuma ainda.</p>}
          {materiais.map((m) => (
            <div className="registro" key={m.id}>
              <span className="material-icone">📄</span>
              <div className="registro-texto">
                <b>{m.titulo}</b>
                <div className="registro-detalhe">
                  {m.publicado ? 'publicada' : 'rascunho, invisível para os alunos'}
                </div>
              </div>
              <button className="botao-texto" type="button" onClick={() => alternarPublicacao(m)}>
                {m.publicado ? 'despublicar' : 'publicar'}
              </button>
              <button className="botao-texto" type="button" onClick={() => excluir(m)}>excluir</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
