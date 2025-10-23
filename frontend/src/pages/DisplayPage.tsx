import React, { useState, useEffect } from 'react';
import socket from '../services/socketService';
import Vote from '../types/Vote';
import PrologosPosition, { CompetitorPositionProps } from '../components/PrologosPosition';
import PositionSlot from '../components/PositionSlot';
import SelectingCompetitor from '../components/SelectingCompetitor';

interface StartPosition {
  position: number;
  competitor: CompetitorPositionProps | null;
}

const DisplayPage: React.FC = () => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [connected, setConnected] = useState(false);

  const [results, setResults] = useState<CompetitorPositionProps[]>([]);

  useEffect(() => {
    const savedTeams = localStorage.getItem('stagezero_teams');
    if (savedTeams) {
      console.log('Loaded teams from localStorage');
      console.log(savedTeams);
      const parsedTeams = JSON.parse(savedTeams);
      setResults(parsedTeams);
    } else {
      console.log('No teams found in localStorage');
      setResults([]);
    }
  }, []);

  const [startPositions, setStartPositions] = useState<StartPosition[]>(
    Array.from({length: 10}, (_, i) => ({
      position: i + 1,
      competitor: null
    }))
  );

  const [selectingCompetitor, setSelectingCompetitor] = useState<CompetitorPositionProps | null>(null);
  const [currentPosition, setCurrentPosition] = useState<number>(1);

  const sortedResults = [...results].sort((a,b) => {
    const timeA = a.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
    const timeB = b.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
    return timeA - timeB;
  });

  useEffect(() => {
    if (sortedResults.length > 0 && !selectingCompetitor) {
      setSelectingCompetitor(sortedResults[0]);
      setCurrentPosition(1);
    }
  }, [sortedResults, selectingCompetitor]);

  useEffect(() => {
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

    // Receber mudança de posição do ControlPage
    socket.on('positionChange', (data: { position: number }) => {
      console.log('Nova posição:', data.position);
      setCurrentPosition(data.position);
    });

    // Receber confirmação de escolha
    socket.on('positionConfirmed', (data: { competitor: CompetitorPositionProps; position: number }) => {
      console.log('Posição confirmada:', data);
      
      // Atualizar a posição escolhida
      setStartPositions(prev => 
        prev.map(slot => 
          slot.position === data.position 
            ? { ...slot, competitor: data.competitor }
            : slot
        )
      );
      
      // Passar para o próximo competidor
      const currentIndex = sortedResults.findIndex(r => r.number === data.competitor.number);
      if (currentIndex !== -1 && currentIndex < sortedResults.length - 1) {
        setSelectingCompetitor(sortedResults[currentIndex + 1]);
        setCurrentPosition(1);
      } else {
        // Todos já escolheram
        setSelectingCompetitor(null);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('currentVotes');
      socket.off('voteUpdate');
      socket.off('votesReset');
      socket.off('positionChange');
      socket.off('positionConfirmed');
      socket.disconnect();
    };
  }, [sortedResults]);
  

  return (
    <div className='display-page'>
      <div className='left-panel'>
        <img src={`${process.env.PUBLIC_URL}/BAJA_DE_LAGOS.png`}  alt="Logo" className="baja-logo" />
        <div className='prologo-title-container'>
          <h1 className='prologos-title'>
            Tempos Prólogos
          </h1>
        </div>
        <div className='competitors-results'>
          {sortedResults.map((result, index) => (
            <div key={result.number} className='result-row'>
              <div className='position-box'>
                <span className='position-number'>{index + 1}º</span>
              </div>
              <PrologosPosition
                number={result.number}
                carBrand={result.carBrand}
                pilotName={result.pilotName}
                pilotCountry={result.pilotCountry}
                navigatorName={result.navigatorName}
                navigatorCountry={result.navigatorCountry}
                time={result.time}
              />
            </div>
          ))}
        </div>
      </div>

      <div className='right-panel'>
        <div className='partida-title-container'>
          <h1 className='partida-title'>
            Escolha de Ordem da Partida SS1
          </h1>
        </div>

        <div className='start-positions'>
          {startPositions.map(slot => (
            <PositionSlot
              key={slot.position}
              position={slot.position}
              isOccupied={slot.competitor !== null}
              competitor={slot.competitor}
            />
          ))}
        </div>

        {selectingCompetitor && (
          <SelectingCompetitor
            competitor={selectingCompetitor}
          />
        )}
      </div>
    </div>
  );
};

export default DisplayPage;