import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const Contexto = createContext(null);

export function ProvedorSessao({ children }) {
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      if (!data.session) setCarregando(false);
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange((evento, nova) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      setSessao(nova);
      if (!nova) {
        setPerfil(null);
        setCarregando(false);
      }
    });

    return () => assinatura.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao?.user) return;
    let ativo = true;

    (async () => {
      setCarregando(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome, email, papel, ativo')
        .eq('id', sessao.user.id)
        .maybeSingle();

      if (!ativo) return;
      if (error) console.error('Não foi possível carregar o perfil:', error.message);
      setPerfil(data ?? null);
      setCarregando(false);
    })();

    return () => { ativo = false; };
  }, [sessao?.user?.id]);

  const sair = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
  };

  return (
    <Contexto.Provider
      value={{ sessao, perfil, carregando, sair, recuperandoSenha, setRecuperandoSenha }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useSessao() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useSessao precisa estar dentro de ProvedorSessao');
  return valor;
}
