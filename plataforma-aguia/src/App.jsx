import { useState } from 'react';
import { useSessao } from './lib/sessao.jsx';
import { ProvedorDados, useDados } from './lib/dados.jsx';
import Entrar from './telas/Entrar.jsx';
import NovaSenha from './telas/NovaSenha.jsx';
import PainelMentora from './telas/PainelMentora.jsx';
import Importar from './telas/Importar.jsx';
import Ciclos from './telas/Ciclos.jsx';
import Questoes from './telas/Questoes.jsx';
import Cronometro from './telas/Cronometro.jsx';
import FecharEstudo from './telas/FecharEstudo.jsx';
import Perfil from './telas/Perfil.jsx';
import Aulas from './telas/Aulas.jsx';
import GerenciarAulas from './telas/GerenciarAulas.jsx';
import { ProvedorCronometro, BarraCronometro } from './lib/cronometro.jsx';
import Painel from './telas/Painel.jsx';
import Edital from './telas/Edital.jsx';
import Estudar from './telas/Estudar.jsx';
import Revisoes from './telas/Revisoes.jsx';
import Estatisticas from './telas/Estatisticas.jsx';
import PlanoDeVoo from './telas/PlanoDeVoo.jsx';

const SITE = 'https://asasdeaguia.com.br';

const ABAS = [
  { id: 'inicio', rotulo: 'Início' },
  { id: 'estudar', rotulo: 'Estudar' },
  { id: 'cronometro', rotulo: 'Cronômetro' },
  { id: 'questoes', rotulo: 'Questões' },
  { id: 'aulas', rotulo: 'Aulas' },
  { id: 'edital', rotulo: 'Edital' },
  { id: 'revisoes', rotulo: 'Revisões' },
  { id: 'estatisticas', rotulo: 'Estatísticas' },
  { id: 'plano', rotulo: 'Plano de voo' },
  { id: 'perfil', rotulo: 'Meu perfil' },
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

      <a className="aba aba-site" href={SITE} target="_blank" rel="noreferrer">
        Asas de Águia ↗
      </a>

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

const ABAS_MENTORA = [
  { id: 'alunos', rotulo: 'Alunos' },
  { id: 'ciclos', rotulo: 'Ciclos' },
  { id: 'importar', rotulo: 'Importar' },
  { id: 'aulas', rotulo: 'Aulas' },
];

function AreaMentora() {
  const [aba, setAba] = useState('alunos');

  return (
    <>
      <nav className="abas">
        {ABAS_MENTORA.map((a) => (
          <button
            key={a.id}
            type="button"
            className={aba === a.id ? 'aba aba-ativa' : 'aba'}
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
        <a className="aba aba-site" href={SITE} target="_blank" rel="noreferrer">
          Asas de Águia ↗
        </a>
      </nav>

      {aba === 'alunos' && <PainelMentora />}
      {aba === 'ciclos' && <Ciclos />}
      {aba === 'importar' && <Importar />}
      {aba === 'aulas' && <GerenciarAulas />}
    </>
  );
}

function AreaAluno({ nome }) {
  const [aba, setAba] = useState('inicio');

  return (
    <ProvedorDados>
      <BarraAluno aba={aba} setAba={setAba} />
      <BarraCronometro irPara={setAba} />
      <FecharEstudo />
      {aba === 'inicio' && <Painel nome={nome} irPara={setAba} />}
      {aba === 'estudar' && <Estudar irPara={setAba} />}
      {aba === 'cronometro' && <Cronometro />}
      {aba === 'questoes' && <Questoes />}
      {aba === 'aulas' && <Aulas />}
      {aba === 'perfil' && <Perfil />}
      {aba === 'edital' && <Edital />}
      {aba === 'revisoes' && <Revisoes />}
      {aba === 'estatisticas' && <Estatisticas />}
      {aba === 'plano' && <PlanoDeVoo />}
    </ProvedorDados>
  );
}

function ComCronometro({ children }) {
  return <ProvedorCronometro>{children}</ProvedorCronometro>;
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
        <div className="marca-topo">
          <img src="/logo-aguia.png" alt="" className="logo" />
          <span className="marca">Asas de <span>Águia</span></span>
        </div>
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
        <AreaMentora />
      ) : (
        <ComCronometro>
          <AreaAluno nome={(perfil?.nome || '').split(' ')[0] || 'tudo bem'} />
        </ComCronometro>
      )}
    </>
  );
}
