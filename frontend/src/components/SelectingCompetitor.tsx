import React, { useEffect, useState, useRef } from "react";
import PrologosPosition, { CompetitorPositionProps } from "./PrologosPosition";
import { usePosition } from "../contexts/PositionContext";

const SelectingCompetitor: React.FC = () => {
  const { selectingCompetitor, startPositions } = usePosition();
  const [hasVoted, setHasVoted] = useState(false);
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if(selectingCompetitor){
      console.log('SelectingCompetitor updated:', selectingCompetitor.pilotName);
      const voted = startPositions.some(slot => 
        slot.competitor?.number === selectingCompetitor.number
      );
      
      setHasVoted(voted);

      if(voted){
        console.log(`${selectingCompetitor.pilotName} has already voted.`);
        setShowUpdateMessage(true);
        
        // Limpar timeout anterior se existir
        if(timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Mostrar mensagem por 5 segundos, depois mostrar o competitor mesmo assim
        timeoutRef.current = setTimeout(() => {
          console.log('Timeout - showing competitor even though voted');
          setShowUpdateMessage(false);
        }, 5000);
      } else {
        setShowUpdateMessage(false);
        if(timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }
    
    return () => {
      if(timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectingCompetitor, startPositions]);

  if(!selectingCompetitor){
    return (
      <div className="selecting-competitor">
        <div className="selecting-card empty">
          <p>Aguardando seleção...</p>
        </div>
      </div>
    );
  }

  if(hasVoted && showUpdateMessage) {
    return (
      <div className="selecting-competitor">
        <div className="selecting-card voted">
          <p>🔄 Atualizando para próximo competidor...</p>
          <small>Aguardando sincronização...</small>
        </div>
      </div>
    );
  }

  return (
    <div className="selecting-competitor">
      <div className="selecting-card">
        <PrologosPosition {...selectingCompetitor} />
        {hasVoted && (
          <div style={{ 
            color: 'orange', 
            fontSize: '0.9em', 
            marginTop: '10px',
            textAlign: 'center' 
          }}>
            Este competitor já votou
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectingCompetitor;