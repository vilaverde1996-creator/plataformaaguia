import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useDados } from '../lib/dados.jsx';

export default function Aulas() {
  const { mentoria, disciplinas } = useDados();
  const [materiais, setMateriais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abrindo, setAbrindo] = useState('');

  useEffect(() => {
    if (!mentoria) return;
    let ativo = true;

    (async () => {
      setCarregando(true);
      const { data, error } = await supabase
        .from('materiais')
        .select('id, titulo, descricao, tipo, caminho, url, paginas, disciplina_id, topico_id, ordem')
        .eq('publicado', true)
        .eq('edital_id', mentoria.edital_id)
        .order('ordem', { ascending: true });

      if (!ativo) return;
      if (error) setErro(error.message);
      setMateriais(data ?? []);
      setCarregando(false);
    })();

    return () => { ativo = false; };
  }, [mentoria?.id]);

  const nomes = useMemo(() => {
    const mapa = {};
    for (const d of disciplinas) {
      mapa[d.id] = d.nome;
      for (const g of d.grupos) for (const t of g.topicos) mapa[t.id] = t.nome;
    }
    return mapa;
  }, [disciplinas]);

  const porDisciplina = useMemo(() => {
    const grupos = new Map();
    for (const m of materiais) {
      const chave = m.disciplina_id ?? 'geral';
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(m);
    }
    return [...grupos.entries()];
  }, [materiais]);

  // O PDF não tem link público: pedimos um link temporário na hora.
  async function abrir(material) {
    setErro('');
    setAbrindo(material.id);

    if (material.tipo !== 'pdf' && material.url) {
      window.open(material.url, '_blank', 'noopener');
      setAbrindo('');
      return;
    }

    const { data, error } = await supabase
      .storage
      .from('materiais')
      .createSignedUrl(material.caminho, 3600);

    setAbrindo('');
    if (error) {
      setErro('Não foi possível abrir o arquivo: ' + error.message);
      return;
    }

    supabase.from('material_acessos')
      .insert({ mentoria_id: mentoria.id, material_id: material.id })
      .then(() => {});

    window.open(data.signedUrl, '_blank', 'noopener');
  }

  if (carregando) return <div className="pagina">Carregando aulas…</div>;

  return (
    <div className="pagina">
      <h1>Aulas e materiais</h1>
      <p className="subtitulo">Os PDFs liberados pela sua mentora para este edital.</p>

      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {materiais.length === 0 && (
        <p className="vazio">Nenhum material publicado ainda. Assim que sua mentora subir, aparece aqui.</p>
      )}

      {porDisciplina.map(([chave, lista]) => (
        <div className="cartao" style={{ marginBottom: 14 }} key={chave}>
          <h2>{nomes[chave] ?? 'Materiais gerais'}</h2>
          {lista.map((m) => (
            <div className="registro" key={m.id}>
              <span className="material-icone">{m.tipo === 'pdf' ? '📄' : '🔗'}</span>
              <div className="registro-texto">
                <b>{m.titulo}</b>
                <div className="registro-detalhe">
                  {m.topico_id && `${nomes[m.topico_id]} · `}
                  {m.paginas ? `${m.paginas} páginas` : m.tipo.toUpperCase()}
                </div>
                {m.descricao && <div className="registro-obs">{m.descricao}</div>}
              </div>
              <button className="botao botao-claro" type="button"
                disabled={abrindo === m.id} onClick={() => abrir(m)}>
                {abrindo === m.id ? 'Abrindo…' : 'Abrir'}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
