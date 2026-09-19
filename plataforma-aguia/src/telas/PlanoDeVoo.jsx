import { Fragment } from 'react';
import { useDados } from '../lib/dados.jsx';

// Formatação simples do texto que você escreve no plano:
//   **negrito**        → destaque em negrito
//   ==importante==     → trecho realçado
//   quebra de linha    → nova linha
export function formatar(texto) {
  if (!texto) return [];
  const partes = [];
  const regex = /(\*\*[^*]+\*\*|==[^=]+==)/g;
  let resto = String(texto);
  let chave = 0;

  for (const linha of resto.split('\n')) {
    const pedacos = [];
    let ultimo = 0;
    let achou;
    regex.lastIndex = 0;

    while ((achou = regex.exec(linha)) !== null) {
      if (achou.index > ultimo) pedacos.push(linha.slice(ultimo, achou.index));
      const bruto = achou[0];
      if (bruto.startsWith('**')) {
        pedacos.push(<strong key={chave++}>{bruto.slice(2, -2)}</strong>);
      } else {
        pedacos.push(<mark key={chave++}>{bruto.slice(2, -2)}</mark>);
      }
      ultimo = achou.index + bruto.length;
    }
    if (ultimo < linha.length) pedacos.push(linha.slice(ultimo));
    partes.push(pedacos);
  }

  return partes;
}

function Texto({ children }) {
  const linhas = formatar(children);
  return (
    <>
      {linhas.map((linha, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {linha}
        </Fragment>
      ))}
    </>
  );
}

function Dia({ secao }) {
  const linhas = String(secao.texto ?? '').split('\n').filter((l) => l.trim());
  return (
    <div className={`dia-ciclo dia-${secao.estilo || 'normal'}`}>
      <h3>{secao.titulo}</h3>
      <ul>
        {linhas.map((linha, i) => {
          const [principal, detalhe] = linha.split('|').map((x) => x.trim());
          const alvo = principal.startsWith('🎯');
          return (
            <li key={i} className={alvo ? 'dia-alvo' : ''}>
              <Texto>{principal}</Texto>
              {detalhe && <span className="dia-detalhe"><Texto>{detalhe}</Texto></span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PlanoDeVoo() {
  const { plano, mentoria, carregando } = useDados();

  if (carregando) return <div className="pagina">Carregando…</div>;

  if (!plano || plano.length === 0) {
    return (
      <div className="pagina">
        <h1>Plano de voo</h1>
        <p className="vazio">Sua mentora ainda não publicou o plano deste edital.</p>
      </div>
    );
  }

  const blocos = [];
  let dias = [];

  const descarregarDias = () => {
    if (dias.length > 0) {
      blocos.push(<div className="ciclo" key={`ciclo-${blocos.length}`}>{dias}</div>);
      dias = [];
    }
  };

  for (const s of plano) {
    if (s.secao === 'dia') {
      dias.push(<Dia secao={s} key={s.id} />);
      continue;
    }
    descarregarDias();

    if (s.secao === 'titulo') {
      blocos.push(<h2 className="secao-titulo" key={s.id}>{s.titulo}</h2>);
    } else if (s.secao === 'destaque') {
      blocos.push(
        <div className="cartao-escuro" key={s.id}>
          <h3>{s.titulo}</h3>
          <p><Texto>{s.texto}</Texto></p>
        </div>
      );
    } else if (s.secao === 'fase') {
      blocos.push(
        <div className={`fase fase-${s.estilo || 'azul'}`} key={s.id}>
          <div className="fase-icone">{s.icone || '🦅'}</div>
          <div>
            <h3>{s.titulo}</h3>
            {s.subtitulo && <p className="fase-objetivo"><Texto>{s.subtitulo}</Texto></p>}
            {s.texto && <p><Texto>{s.texto}</Texto></p>}
          </div>
        </div>
      );
    } else {
      blocos.push(
        <div className="cartao" key={s.id} style={{ marginBottom: 14 }}>
          {s.titulo && <h3>{s.titulo}</h3>}
          <p style={{ margin: 0 }}><Texto>{s.texto}</Texto></p>
        </div>
      );
    }
  }
  descarregarDias();

  return (
    <div className="pagina">
      <h1>Plano de voo</h1>
      <p className="subtitulo">{mentoria?.nomeEdital}</p>
      {blocos}
    </div>
  );
}
