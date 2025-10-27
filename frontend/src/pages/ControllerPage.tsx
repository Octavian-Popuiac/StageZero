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

  const [algorithmConfig, setAlgorithmConfig] = useState<AlgorithmConfig>({
    enabled: false,
    type: 'custom'
  });

  // Funções de controlo do selecting competitor
  const handleStartSelection = async() => {
    if (competitors.length > 0) {
      console.log('Starting selection with first competitor');
      await setSelectingCompetitor(competitors[0]);
      await setCurrentPosition(1);
    }
  };

  const handleNextCompetitor = async () => {
    if (!selectingCompetitor) return;
    
    const currentIndex = competitors.findIndex(c => c.number === selectingCompetitor.number);
    if (currentIndex !== -1 && currentIndex < competitors.length - 1) {
      const nextCompetitor = competitors[currentIndex + 1];
      console.log('Moving to next competitor:', nextCompetitor.pilotName);
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
          <h2>A carregar posições...</h2>
        </div>
      </div>
    );
  }

  // Interface quando não há competitor selecionado
  if (!selectingCompetitor) {
    return (
      <div className="controller-page">
        <div className="controller-waiting">
          <h1>Controlo</h1>

          {competitors.length === 0 ? (
            <div className="waiting-state">
              <div className="waiting-icon">📝</div>
              <h2>Nenhuma Equipa Encontrada</h2>
              <p>Adiciona equipas na página principal primeiro.</p>
            </div>
          ) : (
            <div className="competitor-selection">
              <h2>Selecionar Competidor</h2>
              <p>Escolhe qual competidor vai selecionar a posição:</p>
              
              <button className="start-first-btn" onClick={() => handleStartSelection()}>
                Começar com o 1º Classificado
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
                Resetar Todas as Posições
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

    return (
    <div className="controller-page">
      <img src={'BAJA_DE_LAGOS.png'}  alt="Logo" className="baja-logo" />
      <div className="controller-container">
  
        {/* Informação do Competidor */}
        <div className="competitor-info">
          <div className="team-number">#{selectingCompetitor.number}</div>
          
          <div className="team-members">
            <div className="member">
              <span className="member-name">{selectingCompetitor.pilotName}</span>
            </div>
            <div className="member">
              <span className="member-name">{selectingCompetitor.navigatorName}</span>
            </div>
          </div>
        </div>
  
        {/* Navegação entre Competidores */}
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
            
            <button 
              className="nav-competitor-btn" 
              onClick={() => handleNextCompetitor()}
              disabled={getCurrentCompetitorIndex() === competitors.length - 1}
            >
              Próximo ➡️
            </button>
          </div>
        </div>
  
        {/* CONTROLOS PRINCIPAIS - Triângulos e Círculo */}
        <div className="position-controls">
          <div className="position-display">
            <span className="position-label">POSIÇÃO</span>
            <div className="position-number">{currentPosition}º</div>
          </div>
  
          <div className="navigation-controls">
            {/* ▲ Triângulo para SUBIR */}
            <button 
              className="nav-btn up" 
              onClick={() => moveUp()}
              disabled={currentPosition === 1}
            >
              <div className="triangle-up"></div>
            </button>
            
            {/* ● Círculo para CONFIRMAR */}
            <button 
              className="confirm-btn-circle" 
              onClick={() => handlePositionSelection()}
              disabled={isPositionOccupied(currentPosition)}
            >
              <div className="circle">
                <span>✓</span>
              </div>
            </button>
            
            {/* ▼ Triângulo para DESCER */}
            <button 
              className="nav-btn down" 
              onClick={() => moveDown()}
              disabled={currentPosition === 10}
            >
              <div className="triangle-down"></div>
            </button>
          </div>
        </div>
  
        {/* Botão Reset */}
        <button className="reset-btn" onClick={() => handleResetAll()}>
          Reset Tudo
        </button>
      </div>
    </div>
  );
};

export default ControllerPage;