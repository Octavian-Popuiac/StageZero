import React, { useState } from 'react';
import { usePosition } from '../contexts/PositionContext';

interface AlgorithmConfig {
  enabled: boolean;
  type: 'random' | 'time_based' | 'voting' | 'custom';
  parameters?: {
    [key: string]: any;
  };
}

const ControllerPage: React.FC = () => {
  const {
    selectingCompetitor,
    setSelectingCompetitor,
    currentPosition,
    setCurrentPosition,
    confirmPosition,
    startPositions,
    competitors,
    loading,
    moveToNextCompetitor,
    resetPositions
  } = usePosition();

  console.log('🎮 ControllerPage render:');
  console.log('📊 competitors from context:', competitors.length, competitors);
  console.log('🎯 selectingCompetitor from context:', selectingCompetitor?.pilotName);
  console.log('🔧 loading:', loading);

  const [algorithmConfig, setAlgorithmConfig] = useState<AlgorithmConfig>({
    enabled: false,
    type: 'custom'
  });

  // Funções de controlo do selecting competitor
  const handleStartSelection = async() => {
    if (competitors.length > 0) {
      console.log('🏁 Starting selection with first competitor');
      await setSelectingCompetitor(competitors[0]);
      await setCurrentPosition(1);
    }
  };

  const handleNextCompetitor = async () => {
    if (!selectingCompetitor) return;
    
    const currentIndex = competitors.findIndex(c => c.number === selectingCompetitor.number);
    if (currentIndex !== -1 && currentIndex < competitors.length - 1) {
      const nextCompetitor = competitors[currentIndex + 1];
      console.log('➡️ Moving to next competitor:', nextCompetitor.pilotName);
      await setSelectingCompetitor(nextCompetitor);
      await setCurrentPosition(1); // Reset posição para 1
    } else {
      console.log('No more competitors');
      await setSelectingCompetitor(null);
    }
  };

  const handlePreviousCompetitor = async () => {
    if (!selectingCompetitor) return;
    
    const currentIndex = competitors.findIndex(c => c.number === selectingCompetitor.number);
    if (currentIndex > 0) {
      const prevCompetitor = competitors[currentIndex - 1];
      console.log('Moving to previous competitor:', prevCompetitor.pilotName);
      await setSelectingCompetitor(prevCompetitor);
      await setCurrentPosition(1);
    }
  };

  const handleSkipCompetitor = async () => {
    console.log('Skipping competitor:', selectingCompetitor?.pilotName);
    await handleNextCompetitor();
  };

  const handleResetAll = async () => {
    const confirmed = window.confirm('Tens a certeza que queres resetar todas as posições?');
    if (confirmed) {
      console.log('Resetting all positions');
      await resetPositions();
    }
  };

  const handleSelectSpecificCompetitor = async (competitor: any) => {
    console.log('Selecting specific competitor:', competitor.pilotName);
    await setSelectingCompetitor(competitor);
    await setCurrentPosition(1);
  };

  // Funções básicas de navegação
  const moveUp = async () => {
    const newPosition = Math.max(1, currentPosition - 1);
    await setCurrentPosition(newPosition);
  };

  const moveDown = async () => {
    const newPosition = Math.min(10, currentPosition + 1);
    await setCurrentPosition(newPosition);
  };

  const isPositionOccupied = (position: number) => {
    return startPositions.some(slot => 
      slot.position === position && slot.competitor !== null
    );
  };

  const handlePositionClick = async (pos: number) => {
    if (!algorithmConfig.enabled) {
      await setCurrentPosition(pos);
    }
  };

  const handlePositionSelection = async () => {
    if (!selectingCompetitor) return;

    if (algorithmConfig.enabled) {
      await executeAlgorithm();
    } else {
      await handleManualConfirm();
    }
  };

  const handleManualConfirm = async () => {
    if (!selectingCompetitor || isPositionOccupied(currentPosition)) return;
    
    try {
      await confirmPosition();
      console.log(`Position ${currentPosition} confirmed for ${selectingCompetitor.pilotName}`);
      // O moveToNextCompetitor já é chamado dentro do confirmPosition no context
    } catch (error) {
      console.error('Error confirming position:', error);
    }
  };

  const executeAlgorithm = async () => {
    console.log('Algorithm execution placeholder');
    await handleManualConfirm();
  };

  // Get competitor status
  const getCompetitorStatus = (competitor: any) => {
    const hasPosition = startPositions.some(slot => 
      slot.competitor?.number === competitor.number
    );
    const isCurrentlySelecting = selectingCompetitor?.number === competitor.number;
    
    if (hasPosition) return 'completed';
    if (isCurrentlySelecting) return 'selecting';
    return 'waiting';
  };

  const getCurrentCompetitorIndex = () => {
    if (!selectingCompetitor) return -1;
    return competitors.findIndex(c => c.number === selectingCompetitor.number);
  };

  // Loading state
  if (loading) {
    return (
      <div className="controller-page">
        <div className="controller-waiting">
          <h2>⏳ A carregar posições...</h2>
        </div>
      </div>
    );
  }

  // Interface quando não há competitor selecionado
  if (!selectingCompetitor) {
    return (
      <div className="controller-page">
        <div className="controller-waiting">
          <h1>🎮 Controlo</h1>
          
          {competitors.length === 0 ? (
            <div className="waiting-state">
              <div className="waiting-icon">📝</div>
              <h2>Nenhuma Equipa Encontrada</h2>
              <p>Adiciona equipas na página principal primeiro.</p>
            </div>
          ) : (
            <div className="competitor-selection">
              <h2>👥 Selecionar Competidor</h2>
              <p>Escolhe qual competidor vai selecionar a posição:</p>
              
              <button className="start-first-btn" onClick={() => handleStartSelection()}>
                🏁 Começar com o 1º Classificado
              </button>
              
              <div className="competitors-list">
                {competitors.map((competitor, index) => {
                  const status = getCompetitorStatus(competitor);
                  return (
                    <div 
                      key={competitor.number}
                      className={`competitor-item ${status}`}
                      onClick={() => status !== 'completed' && handleSelectSpecificCompetitor(competitor)}
                    >
                      <div className="competitor-rank">{index + 1}º</div>
                      <div className="competitor-details">
                        <div className="competitor-name">#{competitor.number} {competitor.pilotName}</div>
                        <div className="competitor-time">{competitor.time}</div>
                      </div>
                      <div className="competitor-status">
                        {status === 'completed' && '✅'}
                        {status === 'selecting' && '🎯'}
                        {status === 'waiting' && '⏳'}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button className="reset-all-btn" onClick={() => handleResetAll()}>
                🔄 Resetar Todas as Posições
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="controller-page">
      <div className="controller-container">
        <header className="controller-header">
          <h2>🎮 Escolha de Posição</h2>
          
          <div className="algorithm-toggle">
            <label>
              <input
                type="checkbox"
                checked={algorithmConfig.enabled}
                onChange={(e) => setAlgorithmConfig(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
              />
              🔮 Algoritmo
            </label>
          </div>
        </header>

        {/* Controles de navegação entre competidores */}
        <div className="competitor-navigation">
          <div className="nav-info">
            <span>Competidor {getCurrentCompetitorIndex() + 1} de {competitors.length}</span>
          </div>
          
          <div className="nav-controls">
            <button 
              className="nav-competitor-btn" 
              onClick={() => handlePreviousCompetitor()}
              disabled={getCurrentCompetitorIndex() === 0}
            >
              ⬅️ Anterior
            </button>
            
            <button className="skip-btn" onClick={() => handleSkipCompetitor()}>
              ⏭️ Saltar
            </button>
            
            <button 
              className="nav-competitor-btn" 
              onClick={() => handleNextCompetitor()}
              disabled={getCurrentCompetitorIndex() === competitors.length - 1}
            >
              Próximo ➡️
            </button>
          </div>
          
          <button className="reset-btn" onClick={() => handleResetAll()}>
            🔄 Reset Tudo
          </button>
        </div>

        {/* Informação do competidor atual */}
        <div className="competitor-info">
          <div className="competitor-card">
            <div className="competitor-number">#{selectingCompetitor.number}</div>
            <div className="competitor-details">
              <div className="car-brand">{selectingCompetitor.carBrand}</div>
              <div className="crew">
                <div className="pilot">
                  <span className="flag">{selectingCompetitor.pilotCountry}</span>
                  <span className="name">{selectingCompetitor.pilotName}</span>
                </div>
                <div className="navigator">
                  <span className="flag">{selectingCompetitor.navigatorCountry}</span>
                  <span className="name">{selectingCompetitor.navigatorName}</span>
                </div>
              </div>
              <div className="time">{selectingCompetitor.time}</div>
            </div>
          </div>
        </div>

        {/* Modo Algoritmo vs Manual */}
        {algorithmConfig.enabled ? (
          <div className="algorithm-mode">
            <div className="algorithm-info">
              <h3>🔮 Modo Algoritmo Ativo</h3>
              <p>Tipo: {algorithmConfig.type}</p>
              <p>O algoritmo irá determinar a melhor posição automaticamente.</p>
            </div>
            
            <button 
              className="algorithm-btn"
              onClick={() => executeAlgorithm()}
            >
              🎯 EXECUTAR ALGORITMO
            </button>
          </div>
        ) : (
          <div className="manual-mode">
            <div className="position-display">
              <div className="position-label">Posição de Partida</div>
              <div className="position-number">{currentPosition}º</div>
              <div className="position-hint">
                {isPositionOccupied(currentPosition) ? 
                  '⚠️ Posição ocupada' : 
                  'Use ▲▼ para navegar, ✓ para confirmar'
                }
              </div>
            </div>

            <div className="navigation-controls">
              <button 
                className="nav-btn up" 
                onClick={() => moveUp()}
                disabled={currentPosition === 1}
              >
                ▲
              </button>
              
              <div className={`position-indicator ${isPositionOccupied(currentPosition) ? 'occupied' : ''}`}>
                {currentPosition}º
                {isPositionOccupied(currentPosition) && ' 🚫'}
              </div>
              
              <button 
                className="nav-btn down" 
                onClick={() => moveDown()}
                disabled={currentPosition === 10}
              >
                ▼
              </button>
            </div>

            <button 
              className="confirm-btn" 
              onClick={() => handlePositionSelection()}
              disabled={isPositionOccupied(currentPosition)}
            >
              {isPositionOccupied(currentPosition) ? 
                '🚫 POSIÇÃO OCUPADA' : 
                `✓ CONFIRMAR POSIÇÃO ${currentPosition}º`
              }
            </button>
          </div>
        )}

        <div className="positions-preview">
          <div className="positions-title">Posições:</div>
          <div className="positions-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pos => {
              const occupied = isPositionOccupied(pos);
              const selected = pos === currentPosition;
              
              return (
                <div 
                  key={pos}
                  className={`position-slot ${selected ? 'selected' : ''} ${occupied ? 'occupied' : ''}`}
                  onClick={() => handlePositionClick(pos)}
                >
                  {pos}º
                  {occupied && ' 🚫'}
                </div>
              );
            })}
          </div>
        </div>

        {algorithmConfig.enabled && (
          <div className="algorithm-config">
            <h4>⚙️ Configurações do Algoritmo</h4>
            <div className="config-options">
              <select
                value={algorithmConfig.type}
                onChange={(e) => setAlgorithmConfig(prev => ({
                  ...prev,
                  type: e.target.value as any
                }))}
              >
                <option value="custom">Personalizado</option>
                <option value="time_based">Baseado em Tempo</option>
                <option value="random">Aleatório</option>
                <option value="voting">Sistema de Votação</option>
              </select>
              
              <div className="config-placeholder">
                <p>⚙️ Configurações específicas do algoritmo serão implementadas aqui</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControllerPage;