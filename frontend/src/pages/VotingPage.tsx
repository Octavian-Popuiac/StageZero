import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import VoteRequest from '../types/VoteRequest';

const VotingPage: React.FC = () => {
  const [pilotName, setPilotName] = useState('');
  const [pilotId, setPilotId] = useState('');
  const [availablePositions, setAvailablePositions] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    fetchAvailablePositions();
  }, []);

  const fetchAvailablePositions = async () => {
    try {
      const response = await api.get<number[]>('/available-positions');
      setAvailablePositions(response.data);
    } catch (error) {
      console.error('Erro ao buscar posições:', error);
      setMessage('Erro ao carregar posições disponíveis');
    }
  };

  const handleVote = async () => {
    if (!pilotName.trim() || !pilotId.trim() || !selectedPosition) {
      setMessage('⚠️ Preencha todos os campos!');
      return;
    }

    setLoading(true);
    setMessage('');

    const voteData: VoteRequest = {
      pilotId: pilotId.trim(),
      pilotName: pilotName.trim(),
      position: selectedPosition
    };

    try {
      await api.post('/votes', voteData);
      setVoted(true);
      setMessage('✅ Voto registrado com sucesso!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erro ao registrar voto';
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (voted) {
    return (
      <div className="voting-page">
        <div className="success-container">
          <div className="success-icon">🏁</div>
          <h1>Voto Registrado!</h1>
          <div className="vote-info">
            <p><strong>Piloto:</strong> {pilotName}</p>
            <p><strong>Posição:</strong> {selectedPosition}</p>
          </div>
          <p className="success-message">
            Obrigado por votar! Acompanhe o resultado no display.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="voting-container">
        <header className="voting-header">
          <h1>🏁 StageZero</h1>
          <p>Escolha sua posição de partida</p>
        </header>

        <div className="voting-form">
          <div className="form-group">
            <label htmlFor="pilotName">Nome do Piloto</label>
            <input
              id="pilotName"
              type="text"
              placeholder="Digite seu nome"
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pilotId">ID do Piloto</label>
            <input
              id="pilotId"
              type="text"
              placeholder="Digite seu ID"
              value={pilotId}
              onChange={(e) => setPilotId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Posições Disponíveis</label>
            <div className="positions-grid">
              {availablePositions.length === 0 ? (
                <p className="no-positions">Nenhuma posição disponível</p>
              ) : (
                availablePositions.map(pos => (
                  <button
                    key={pos}
                    className={`position-btn ${selectedPosition === pos ? 'selected' : ''}`}
                    onClick={() => setSelectedPosition(pos)}
                    disabled={loading}
                  >
                    {pos}
                  </button>
                ))
              )}
            </div>
          </div>

          <button 
            className="vote-btn" 
            onClick={handleVote}
            disabled={loading || !pilotName || !pilotId || !selectedPosition}
          >
            {loading ? 'Enviando...' : 'Confirmar Voto'}
          </button>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPage;