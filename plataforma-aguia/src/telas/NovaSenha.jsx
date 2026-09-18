import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useSessao } from '../lib/sessao.jsx';

export default function NovaSenha() {
  const { setRecuperandoSenha } = useSessao();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar(evento) {
    evento.preventDefault();
    if (senha.length < 8) {
      setErro('Use pelo menos 8 caracteres.');
      return;
    }
    setErro('');
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) setErro(error.message);
    else setRecuperandoSenha(false);
  }

  return (
    <div className="entrada">
      <div className="entrada-caixa">
        <h1 className="marca">Nova senha</h1>
        <p className="entrada-legenda">Escolha uma senha para continuar.</p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <form onSubmit={salvar}>
          <label htmlFor="nova">Senha</label>
          <input
            id="nova"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
