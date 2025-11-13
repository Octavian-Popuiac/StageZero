import React, { useEffect, useRef, useState } from 'react';
import { usePosition } from '../contexts/PositionContext';

interface AlgorithmConfig {
  enabled: boolean;
  type: 'random' | 'time_based' | 'voting' | 'custom';
  parameters?: {
    [key: string]: any;
  };
}

const ControllerPage: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);

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
    resetPositions,
    getNextCompetitorToVote
  } = usePosition();

  const [algorithmConfig, setAlgorithmConfig] = useState<AlgorithmConfig>({
    enabled: false,
    type: 'custom'
  });

  const [lastProcessedCompetitor, setLastProcessedCompetitor] = useState<number | null>(null);
  const lastProcessedRef = useRef<number | null>(null);

  
  useEffect(() => {
    if(competitors.length > 0 && startPositions.length >0){
      setIsInitializing(false);
    } 
  }, [competitors, startPositions]);

  useEffect(() => {
    const handleAutoMove = async () => { 
      if(isInitializing){
        console.log('Initialization phase - skipping auto-move');
        return;
      }

      if(selectingCompetitor) {
        if(lastProcessedRef.current === selectingCompetitor.number){
          console.log('Auto-move already processed for competitor:', selectingCompetitor.pilotName);
          return;
        }

        const currentHasVoted = startPositions.some(slot => slot.competitor?.number === selectingCompetitor.number);
        
        console.log('Auto-move check:', {
          selectingCompetitor,
          currentHasVoted
        });
        
        if(currentHasVoted){
          setLastProcessedCompetitor(selectingCompetitor.number);
          const nextCompetitor = getNextCompetitorToVote();
          if(nextCompetitor){
            // Só muda se for diferente!
            if (selectingCompetitor.number !== nextCompetitor.number) {
              await setSelectingCompetitor(nextCompetitor);
            }
            if (currentPosition !== 1) {
              await setCurrentPosition(1);
            }
          }else {
            await setSelectingCompetitor(null);
          }
        } else {
          setLastProcessedCompetitor(null);
        }
      }
    };

    handleAutoMove();
  }, [startPositions, selectingCompetitor, isInitializing]);

  useEffect(() => {
    if (!isInitializing && competitors.length > 0 && startPositions.length > 0 && !selectingCompetitor) {
      // Seleciona o próximo a votar (ou o primeiro)
      const next = getNextCompetitorToVote();
      if (next) {
        setSelectingCompetitor(next);
        setCurrentPosition(1);
      }
    }
  }, [isInitializing, competitors, startPositions, selectingCompetitor]);

  const isCurrentCompetitorVoted = () => {
    return startPositions.some(slot => slot.competitor?.number === selectingCompetitor?.number);
  }

  const handleResetAll = async () => {
    console.log('Resetting all positions');
    setIsInitializing(true); // ← Importante!
    await resetPositions();
    setTimeout(() => {
      setIsInitializing(false);
    }, 1000); // Dar tempo para estabilizar
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

  const handlePositionSelection = async () => {
    if (!selectingCompetitor) return;

    await handleConfirm();
  };

  const handleConfirm = async () => {
    if (!selectingCompetitor || isPositionOccupied(currentPosition)) return;
    
    try {
      await confirmPosition();
      console.log(`Position ${currentPosition} confirmed for ${selectingCompetitor.pilotName}`);
    } catch (error) {
      console.error('Error confirming position:', error);
    }
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

  if (loading || isInitializing) {
    return (
      <div className="controller-page">
        <div className="controller-waiting">
          <h2>A carregar dados...</h2>
          <p>Aguarde um momento...</p>
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
              <h2>Votação Encerrada</h2>
              
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
      <img src={'BAJA_DE_LAGOS.png'}  alt="Logo" className="controller-baja-logo" />
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
  
        {/* CONTROLOS PRINCIPAIS - Triângulos e Círculo */}
        <div className="position-controls">
          <div className="position-display">
            <span className="position-label">POSIÇÃO</span>
            <div className="position-number">{currentPosition}º</div>
          </div>
  
          <div className="teams-navigation-controls">
            {/* ▲ Triângulo para SUBIR */}
            <button 
              className="teams-nav-btn up" 
              onClick={() => moveUp()}
              disabled={currentPosition === 1}
            >
              <div className="teams-triangle-up"></div>
            </button>
            
            {/* ● Círculo para CONFIRMAR */}
            <button 
              className="teams-confirm-btn-circle" 
              onClick={() => handlePositionSelection()}
              disabled={isPositionOccupied(currentPosition) || isCurrentCompetitorVoted()}
            >
              <div className="teams-circle">
                <span>✓</span>
              </div>
            </button>
            
            {/* ▼ Triângulo para DESCER */}
            <button 
              className="teams-nav-btn down" 
              onClick={() => moveDown()}
              disabled={currentPosition === 10}
            >
              <div className="teams-triangle-down"></div>
            </button>
          </div>
        </div>
  
        {/* Botão Reset */}
        <button className="teams-reset-btn" onClick={() => handleResetAll()}>
          Reset Tudo
        </button>
      </div>
    </div>
  );
};

export default ControllerPage;