import TeamManager from '../components/TeamManager';
import { usePosition } from '../contexts/PositionContext';
import { useState } from 'react';

export default function HomePage() {
  const { state, connected, change } = usePosition();
  const [showTeams, setShowTeams] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const confirmed = state?.startPositions.filter(slot => slot.competitor).length ?? 0;
  const total = state?.eligibleCount ?? 0;
  const canExport = connected && state?.started && total > 0 && confirmed === total;

  async function start() {
    setStarting(true);
    setError('');
    try {
      await change('/start', 'POST');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Não foi possível iniciar a escolha.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="home-page">
      <header className="home-hero">
        <img src="/BAJA_DE_LAGOS.png" alt="Baja de Lagos" />
        <div>
          <p>Baja de Lagos · SS1</p>
          <h1>StageZero</h1>
          <p>Gestão da ordem de partida</p>
        </div>
      </header>

      <section className="event-overview" aria-label="Estado da escolha">
        <div>
          <h2>{canExport ? 'Grelha final confirmada' : state?.started ? 'Escolha em curso' : 'Preparação da escolha'}</h2>
          <p role="status">{!connected ? 'A aguardar ligação ao servidor…' : state?.started
              ? `${confirmed} de ${total} equipas confirmadas`
              : total ? `${total} equipas elegíveis · Display em espera` : 'Adiciona equipas para iniciar a escolha.'}</p>
        </div>
        {!state?.started && (
          <button className="start-event" disabled={!connected || !total || starting} onClick={() => void start()}>
            {starting ? 'A iniciar…' : 'Iniciar escolha da ordem de partida'}
          </button>
        )}
        {error && <p className="error-message" role="alert">{error}</p>}
        {canExport
          ? <a className="nav-btn" href="/v1/start-list.pdf" download>Exportar ordem final em PDF</a>
          : <button disabled aria-describedby="export-note">Exportar ordem final em PDF</button>}
        {!canExport && <p id="export-note">Disponível após a confirmação de todas as equipas elegíveis.</p>}
      </section>

      <nav className="home-actions" aria-label="Operação do evento">
        <a className="nav-btn" href="/display">Abrir Display</a>
        <a className="nav-btn" href="/controller">Abrir Controlador</a>
        <button aria-expanded={showTeams} onClick={() => setShowTeams(!showTeams)}>Gerir Equipas</button>
      </nav>
      {showTeams && <TeamManager />}

    </main>
  );
}
