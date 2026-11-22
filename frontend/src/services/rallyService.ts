import type { CompetitorPositionProps as Team } from '../components/PrologosPosition';

export interface Slot {
  position: number;
  competitor: Team | null;
}

export interface RallyState {
  revision: number;
  started: boolean;
  competitors: Team[];
  eligibleCount: number;
  selectingCompetitor: Team | null;
  currentPosition: number;
  startPositions: Slot[];
  previewPositions: Slot[];
}

export async function updateRally(path: string, method: string, body: unknown = {}): Promise<RallyState> {
  const response = await fetch(`/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Não foi possível guardar a alteração.');
  }
  return response.json();
}
