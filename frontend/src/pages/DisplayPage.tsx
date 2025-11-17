import React, { useState, useEffect, useRef, use } from 'react';
import PrologosPosition, { CompetitorPositionProps } from '../components/PrologosPosition';
import PositionSlot from '../components/PositionSlot';
import SelectingCompetitor from '../components/SelectingCompetitor';
import { selectionService, teamService } from '../services/supabaseService';
import { usePosition } from '../contexts/PositionContext';
import { insertCompetitorWithCascade } from '../utils/positionUtils';

const DisplayPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<CompetitorPositionProps[]>([]);

  const lastProcessedCompetitor = useRef<number | null>(null);
  const isProcessing = useRef(false);

  const {
    startPositions,
    setCompetitors,
    competitors,
    selectingCompetitor,
    getNextCompetitorToVote,
    setSelectingCompetitor,
    currentPosition
  } = usePosition();

  const positionsToShow = (selectingCompetitor && currentPosition)
    ? insertCompetitorWithCascade(startPositions, selectingCompetitor, currentPosition)
    : startPositions;

  useEffect(() => {
    loadTeamsFromSupabase();
  
  }, []);

  useEffect(() => {
    console.log('📺 DisplayPage - Current competitor:', selectingCompetitor?.pilotName || 'none');
  }, [selectingCompetitor]);

  const loadTeamsFromSupabase = async () => {
    try {
      setIsLoading(true);
      const teamsData = await teamService.getTeams();
      setResults(teamsData);
      setCompetitors(teamsData);
    }catch (error) {
      console.error('Error loading teams from Supabase:', error);
    }finally {
      setIsLoading(false);
    }
  };

  const sortedResults = competitors;

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
                <span className='dp-position-number'>{index + 1}º</span>
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
          {positionsToShow.map((slot, idx) => {
            // Verifica se este slot mudou em relação ao estado real
            const realSlot = startPositions[idx];
            const isChanged =
              (!realSlot.competitor && slot.competitor) || // Slot ficou ocupado
              (realSlot.competitor && slot.competitor && realSlot.competitor.number !== slot.competitor.number); // Competitor mudou

            // Destaca o slot selecionado ou qualquer slot que mudou no preview
            const isSelecting =
              (selectingCompetitor && currentPosition === slot.position) || isChanged;

            return (
              <PositionSlot
                key={slot.position}
                position={slot.position}
                isOccupied={slot.competitor !== null}
                competitor={slot.competitor}
                isSelecting={isSelecting}
              />
            );
          })}
        </div>

        <SelectingCompetitor />
      </div>
    </div>
  );
};

export default DisplayPage;