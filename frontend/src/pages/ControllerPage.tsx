import { useRef, useState } from 'react';
import { usePosition } from '../contexts/PositionContext';

export default function ControllerPage() {
  const { state, connected, change } = usePosition();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const team = state?.selectingCompetitor;
  const position = state?.currentPosition ?? 1;
  const disabled = busy || !connected;

  async function submit(next?: number) {
    if (!state || !team || disabled || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const body = { number: team.number, revision: state.revision, position: next };
      await change(next === undefined ? '/confirm' : '/selection', next === undefined ? 'POST' : 'PUT', body);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Não foi possível guardar a escolha.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="controller-page">
      <header className="controller-header">
        <img src="/BAJA_DE_LAGOS.png" alt="Baja de Lagos" className="controller-baja-logo" />
        <span>Controlador · SS1</span>
      </header>
      <section className="controller-container">
        {!connected && <p className="connection-message" role="status">A aguardar ligação ao StageZero…</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {team ? <div className="controller-pad">
          <div className="competitor-info">
            <div className="team-number">#{team.number}</div>
            <h1>{team.pilotName}</h1>
            <p>{team.navigatorName}</p>
          </div>
          <div className="position-controls">
            <div className="position-display">
              <span className="position-label">Posição de partida</span>
              <div className="position-number" aria-live="polite">{position}º</div>
            </div>
            <div className="teams-navigation-controls">
              <button className="teams-nav-btn" aria-label="Subir uma posição"
                disabled={disabled || position === 1} onClick={() => void submit(position - 1)}>▲</button>
              <button className="teams-confirm-btn-circle"
                disabled={disabled} onClick={() => void submit()}>Confirmar</button>
              <button className="teams-nav-btn" aria-label="Descer uma posição"
                disabled={disabled || position === state?.startPositions.length} onClick={() => void submit(position + 1)}>▼</button>
            </div>
          </div>
        </div> : state && (
          <div className="competitor-info">
            <h1>{state.started ? 'Escolha concluída' : 'À espera do início'}</h1>
            <p>{state.started ? 'A grelha final está disponível no ecrã.' : 'A organização vai abrir a escolha da ordem de partida.'}</p>
          </div>
        )}
      </section>
    </main>
  );
}
