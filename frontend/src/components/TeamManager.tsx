import React, { useState } from "react"
import { CompetitorPositionProps } from "./PrologosPosition";
import { usePosition } from "../contexts/PositionContext";

const COUNTRIES = [
  { name: 'Portugal' },
  { name: 'Spain' },
  { name: 'France' },
  { name: 'Netherlands' },
];

const CAR_BRANDS = [
  'CAM-AM-BRP',
  'CAM-AM',
  'FORD',
  'MERCEDES',
  'MINI-COPER',
  'POLARIS',
  'TAURUS',
  'TOYOTA',
  'VOLSKWAGEN',
  'FIAT',
  'NISSAN',
  'YAMAHA'
];

const TeamManager: React.FC = () => {
  const { state, connected, change } = usePosition();
  const teams = state?.competitors ?? [];
  const votingStarted = state?.started;
  const locked = !connected || votingStarted;
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<CompetitorPositionProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompetitorPositionProps>({
    number: 1,
    carBrand: '',
    pilotName: '',
    pilotCountry: '',
    navigatorName: '',
    navigatorCountry: '',
    time: '',
  });

  const handleInputChange = (field: keyof CompetitorPositionProps, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      if (editingTeam) {
        await change(`/teams/${editingTeam.number}`, 'PUT', formData);
        setEditingTeam(null);
      } else {
        await change('/teams', 'POST', formData);
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar a equipa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (team: CompetitorPositionProps) => {
    setFormData(team);
    setEditingTeam(team);
    setShowForm(true);
  }

  const handleDelete = async(teamNumber: number) => {
    const confirmDelete = window.confirm(`Apagar equipa #${teamNumber}?`);
    if(confirmDelete) {
      try {
        setIsLoading(true);
        setError(null);

        await change(`/teams/${teamNumber}`, 'DELETE');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao apagar a equipa.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm('Apagar TODAS as equipas? Esta ação não pode ser desfeita!');
    if(confirmReset) {
      try {
        setIsLoading(true);
        setError(null);

        await change('/teams', 'DELETE');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao apagar as equipas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const sortedTeams = teams;

  async function resetPositions() {
    if (!window.confirm('Reiniciar a escolha e limpar a grelha de partida?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await change('/reset', 'POST');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reiniciar as posições.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="team-manager">
      {isLoading &&
        <div className="loading-overlay">
          A carregar...
        </div>
      }

      {
        error &&
        <div className="error-message">
          {error}
        </div>
      }
      <div className="team-manager-header">
        <h2>Gestão de Equipas ({sortedTeams.length})</h2>
        <div className="header-btn">
          <button
            className="add-btn"
            onClick={() => {
              setShowForm(!showForm);
              setEditingTeam(null);
              setFormData({
                number: Math.max(...teams.map(t => t.number), 0) +1,
                carBrand: '',
                pilotName: '',
                pilotCountry: '',
                navigatorName: '',
                navigatorCountry: '',
                time: '',
              });
            }}
            disabled={isLoading || locked}
          >
            {showForm ? 'Cancelar' : 'Adicionar Equipa'}
          </button>

          {teams.length > 0 && (
            <button className="reset-btn" onClick={handleReset} disabled={isLoading || locked}>
              Apagar equipas
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form className="team-form" onSubmit={handleSubmit}>
          <h3>{editingTeam ? 'Editar Equipa' : 'Adicionar Equipa'}</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="team-number">Número:</label>
              <input
                id="team-number"
                type="number"
                disabled={editingTeam !== null}
                max="99999"
                min="1"
                value={Number.isNaN(formData.number) ? "" : formData.number}
                onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="team-carBrand">Marca do Carro:</label>
              <select
                id="team-carBrand"
                value={formData.carBrand}
                onChange={(e) => handleInputChange('carBrand', e.target.value)}
                required
              >
                <option value="">Selecionar marca...</option>
                {CAR_BRANDS.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="team-time">Tempo:</label>
              <input
                type="text"
                placeholder="02:15:42"
                id="team-time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="team-pilotName">Nome do Piloto:</label>
              <input
                type="text"
                id="team-pilotName"
                value={formData.pilotName}
                onChange={(e) => handleInputChange('pilotName', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="team-pilotCountry">País do Piloto:</label>
              <select
                id="team-pilotCountry"
                value={formData.pilotCountry}
                onChange={(e) => handleInputChange('pilotCountry', e.target.value)}
                required
              >
                <option value="">Selecionar país...</option>
                {COUNTRIES.map(country => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="team-navigatorName">Nome do Navegador:</label>
              <input
                type="text"
                id="team-navigatorName"
                value={formData.navigatorName}
                onChange={(e) => handleInputChange('navigatorName', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="team-navigatorCountry">País do Navegador:</label>
              <select
                id="team-navigatorCountry"
                value={formData.navigatorCountry}
                onChange={(e) => handleInputChange('navigatorCountry', e.target.value)}
                required
              >
                <option value="">Selecionar país...</option>
                {COUNTRIES.map(country => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="save-btn" disabled={locked || isLoading}>
              {editingTeam ? 'Guardar alterações' : 'Adicionar Equipa'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setShowForm(false);
                setEditingTeam(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!connected && <p role="status">A aguardar ligação ao servidor…</p>}
      {votingStarted && (
        <div className="voting-lock">
          <p>Reinicia a escolha para voltar a editar as equipas.</p>
          <button onClick={resetPositions} disabled={isLoading || !connected}>Reiniciar posições</button>
        </div>
      )}
      <div className="teams-list">
        {sortedTeams.length === 0 ? (
          <div className="empty-state">
            <p>📝 Nenhuma equipa adicionada ainda.</p>
            <p>Clique em "Adicionar Equipa" para começar!</p>
          </div>
        ) : (
          <div className="teams-grid">
            {sortedTeams.map((team, index) => (
              <div key={team.number} className="team-card">
                <div className="team-position">#{index + 1}</div>
                <div className="team-number">#{team.number}</div>
                <div className="team-brand">{team.carBrand}</div>
                <div className="team-crew">
                  <div className="crew-member">
                    <span>{team.pilotCountry}</span>
                    <span>{team.pilotName}</span>
                  </div>
                  <div className="crew-member">
                    <span>{team.navigatorCountry}</span>
                    <span>{team.navigatorName}</span>
                  </div>
                </div>
                <div className="team-time">{team.time}</div>
                <div className="team-actions">
                  <button
                    className="edit-btn" disabled={locked || isLoading} aria-label={`Editar equipa ${team.number}`}
                    onClick={() => handleEdit(team)}
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn" disabled={locked || isLoading} aria-label={`Apagar equipa ${team.number}`}
                    onClick={() => handleDelete(team.number)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamManager;
