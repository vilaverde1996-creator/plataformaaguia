import { useSessao } from './lib/sessao.jsx';
import Entrar from './telas/Entrar.jsx';
import NovaSenha from './telas/NovaSenha.jsx';
import PainelMentora from './telas/PainelMentora.jsx';
import InicioAluno from './telas/InicioAluno.jsx';

export default function App() {
  const { sessao, perfil, carregando, sair, recuperandoSenha } = useSessao();

  if (recuperandoSenha) return <NovaSenha />;
  if (carregando) return <div className="carregando">Carregando…</div>;
  if (!sessao) return <Entrar />;

  const ehMentora = perfil?.papel === 'mentora';

  return (
    <>
      <header className="topo">
        <div className="marca">Método <span>Águia</span></div>
        <div>
          <span className="topo-usuario">{perfil?.nome || sessao.user.email}</span>
          <button className="botao-texto" style={{ marginLeft: 16 }} onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      {perfil?.ativo === false ? (
        <div className="pagina">
          <h1>Acesso pausado</h1>
          <p className="subtitulo">Sua mentoria está inativa no momento. Fale com sua mentora.</p>
        </div>
      ) : ehMentora ? (
        <PainelMentora />
      ) : (
        <InicioAluno nome={(perfil?.nome || '').split(' ')[0] || 'tudo bem'} />
      )}
    </>
  );
}
