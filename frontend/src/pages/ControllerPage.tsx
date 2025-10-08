import React, { useState, useEffect } from 'react';
import socket from '../services/socketService';

interface Position {
  row: number;
  col: number;
}

const ControllerPage: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position>({ row: 0, col: 0 });
  const [gridSize] = useState({ rows: 4, cols: 5 });
  const [pilotName, setPilotName] = useState('');
  const [pilotId, setPilotId] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Controller connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Controller disconnected');
      setConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  // Navegação
  const moveUp = () => {
    setCurrentPosition(prev => ({
      ...prev,
      row: Math.max(0, prev.row - 1)
    }));
  };

  const moveDown = () => {
    setCurrentPosition(prev => ({
      ...prev,
      row: Math.min(gridSize.rows - 1, prev.row + 1)
    }));
  };

  const moveLeft = () => {
    setCurrentPosition(prev => ({
      ...prev,
      col: Math.max(0, prev.col - 1)
    }));
  };

  const moveRight = () => {
    setCurrentPosition(prev => ({
      ...prev,
      col: Math.min(gridSize.cols - 1, prev.col + 1)
    }));
  };

  const getPositionNumber = () => {
    return currentPosition.row * gridSize.cols + currentPosition.col + 1;
  };

  const handleConfirm = () => {
    if (!pilotName.trim() || !pilotId.trim()) {
      alert('Preencha o nome e ID do piloto!');
      return;
    }

    const position = getPositionNumber();
    
    // Enviar seleção via Socket.IO
    socket.emit('selectPosition', {
      pilotId: pilotId.trim(),
      pilotName: pilotName.trim(),
      position,
      row: currentPosition.row,
      col: currentPosition.col
    });

    alert(`Posição ${position} confirmada para ${pilotName}!`);
  };

  const startSelection = () => {
    if (!pilotName.trim() || !pilotId.trim()) {
      alert('Preencha o nome e ID do piloto!');
      return;
    }
    setIsSelecting(true);
  };

  if (!isSelecting) {
    return (
      <div className="controller-page">
        <div className="controller-setup">
          <h1>🎮 Controlo</h1>
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Conectado' : '🔴 Desconectado'}
          </div>
          
          <div className="setup-form">
            <input
              type="text"
              placeholder="Nome do Piloto"
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value)}
            />
            <input
              type="text"
              placeholder="ID do Piloto"
              value={pilotId}
              onChange={(e) => setPilotId(e.target.value)}
            />
            <button onClick={startSelection} className="start-btn">
              Iniciar Seleção
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="controller-page">
      <div className="controller-container">
        <header className="controller-header">
          <h2>🎮 Controlo</h2>
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢' : '🔴'}
          </div>
        </header>

        <div className="pilot-info">
          <p><strong>Piloto:</strong> {pilotName}</p>
          <p><strong>ID:</strong> {pilotId}</p>
        </div>

        <div className="position-display">
          <div className="position-number">{getPositionNumber()}</div>
          <div className="position-coords">
            Linha {currentPosition.row + 1}, Coluna {currentPosition.col + 1}
          </div>
        </div>

        <div className="dpad-container">
          <button className="dpad-btn up" onClick={moveUp}>
            ▲
          </button>
          <div className="dpad-middle">
            <button className="dpad-btn left" onClick={moveLeft}>
              ◄
            </button>
            <div className="dpad-center">O</div>
            <button className="dpad-btn right" onClick={moveRight}>
              ►
            </button>
          </div>
          <button className="dpad-btn down" onClick={moveDown}>
            ▼
          </button>
        </div>

        <button className="confirm-btn" onClick={handleConfirm}>
          ✓ CONFIRMAR POSIÇÃO
        </button>

        <button className="back-btn" onClick={() => setIsSelecting(false)}>
          ← Voltar
        </button>
      </div>
    </div>
  );
};

export default ControllerPage;