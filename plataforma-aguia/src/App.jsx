import { useState } from 'react';
import { useSessao } from './lib/sessao.jsx';
import { ProvedorDados, useDados } from './lib/dados.jsx';
import Entrar from './telas/Entrar.jsx';
import NovaSenha from './telas/NovaSenha.jsx';
import PainelMentora from './telas/PainelMentora.jsx';
import InicioAluno from './telas/InicioAluno.jsx';
import Edital from './telas/Edital.jsx';
import Estudar from './telas/Estudar.jsx';

const ABAS = [
  { id: 'inicio', rotulo: 'Início' },
  { id: 'estudar', rotulo: 'Estudar' },
  { id: 'edital', rotulo: 'Edital' },
];

function BarraAluno({ aba, setAba }) {
  const { mentorias, mentoria, trocarMentoria } = useDados();

  return (
    <nav className="abas">
      {ABAS.map((a) => (
        <button
          key={a.id}
          type="button"
          className={aba === a.id ? 'aba aba-ativa' : 'aba'}
          onClick={() => setAba(a.id)}
        >
          {a.rotulo}
        </button>
      ))}

      {mentorias.length > 1 && (
        <select
          className="seletor-edital"
          value={mentoria?.id ?? ''}
          onChange={(e) => trocarMentoria(e.target.value)}
          aria-label="Escolher o edital"
        >
          {mentorias.map((m) => (
            <option key={m.id} value={m.id}>{m.nomeEdital}</option>
          ))}
        </select>
      )}
    </nav>
  );
}

function AreaAluno({ nome }) {
  const [aba, setAba] = useState('inicio');

  return (
    <ProvedorDados>
      <BarraAluno aba={aba} setAba={setAba} />
      {aba === 'inicio' && <InicioAluno nome={nome} />}
      {aba === 'estudar' && <Estudar />}
      {aba === 'edital' && <Edital />}
    </ProvedorDados>
  );
}

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
        <AreaAluno nome={(perfil?.nome || '').split(' ')[0] || 'tudo bem'} />
      )}
    </>
  );
}
