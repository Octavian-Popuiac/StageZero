import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompetitorPositionProps } from '../components/PrologosPosition';
import { positionService, selectionService, StartPosition, teamService } from '../services/supabaseService';

interface PositionContextType {
  startPositions: StartPosition[];
  setStartPositions: React.Dispatch<React.SetStateAction<StartPosition[]>>;
  selectingCompetitor: CompetitorPositionProps | null;
  setSelectingCompetitor: (competitor: CompetitorPositionProps | null) => Promise<void>; 
  currentPosition: number;
  setCurrentPosition: (position: number) => Promise<void>; 
  competitors: CompetitorPositionProps[];
  setCompetitors: React.Dispatch<React.SetStateAction<CompetitorPositionProps[]>>;
  loading: boolean;
  moveToNextCompetitor: () => Promise<void>; 
  confirmPosition: () => Promise<void>;
  resetPositions: () => Promise<void>;
}

const PositionContext = createContext<PositionContextType | undefined>(undefined);

export const usePosition = () => {
  const context = useContext(PositionContext);
  if (context === undefined) {
    throw new Error('usePosition must be used within a PositionProvider');
  }
  return context;
};

interface PositionProviderProps {
  children: ReactNode;
}

export const PositionProvider: React.FC<PositionProviderProps> = ({ children }) => {
  const [startPositions, setStartPositions] = useState<StartPosition[]>(
    Array.from({length: 10}, (_, i) => ({
      position: i + 1,
      competitor: null
    }))
  );
  
  const [selectingCompetitor, setSelectingCompetitor] = useState<CompetitorPositionProps | null>(null);
  const [currentPosition, setCurrentPosition] = useState<number>(1);
  const [competitors, setCompetitors] = useState<CompetitorPositionProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositionsFromSupabase();
    loadCompetitorsFromSupabase(); 
    loadCurrentSelectionFromSupabase();
    
    // SUBSCRIPTION PARA POSIÇÕES
    const positionsSubscription = positionService.subscribeToStartPositionChanges((updatedPositions) => {
      console.log('Positions updated via realtime:', updatedPositions);
      setStartPositions(updatedPositions);
    });

    // SUBSCRIPTION PARA SINCRONIZAÇÃO ENTRE DISPOSITIVOS
    const selectionSubscription = selectionService.subscribeToSelectionChanges((selection) => {
      console.log('Selection sync from other device:', selection);
      
      // Atualizar competitor selecionado se diferente
      if (selection.selecting_competitor_id !== selectingCompetitor?.number) {
        const competitor = competitors.find(c => c.number === selection.selecting_competitor_id);
        if (competitor) {
          console.log('Updating selecting competitor from other device:', competitor.pilotName);
          setSelectingCompetitor(competitor); // ← Função local para evitar loop
        } else if (selection.selecting_competitor_id === null) {
          setSelectingCompetitor(null);
        }
      }
      
      // Atualizar posição atual se diferente
      if (selection.current_position !== currentPosition) {
        console.log('Updating current position from other device:', selection.current_position);
        setCurrentPosition(selection.current_position); // ← Função local para evitar loop
      }
    });

    return () => {
      positionsSubscription.unsubscribe();
      selectionSubscription.unsubscribe();
    };
  }, []); // ← Manter vazio para evitar loops infinitos

  // ADICIONAR CARREGAMENTO DE COMPETITORS
  const loadCompetitorsFromSupabase = async () => {
    try {
      const teamsData = await teamService.getTeams();
      const sortedTeams = teamsData.sort((a,b) => {
        const timeA = a.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
        const timeB = b.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
        return timeA - timeB;
      });
      
      console.log('Loaded competitors:', sortedTeams.length);
      setCompetitors(sortedTeams);
      
      // Se não há competitor selecionado e há equipas, selecionar primeira
      if (!selectingCompetitor && sortedTeams.length > 0) {
        console.log('Auto-selecting first competitor:', sortedTeams[0].pilotName);
        await setSelectingCompetitorWithSync(sortedTeams[0]);
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
    }
  };

  const loadCurrentSelectionFromSupabase = async () => {
    try {
      const selection = await selectionService.getCurrentSelection();
      
      if (selection) {
        console.log('Loaded current selection from Supabase:', selection);
        
        // Só atualizar se há competitors carregados
        if (competitors.length > 0 && selection.selecting_competitor_id) {
          const competitor = competitors.find(c => c.number === selection.selecting_competitor_id);
          if (competitor) {
            setSelectingCompetitor(competitor); // ← Função local
          }
        }
        
        if (selection.current_position) {
          setCurrentPosition(selection.current_position); // ← Função local
        }
      }
    } catch (error) {
      console.error('Error loading current selection:', error);
    }
  };

  // FUNÇÕES COM SYNC
  const setSelectingCompetitorWithSync = async (competitor: CompetitorPositionProps | null) => {
    setSelectingCompetitor(competitor);
    
    try {
      await selectionService.updateCurrentSelection(
        competitor?.number || null,
        currentPosition
      );
      console.log('Synced selecting competitor:', competitor?.pilotName || 'None');
    } catch (error) {
      console.error('Error syncing selecting competitor:', error);
    }
  };

  const setCurrentPositionWithSync = async (position: number) => {
    setCurrentPosition(position);
    
    try {
      await selectionService.updateCurrentSelection(
        selectingCompetitor?.number || null,
        position
      );
      console.log('Synced current position:', position);
    } catch (error) {
      console.error('Error syncing current position:', error);
    }
  };

  const loadPositionsFromSupabase = async () => {
    try {
      setLoading(true);
      const positions = await positionService.getStartPositions();
      console.log('Loaded positions from Supabase:', positions);
      setStartPositions(positions);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setLoading(false);
    }
  };

  // CORRIGIR moveToNextCompetitor COM SYNC
  const moveToNextCompetitor = async () => {
    if (!selectingCompetitor) return;
    
    const currentIndex = competitors.findIndex(c => c.number === selectingCompetitor.number);
    if (currentIndex !== -1 && currentIndex < competitors.length - 1) {
      const nextCompetitor = competitors[currentIndex + 1];
      console.log('Moving to next competitor:', nextCompetitor.pilotName);
      await setSelectingCompetitorWithSync(nextCompetitor);
      await setCurrentPositionWithSync(1);
    } else {
      console.log('All competitors completed');
      await setSelectingCompetitorWithSync(null);
    }
  };

  const confirmPosition = async (): Promise<void> => {
    if (!selectingCompetitor) return;
    
    try {
      console.log(`Confirming position ${currentPosition} for ${selectingCompetitor.pilotName}`);
      await positionService.setStartPosition(currentPosition, selectingCompetitor.number);
      
      // Atualizar estado local (será substituído pelo realtime)
      setStartPositions(prev => 
        prev.map(slot => 
          slot.position === currentPosition 
            ? { ...slot, competitor: selectingCompetitor }
            : slot
        )
      );
      
      // Passar para próximo competidor COM SYNC
      await moveToNextCompetitor();
    } catch (error: any) {
      console.error('Error confirming position:', error);
      alert(error.message || 'Erro ao confirmar posição');
    }
  };

  const resetPositions = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Resetting all positions...');
      
      await positionService.resetStartPositions();
      await selectionService.resetCurrentSelection();
      
      setStartPositions(Array.from({length: 10}, (_, i) => ({
        position: i + 1,
        competitor: null
      })));
      
      if (competitors.length > 0) {
        await setSelectingCompetitorWithSync(competitors[0]);
        await setCurrentPositionWithSync(1);
      }
      
      console.log('Reset completed');
    } catch (error) {
      console.error('Error resetting positions:', error);
      alert('Erro ao resetar posições');
    } finally {
      setLoading(false);
    }
  };

  // VALUE COM FUNÇÕES SYNC CORRETAS
  const value: PositionContextType = {
    startPositions,
    setStartPositions,
    selectingCompetitor,
    setSelectingCompetitor: setSelectingCompetitorWithSync, // ← Função com sync
    currentPosition,
    setCurrentPosition: setCurrentPositionWithSync, // ← Função com sync
    competitors,
    setCompetitors,
    loading,
    moveToNextCompetitor, // ← Função com sync
    confirmPosition,
    resetPositions,
  };

  return (
    <PositionContext.Provider value={value}>
      {children}
    </PositionContext.Provider>
  );
};