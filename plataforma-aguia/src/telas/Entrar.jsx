import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [recado, setRecado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha não conferem.'
          : error.message
      );
    }
  }

  async function recuperar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setEnviando(false);
    if (error) setErro(error.message);
    else setRecado('Enviamos um link para o seu e-mail. Abra por ele para criar uma senha nova.');
  }

  return (
    <div className="entrada">
      <div className="entrada-caixa">
        <img src="/logo-aguia.png" alt="Asas de Águia" className="logo-entrada" />
        <h1 className="marca">Asas de <span>Águia</span></h1>
        <p className="entrada-legenda">
          {modoRecuperar
            ? 'Informe seu e-mail e enviamos um link para criar uma senha nova.'
            : 'Voe mais alto. Entre para acompanhar seus estudos.'}
        </p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}
        {recado && <div className="aviso aviso-ok">{recado}</div>}

        <form onSubmit={modoRecuperar ? recuperar : entrar}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          {!modoRecuperar && (
            <>
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </>
          )}

          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? 'Aguarde…' : modoRecuperar ? 'Enviar link' : 'Entrar'}
          </button>
        </form>

        <button
          className="botao-texto"
          type="button"
          onClick={() => { setModoRecuperar(!modoRecuperar); setErro(''); setRecado(''); }}
        >
          {modoRecuperar ? 'Voltar para o login' : 'Esqueci minha senha'}
        </button>
      </div>
    </div>
  );
}
