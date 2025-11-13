import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { CompetitorPositionProps } from '../components/PrologosPosition';
import { positionService, selectionService, StartPosition, swapPositions, teamService } from '../services/supabaseService';

interface PositionContextType {
  startPositions: StartPosition[];
  setStartPositions: React.Dispatch<React.SetStateAction<StartPosition[]>>;
  selectingCompetitor: CompetitorPositionProps | null;
  setSelectingCompetitor: (competitor: CompetitorPositionProps | null) => Promise<void>;
  currentPosition: number;
  setCurrentPosition: (position: number) => Promise<void>;
  competitors: CompetitorPositionProps[];
  setCompetitors: (competitors: CompetitorPositionProps[]) => void;
  loadCompetitorsFromSupabase: () => Promise<void>;
  loading: boolean;
  moveToNextCompetitor: () => Promise<void>;
  confirmPosition: () => Promise<void>;
  resetPositions: () => Promise<void>;
  getNextCompetitorToVote: () => CompetitorPositionProps | null;
  moveCompetitor: (from: number, to: number) => void;
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
    Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      competitor: null
    }))
  );

  const [selectingCompetitor, setSelectingCompetitor] = useState<CompetitorPositionProps | null>(null);
  const [currentPosition, setCurrentPosition] = useState<number>(1);
  const [competitors, setCompetitors] = useState<CompetitorPositionProps[]>([]);
  const [loading, setLoading] = useState(true);

  const subscriptionRef = useRef<any>(null);
  const hasSubscribedRef = useRef(false);

  const sortCompetitorsWithSort = (competitors: CompetitorPositionProps[]) => {
    return [...competitors].sort((a, b) => {
      const timeA = a.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
      const timeB = b.time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
      return timeA - timeB;
    });
  };

  const setCompetitorsWithSort = (newCompetitors: CompetitorPositionProps[]) => {
    const sortedCompetitors = sortCompetitorsWithSort(newCompetitors);

    setCompetitors(sortedCompetitors);

    if (!selectingCompetitor && sortedCompetitors.length > 0) {
      setSelectingCompetitor(sortedCompetitors[sortedCompetitors.length - 1]);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadPositionsFromSupabase();
      await loadCompetitorsFromSupabase();
      
      setTimeout(async () => {
        await loadCurrentSelectionFromSupabase();
      }, 200);
    }

    initializeData();

    // SUBSCRIPTION PARA POSIÇÕES
    const positionsSubscription = positionService.subscribeToStartPositionChanges((updatedPositions) => {
      console.log('Positions updated via realtime:', updatedPositions);
      setStartPositions(updatedPositions);
    });

    return () => {
      positionsSubscription.unsubscribe();
    };
  }, []); // ← Manter vazio para evitar loops infinitos

  useEffect(() => {
    // Se já tem subscription, não criar outra
    if (hasSubscribedRef.current) {
      return;
    }

    // Se não tem competitors ainda, aguardar
    if (competitors.length === 0) {
      console.log('⏳ Waiting for competitors...');
      return;
    }

    console.log('Creating PERMANENT subscription with', competitors.length, 'competitors');
    hasSubscribedRef.current = true; // Marcar como criada

    subscriptionRef.current = selectionService.subscribeToSelectionChanges((selection) => {
      console.log('🔄 REALTIME UPDATE RECEIVED:', {
        competitor_id: selection.selecting_competitor_id,
        position: selection.current_position,
        timestamp: new Date().toLocaleTimeString()
      });

      // 1. SEMPRE processar position primeiro
      setCurrentPosition( prev => {
        if(selection.current_position && prev !== selection.current_position) {
          return selection.current_position;
        }
        return prev;
      })

      setSelectingCompetitor(prev => {
        if( selection.selecting_competitor_id === null && prev !== null) {
          return null;
        }

        if( selection.selecting_competitor_id && (prev?.number !== selection.selecting_competitor_id) ) {
          const newCompetitor = competitors.find(c => c.number === selection.selecting_competitor_id);
          if (newCompetitor) {
            return newCompetitor;
          }
        }
        return prev;
      })
    });

    return () => {
      if (subscriptionRef.current && hasSubscribedRef.current) {
        console.log('🔌 Final cleanup - unsubscribing');
        subscriptionRef.current.unsubscribe();
        hasSubscribedRef.current = false;
      }
    };
  }, [competitors.length]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current && hasSubscribedRef.current) {
        console.log('🔌 Final cleanup - unsubscribing');
        subscriptionRef.current.unsubscribe();
        hasSubscribedRef.current = false;
      }
    };
  }, []);

  const loadCompetitorsFromSupabase = async () => {
    try {
      const teamsData = await teamService.getTeams();

      setCompetitorsWithSort(teamsData);
    } catch (error) {
      console.error('Error loading competitors:', error);
    }
  }

  const loadCurrentSelectionFromSupabase = async () => {
    try {
      const selection = await selectionService.getCurrentSelection();
      
      if (!selection || competitors.length === 0) {
        console.log('No selection or competitors');
        return;
      }

      console.log('Loading selection:', selection);

      // 1. Definir posição
      if (selection.current_position) {
        setCurrentPosition(selection.current_position);
      }

      // 2. Definir competitor
      if (selection.selecting_competitor_id) {
        const competitor = competitors.find(c => 
          c.number === selection.selecting_competitor_id
        );
        
        if (competitor) {
          setSelectingCompetitor(competitor);
        }
      } else {
        setSelectingCompetitor(null);
      }
    } catch (error) {
      console.error('Error loading selection:', error);
    }
  };

  // FUNÇÕES COM SYNC
  const setSelectingCompetitorWithSync = async (competitor: CompetitorPositionProps | null) => {
    if(selectingCompetitor?.number === competitor?.number) {
      return;
    }

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
    if (currentPosition === position) return;

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


      setStartPositions(prev =>
        prev.map(slot =>
          slot.position === currentPosition
            ? { ...slot, competitor: selectingCompetitor }
            : slot
        )
      );

      await loadCompetitorsFromSupabase();

    } catch (error: any) {
      console.error('Error confirming position:', error);
      alert(error.message || 'Erro ao confirmar posição');
    }
  };

  const getNextCompetitorToVote = (): CompetitorPositionProps| null => {
    const competitorsWithoutPosition = competitors.filter(competitor => !startPositions.some(slot => slot.competitor?.number === competitor.number));

    if (competitorsWithoutPosition.length === 0) {
      return null;
    }

    return competitorsWithoutPosition[competitorsWithoutPosition.length - 1];
  }

  const resetPositions = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Resetting all positions...');

      // 1. Reset no Supabase
      await positionService.resetStartPositions();
      
      // 2. Reset local state
      setStartPositions(Array.from({ length: 10 }, (_, i) => ({
        position: i + 1,
        competitor: null
      })));
      
      // 3. Reset seleção
      setSelectingCompetitor(null);
      setCurrentPosition(1);
      
      // 4. Sync com Supabase (só uma vez no final)
      await selectionService.updateCurrentSelection(null, 1);
      
      // 5. Recarregar competitors
      await loadCompetitorsFromSupabase();
      
      console.log('Reset completed');
    } catch (error) {
      console.error('Error resetting positions:', error);
      alert('Erro ao resetar posições');
    } finally {
      setLoading(false);
    }
  };

  const moveCompetitor = (from: number, to: number) => {
    setStartPositions(prev => {
      const updated = [...prev];
      const fromIdx = updated.findIndex(slot => slot.position === from);
      const toIdx = updated.findIndex(slot => slot.position === to);
      if (fromIdx === -1 || toIdx === -1) return prev;

      // Troca os competitors
      const temp = updated[fromIdx].competitor;
      updated[fromIdx].competitor = updated[toIdx].competitor;
      updated[toIdx].competitor = temp;

      // (Opcional) Atualiza no Supabase aqui, se quiseres persistência
      // await positionService.swa(updated);

      return updated;
    });

    swapPositions(from, to).catch(console.error);
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
    setCompetitors: setCompetitorsWithSort,
    loadCompetitorsFromSupabase,
    loading,
    moveToNextCompetitor, // ← Função com sync
    confirmPosition,
    getNextCompetitorToVote,
    resetPositions,
    moveCompetitor
  };

  return (
    <PositionContext.Provider value={value}>
      {children}
    </PositionContext.Provider>
  );
};