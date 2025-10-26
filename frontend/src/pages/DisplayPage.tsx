import React, { useState, useEffect } from 'react';
import socket from '../services/socketService';
import Vote from '../types/Vote';
import PrologosPosition, { CompetitorPositionProps } from '../components/PrologosPosition';
import PositionSlot from '../components/PositionSlot';
import SelectingCompetitor from '../components/SelectingCompetitor';
import { teamService } from '../services/supabaseService';
import { usePosition } from '../contexts/PositionContext';

interface StartPosition {
  position: number;
  competitor: CompetitorPositionProps | null;
}

const DisplayPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<CompetitorPositionProps[]>([]);

  const {
    startPositions,
    selectingCompetitor,
    setSelectingCompetitor,
    setCompetitors
  } = usePosition();

  useEffect(() => {
    loadTeamsFromSupabase();
  
  }, []);

  const loadTeamsFromSupabase = async () => {
    try {
      setIsLoading(true);
      const teamsData = await teamService.getTeams();
      setResults(teamsData);
    }catch (error) {
      console.error('Error loading teams from Supabase:', error);
    }finally {
      setIsLoading(false);
    }
  };

  const sortedResults = [...results].sort((a,b) => {
    const timeA = a.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
    const timeB = b.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
    return timeA - timeB;
  });

  useEffect(() => {
    console.log('🔄 Updating context with teams:', sortedResults.length); // Debug
    
    if (sortedResults.length > 0) {
      // Atualizar lista de competidores no context
      setCompetitors(sortedResults);
      
      // Se não há ninguém selecionando, começar com o primeiro
      if (!selectingCompetitor) {
        console.log('🎯 Setting first competitor:', sortedResults[0].pilotName); // Debug
        setSelectingCompetitor(sortedResults[0]);
      }
    }
  }, [sortedResults.length]);


  if(isLoading) {
    return (
      <div className='display-page'>
        <div className='loading-screen'>
          <h2>A carregar equipas...</h2>
        </div>
      </div>
    )
  }
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