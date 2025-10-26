import React, { useEffect, useState } from "react"
import { CompetitorPositionProps } from "./PrologosPosition";
import { teamService } from "../services/supabaseService";

const COUNTRIES = [
  { name: 'Portugal' },
  { name: 'Espanha' },
  { name: 'França' },
  { name: 'Itália' },
  { name: 'Reino Unido' },
  { name: 'Alemanha' },
  { name: 'Bélgica' },
  { name: 'Holanda' },
  { name: 'Áustria' },
  { name: 'Suíça' },
  { name: 'Suécia' },
  { name: 'Noruega' },
  { name: 'Finlândia' },
  { name: 'Dinamarca' },
  { name: 'Polónia' },
  { name: 'Chéquia' },
  { name: 'Eslováquia' },
  { name: 'Hungria' },
  { name: 'Roménia' },
  { name: 'Bulgária' },
  { name: 'Grécia' },
  { name: 'Estónia' },
  { name: 'Letónia' },
  { name: 'Lituânia' }
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
  'VOLKSWAGEN',
];

const TeamManager: React.FC = () => {
  const [teams, setTeams] = useState<CompetitorPositionProps[]>([]);
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

  useEffect(() => {
    loadTeams();

    const subscription = teamService.subscribeToTeamChanges((updatedTeams) => {
      setTeams(updatedTeams);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const teamsData = await teamService.getTeams();
      setTeams(teamsData);
    } catch (err) {
      setError('Erro ao carregar as equipas.');
      console.error(err);
    }finally{
      setIsLoading(false);
    }
  }

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

      const newTeam : CompetitorPositionProps = {
      number: formData.number,
      carBrand: formData.carBrand,
      pilotName: formData.pilotName,
      pilotCountry: formData.pilotCountry,
      navigatorName: formData.navigatorName,
      navigatorCountry: formData.navigatorCountry,
      time: formData.time,
    };
    console.log('Submitting team:', newTeam);

    if (editingTeam) {
      await teamService.updateTeam(newTeam);
      setEditingTeam(null);
    } else {
      await teamService.addTeam(newTeam);
    }

    await loadTeams();

    setFormData({
      number: Math.max(...teams.map(t => t.number), 0) + 1,
      carBrand: '',
      pilotName: '',
      pilotCountry: '',
      navigatorName: '',
      navigatorCountry: '',
      time: '',
    });
    
    setShowForm(false);
  } catch (err) {
    setError('Erro ao submeter a equipa.');
    console.error(err);
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

        await teamService.deleteTeam(teamNumber);
        await loadTeams();
      } catch (err) {
        setError('Erro ao apagar a equipa.');
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

        await teamService.resetTeams();
        await loadTeams();
      } catch (err) {
        setError('Erro ao resetar as equipas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    if (!a.time || !b.time) return 0;
    const timeA = a.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
    const timeB = b.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
    return timeA - timeB;
  });

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
            disabled={isLoading}
          >
            {showForm ? 'Cancelar' : 'Adicionar Equipa'}
          </button>

          {teams.length > 0 && (
            <button className="reset-btn" onClick={handleReset} disabled={isLoading}>
              Resetar tudo
            </button>
          )}
        </div>
      </div>
          
      {showForm && (
        <form className="team-form" onSubmit={handleSubmit}>
          <h3>{editingTeam ? 'Editar Equipa' : 'Adicionar Equipa'}</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Número:</label>
              <input
                type="number"
                min="1"
                value={formData.number}
                onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label>Marca do Carro:</label>
              <select
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
              <label>Tempo:</label>
              <input
                type="text"
                placeholder="2:15:42.8"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nome do Piloto:</label>
              <input
                type="text"
                value={formData.pilotName}
                onChange={(e) => handleInputChange('pilotName', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>País do Piloto:</label>
              <select
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
              <label>Nome do Navegador:</label>
              <input
                type="text"
                value={formData.navigatorName}
                onChange={(e) => handleInputChange('navigatorName', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>País do Navegador:</label>
              <select
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
            <button type="submit" className="save-btn">
              {editingTeam ? 'Salvar Alterações' : 'Adicionar Equipa'}
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
                    className="edit-btn"
                    onClick={() => handleEdit(team)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn"
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