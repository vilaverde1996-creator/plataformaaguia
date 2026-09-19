import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useSessao } from '../lib/sessao.jsx';
import { useDados } from '../lib/dados.jsx';

export default function Perfil() {
  const { sessao, perfil } = useSessao();
  const { mentorias, mentoria } = useDados();

  const [form, setForm] = useState({
    nome: '', telefone: '', data_nascimento: '', cidade: '', objetivo: '',
  });
  const [metas, setMetas] = useState({ meta_horas: '', meta_questoes: '', meta_aprovamento: '' });
  const [senha, setSenha] = useState('');
  const [estado, setEstado] = useState({ tipo: '', mensagem: '' });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!sessao?.user) return;
    supabase
      .from('perfis')
      .select('nome, telefone, data_nascimento, cidade, objetivo')
      .eq('id', sessao.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome ?? '',
            telefone: data.telefone ?? '',
            data_nascimento: data.data_nascimento ?? '',
            cidade: data.cidade ?? '',
            objetivo: data.objetivo ?? '',
          });
        }
      });
  }, [sessao?.user?.id]);

  useEffect(() => {
    if (!mentoria) return;
    setMetas({
      meta_horas: mentoria.meta_horas ?? '',
      meta_questoes: mentoria.meta_questoes ?? '',
      meta_aprovamento: mentoria.meta_aprovamento ?? '',
    });
  }, [mentoria?.id]);

  async function salvarDados() {
    setSalvando(true);
    setEstado({ tipo: '', mensagem: '' });

    const { error } = await supabase
      .from('perfis')
      .update({
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        data_nascimento: form.data_nascimento || null,
        cidade: form.cidade.trim() || null,
        objetivo: form.objetivo.trim() || null,
      })
      .eq('id', sessao.user.id);

    setSalvando(false);
    setEstado(error
      ? { tipo: 'erro', mensagem: error.message }
      : { tipo: 'ok', mensagem: 'Dados salvos.' });
  }

  async function salvarMetas() {
    if (!mentoria) return;
    setSalvando(true);

    const { error } = await supabase
      .from('mentorias')
      .update({
        meta_horas: metas.meta_horas === '' ? null : Number(metas.meta_horas),
        meta_questoes: metas.meta_questoes === '' ? null : Number(metas.meta_questoes),
        meta_aprovamento: metas.meta_aprovamento === '' ? null : Number(metas.meta_aprovamento),
      })
      .eq('id', mentoria.id);

    setSalvando(false);
    setEstado(error
      ? { tipo: 'erro', mensagem: error.message }
      : { tipo: 'ok', mensagem: 'Metas atualizadas. Recarregue para ver nos indicadores.' });
  }

  async function trocarSenha() {
    if (senha.length < 8) {
      setEstado({ tipo: 'erro', mensagem: 'A senha precisa ter pelo menos 8 caracteres.' });
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    setSenha('');
    setEstado(error
      ? { tipo: 'erro', mensagem: error.message }
      : { tipo: 'ok', mensagem: 'Senha alterada.' });
  }

  return (
    <div className="pagina">
      <h1>Meu perfil</h1>
      <p className="subtitulo">Seus dados, suas metas e sua senha.</p>

      {estado.mensagem && (
        <div className={`aviso ${estado.tipo === 'erro' ? 'aviso-erro' : 'aviso-ok'}`}>
          {estado.mensagem}
        </div>
      )}

      <div className="cartao" style={{ marginBottom: 16 }}>
        <h2>Dados pessoais</h2>

        <label>Nome completo</label>
        <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />

        <label>E-mail</label>
        <input type="email" value={perfil?.email ?? sessao?.user?.email ?? ''} disabled />

        <div className="linha-campos">
          <span>
            <label>WhatsApp</label>
            <input type="tel" value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </span>
          <span>
            <label>Nascimento</label>
            <input type="date" value={form.data_nascimento}
              onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
          </span>
        </div>

        <label>Cidade</label>
        <input type="text" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />

        <label>Meu objetivo</label>
        <input type="text" value={form.objetivo} placeholder="Ex: passar na Transpetro em 2026"
          onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />

        <button className="botao botao-destaque" type="button" disabled={salvando} onClick={salvarDados}>
          Salvar dados
        </button>
      </div>

      {mentoria && (
        <div className="cartao" style={{ marginBottom: 16 }}>
          <h2>Minhas metas</h2>
          <div className="linha-campos">
            <span>
              <label>Horas por semana</label>
              <input type="number" min="0" value={metas.meta_horas}
                onChange={(e) => setMetas({ ...metas, meta_horas: e.target.value })} />
            </span>
            <span>
              <label>Questões por semana</label>
              <input type="number" min="0" value={metas.meta_questoes}
                onChange={(e) => setMetas({ ...metas, meta_questoes: e.target.value })} />
            </span>
            <span>
              <label>Acerto desejado (%)</label>
              <input type="number" min="0" max="100" value={metas.meta_aprovamento}
                onChange={(e) => setMetas({ ...metas, meta_aprovamento: e.target.value })} />
            </span>
          </div>
          <button className="botao botao-destaque" type="button" disabled={salvando} onClick={salvarMetas}>
            Salvar metas
          </button>
        </div>
      )}

      <div className="cartao" style={{ marginBottom: 16 }}>
        <h2>Minhas mentorias</h2>
        {mentorias.length === 0 && (
          <p className="subtitulo" style={{ margin: 0 }}>Nenhum edital liberado ainda.</p>
        )}
        {mentorias.map((m) => (
          <div className="registro" key={m.id}>
            <div className="registro-texto">
              <b>{m.nomeEdital}</b>
              <div className="registro-detalhe">
                {m.data_prova ? `Prova em ${m.data_prova.split('-').reverse().join('/')}` : 'Sem data de prova'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cartao">
        <h2>Trocar senha</h2>
        <label>Nova senha</label>
        <input type="password" value={senha} autoComplete="new-password"
          onChange={(e) => setSenha(e.target.value)} />
        <button className="botao botao-claro" type="button" disabled={salvando || !senha} onClick={trocarSenha}>
          Alterar senha
        </button>
      </div>
    </div>
  );
}
