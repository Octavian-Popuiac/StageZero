import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { updateRally, type RallyState } from '../services/rallyService';

interface PositionContextValue {
  state: RallyState | null;
  connected: boolean;
  change: (path: string, method: string, body?: unknown) => Promise<void>;
}

const PositionContext = createContext<PositionContextValue | null>(null);

export function usePosition() {
  const context = useContext(PositionContext);
  if (!context) throw new Error('PositionProvider em falta.');
  return context;
}

export function PositionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RallyState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const stream = new EventSource('/v1/events');
    stream.onerror = () => setConnected(false);
    // A primeira mensagem de cada ligação contém o estado atual da base de dados.
    let firstMessage = true;
    stream.onopen = () => { firstMessage = true; };
    stream.onmessage = message => {
      const next: RallyState = JSON.parse(message.data);
      const initial = firstMessage;
      firstMessage = false;
      setState(current => initial || !current || next.revision >= current.revision ? next : current);
      setConnected(true);
    };
    return () => stream.close();
  }, []);

  async function change(path: string, method: string, body?: unknown) {
    const next = await updateRally(path, method, body);
    setState(current => !current || next.revision >= current.revision ? next : current);
  }

  return <PositionContext.Provider value={{ state, connected, change }}>{children}</PositionContext.Provider>;
}
