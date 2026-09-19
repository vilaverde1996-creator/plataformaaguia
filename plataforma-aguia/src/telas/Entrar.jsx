import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [recado, setRecado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [cadastro, setCadastro] = useState({
    nome: '', telefone: '', nascimento: '', senha2: '',
  });

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

  function telefoneValido(valor) {
    return valor.replace(/\D/g, '').length >= 10;   // DDD + número
  }

  async function criarConta(evento) {
    evento.preventDefault();
    setErro('');
    setRecado('');

    if (cadastro.nome.trim().split(' ').filter(Boolean).length < 2) {
      setErro('Informe seu nome completo.');
      return;
    }
    if (!telefoneValido(cadastro.telefone)) {
      setErro('Informe o WhatsApp com DDD.');
      return;
    }
    if (!cadastro.nascimento) {
      setErro('Informe sua data de nascimento.');
      return;
    }
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== cadastro.senha2) {
      setErro('As duas senhas não são iguais.');
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nome: cadastro.nome.trim(),
          telefone: cadastro.telefone.trim(),
          data_nascimento: cadastro.nascimento,
        },
      },
    });
    setEnviando(false);

    if (error) {
      setErro(
        error.message.includes('already registered')
          ? 'Já existe uma conta com esse e-mail. Tente entrar ou recuperar a senha.'
          : error.message
      );
      return;
    }

    setRecado(
      'Conta criada! Confirme o e-mail que acabamos de enviar e depois entre. ' +
      'Sua mentora libera o edital em seguida.'
    );
    setModoCadastro(false);
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
            : modoCadastro
              ? 'Crie sua conta para começar a estudar com o Método Águia.'
              : 'Voe mais alto. Entre para acompanhar seus estudos.'}
        </p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}
        {recado && <div className="aviso aviso-ok">{recado}</div>}

        <form onSubmit={modoRecuperar ? recuperar : modoCadastro ? criarConta : entrar}>
          {modoCadastro && (
            <>
              <label htmlFor="nome">Nome completo</label>
              <input id="nome" type="text" value={cadastro.nome} autoComplete="name" required
                onChange={(e) => setCadastro({ ...cadastro, nome: e.target.value })} />

              <label htmlFor="tel">WhatsApp com DDD</label>
              <input id="tel" type="tel" value={cadastro.telefone} placeholder="(21) 99999-0000"
                autoComplete="tel" required
                onChange={(e) => setCadastro({ ...cadastro, telefone: e.target.value })} />

              <label htmlFor="nasc">Data de nascimento</label>
              <input id="nasc" type="date" value={cadastro.nascimento} required
                onChange={(e) => setCadastro({ ...cadastro, nascimento: e.target.value })} />
            </>
          )}
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
                autoComplete={modoCadastro ? 'new-password' : 'current-password'}
                required
              />
            </>
          )}

          {modoCadastro && (
            <>
              <label htmlFor="senha2">Repita a senha</label>
              <input id="senha2" type="password" value={cadastro.senha2} autoComplete="new-password" required
                onChange={(e) => setCadastro({ ...cadastro, senha2: e.target.value })} />
            </>
          )}

          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? 'Aguarde…' : modoRecuperar ? 'Enviar link' : modoCadastro ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="entrada-links">
          <button
            className="botao-texto"
            type="button"
            onClick={() => { setModoCadastro(!modoCadastro); setModoRecuperar(false); setErro(''); setRecado(''); }}
          >
            {modoCadastro ? 'Já tenho conta' : 'Criar conta'}
          </button>

          {!modoCadastro && (
            <button
              className="botao-texto"
              type="button"
              onClick={() => { setModoRecuperar(!modoRecuperar); setErro(''); setRecado(''); }}
            >
              {modoRecuperar ? 'Voltar para o login' : 'Esqueci minha senha'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
