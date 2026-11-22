import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePosition } from '../contexts/PositionContext';
import PrologosPosition from '../components/PrologosPosition';
import PositionSlot from '../components/PositionSlot';

const toCentiseconds = (time: string) => {
  const [minutes, seconds, fraction] = time.split(':').map(Number);
  return minutes * 6000 + seconds * 100 + fraction;
};

const difference = (time: number) => '+' + [
  Math.floor(time / 6000), Math.floor(time / 100) % 60, time % 100,
].map(value => String(value).padStart(2, '0')).join(':');

export default function DisplayPage() {
  const { state, connected } = usePosition();
  const started = state?.started;
  const previousStart = useRef<boolean | undefined>(undefined);
  const [opening, setOpening] = useState(false);
  const showDiagnostics = new URLSearchParams(window.location.search).get('debug') === '1';

  useLayoutEffect(() => {
    if (started === true && previousStart.current === false) {
      setOpening(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } else if (started === false) {
      setOpening(false);
    }
    previousStart.current = started;
  }, [started]);

  useEffect(() => {
    if (!opening) return;
    const fallback = window.setTimeout(() => setOpening(false), 4000);
    return () => window.clearTimeout(fallback);
  }, [opening]);

  const diagnostics = !connected
    ? <span className="display-connection" role="status">{state ? 'Ligação interrompida' : 'A ligar ao StageZero…'}</span>
    : showDiagnostics ? <span className="display-connection" data-connected="true" role="status">Em direto</span>
    : null;
  if (!started || opening) {
    return (
      <main className={`display-intro${opening ? ' opening' : ''}`}
        onAnimationEnd={event => {
          if (event.target === event.currentTarget && event.animationName === 'intro-exit') setOpening(false);
        }}>
        <div className="intro-perspective" aria-hidden="true">
          <div className="intro-road" />
        </div>
        <div className="intro-content">
          <div className="intro-logo-plate">
            <img src="/BAJA_DE_LAGOS.png" alt="Baja de Lagos" className="intro-logo" />
          </div>
          <h1>Ordem de partida <span>SS1</span></h1>
          <p role="status">{opening ? 'Começa a escolha' : 'A escolha vai começar em breve'}</p>
        </div>
        <div className="intro-diagnostics">{diagnostics}</div>
      </main>
    );
  }

  const competitors = state?.competitors.slice(0, state.startPositions.length) ?? [];
  const leader = competitors.length ? toCentiseconds(competitors[0].time) : 0;
  const team = state?.selectingCompetitor;

  return (
    <main className="display-page">
      <header className="display-header">
        <img src="/BAJA_DE_LAGOS.png" alt="Baja de Lagos" className="baja-logo" />
        <div className="display-heading"><p>Baja de Lagos</p><h1>Ordem de partida · SS1</h1></div>
        {diagnostics}
      </header>
      <div className="display-panels">
        <section className="display-panel" aria-label="Tempos do prólogo">
          <h2>Tempos do prólogo</h2>
          <div className="display-rows">
            {competitors.map((entry, index) => (
              <div className="result-row" key={entry.number}>
                <span className="display-rank">{index + 1}º</span>
                <PrologosPosition {...entry} time={index ? difference(toCentiseconds(entry.time) - leader) : entry.time} />
              </div>
            ))}
            {competitors.length === 0 && <p className="display-empty">{state ? 'À espera de equipas' : 'A carregar'}</p>}
          </div>
        </section>
        <section className="display-panel" aria-label="Grelha de partida">
          <h2>Grelha de partida</h2>
          <div className="display-rows">
            {(connected ? state?.previewPositions : state?.startPositions)?.map((slot, index) => (
              <PositionSlot key={slot.position} position={slot.position} competitor={slot.competitor}
                isSelecting={Boolean(connected && team && (slot.position === state?.currentPosition
                  || slot.competitor?.number !== state?.startPositions[index].competitor?.number))} />
            ))}
          </div>
        </section>
      </div>
      <footer className="display-footer">
        <span>{team ? 'A escolher' : 'Escolha de posições'}</span>
        <div className="display-active-crew">
          <strong>{team ? `#${team.number} · ${team.pilotName}`
            : state?.eligibleCount ? 'Ordem de partida confirmada' : 'A aguardar equipas'}</strong>
          {team && <span className="display-active-navigator">{team.navigatorName}</span>}
        </div>
        <span>{state ? `${state.startPositions.filter(slot => slot.competitor).length} / ${state.eligibleCount}` : '—'}</span>
      </footer>
    </main>
  );
}
