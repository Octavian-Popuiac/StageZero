import React, { useState, useEffect } from 'react';
import socket from '../services/socketService';
import Vote from '../types/Vote';

const DisplayPage: React.FC = () => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Conectar ao Socket.IO
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to Socket.IO');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO');
      setConnected(false);
    });

    socket.on('currentVotes', (currentVotes: Vote[]) => {
      console.log('Received current votes:', currentVotes);
      setVotes(currentVotes.sort((a, b) => a.position - b.position));
    });

    socket.on('voteUpdate', (newVote: Vote) => {
      console.log('New vote received:', newVote);
      setVotes(prev => [...prev, newVote].sort((a, b) => a.position - b.position));
    });

    socket.on('votesReset', () => {
      console.log('Votes reset');
      setVotes([]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('currentVotes');
      socket.off('voteUpdate');
      socket.off('votesReset');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="display-page">
      <header className="display-header">
        <h1>🏁 StageZero - Ordem de Partida</h1>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Conectado' : '🔴 Desconectado'}
        </div>
      </header>

      <div className="display-content">
        {votes.length === 0 ? (
          <div className="empty-state">
            <p>Aguardando votos...</p>
            <p className="hint">Os pilotos podem votar escaneando o QR Code</p>
          </div>
        ) : (
          <div className="votes-table">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Piloto</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {votes.map((vote) => (
                  <tr key={vote.pilotId} className="vote-row">
                    <td className="position-cell">
                      <span className="position-badge">{vote.position}</span>
                    </td>
                    <td className="pilot-name">{vote.pilotName}</td>
                    <td className="pilot-id">{vote.pilotId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <span className="stat-label">Total de Votos</span>
            <span className="stat-value">{votes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;