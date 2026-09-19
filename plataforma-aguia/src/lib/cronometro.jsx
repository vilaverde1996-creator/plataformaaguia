import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// O cronômetro vive aqui, acima das telas, para continuar andando
// quando o aluno troca de aba. O estado é guardado no aparelho, então
// recarregar a página (ou fechar e voltar) não perde o tempo.

const Contexto = createContext(null);
const CHAVE = 'aguia:cronometro';

function ler() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch { return null; }
}

function gravar(estado) {
  try {
    if (estado) localStorage.setItem(CHAVE, JSON.stringify(estado));
    else localStorage.removeItem(CHAVE);
  } catch { /* navegação privada */ }
}

export function relogio(segundos) {
  const s = Math.max(0, Math.round(segundos));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const seg = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${seg}`;
}

export function horasCurtas(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.round((segundos % 3600) / 60);
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

export function ProvedorCronometro({ children }) {
  const salvo = useRef(ler()).current;

  const [rodando, setRodando] = useState(!!salvo?.iniciadoEm);
  const [acumulado, setAcumulado] = useState(salvo?.acumulado ?? 0);
  const [iniciadoEm, setIniciadoEm] = useState(salvo?.iniciadoEm ?? null);
  const [contexto, setContexto] = useState({
    disciplina_id: salvo?.disciplina_id ?? '',
    topico_id: salvo?.topico_id ?? '',
    tipo: salvo?.tipo ?? 'teoria',
  });
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  useEffect(() => {
    gravar(rodando || acumulado > 0 ? { acumulado, iniciadoEm, ...contexto } : null);
  }, [rodando, acumulado, iniciadoEm, contexto]);

  const decorrido = acumulado + (rodando && iniciadoEm ? (agora - iniciadoEm) / 1000 : 0);

  const iniciar = useCallback(() => {
    setIniciadoEm(Date.now());
    setRodando(true);
    setAgora(Date.now());
  }, []);

  const pausar = useCallback(() => {
    setAcumulado((a) => a + (iniciadoEm ? (Date.now() - iniciadoEm) / 1000 : 0));
    setIniciadoEm(null);
    setRodando(false);
  }, [iniciadoEm]);

  const zerar = useCallback(() => {
    setRodando(false);
    setIniciadoEm(null);
    setAcumulado(0);
    gravar(null);
  }, []);

  const definirContexto = useCallback((mudancas) => {
    setContexto((atual) => ({ ...atual, ...mudancas }));
  }, []);

  return (
    <Contexto.Provider
      value={{ rodando, decorrido, iniciar, pausar, zerar, contexto, definirContexto }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useCronometro() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useCronometro precisa estar dentro de ProvedorCronometro');
  return valor;
}

// Caixinha que acompanha o aluno em todas as telas.
export function BarraCronometro({ irPara }) {
  const { rodando, decorrido, iniciar, pausar } = useCronometro();

  if (decorrido < 1 && !rodando) return null;

  return (
    <div className={`crono-flutuante ${rodando ? 'crono-ativo' : ''}`}>
      <button
        className="crono-mini-botao"
        type="button"
        onClick={rodando ? pausar : iniciar}
        aria-label={rodando ? 'Pausar cronômetro' : 'Continuar cronômetro'}
      >
        {rodando ? '❚❚' : '▶'}
      </button>

      <button className="crono-mini-tempo" type="button" onClick={() => irPara('estudar')}>
        {relogio(decorrido)}
        <span>{rodando ? 'estudando' : 'pausado'}</span>
      </button>
    </div>
  );
}
