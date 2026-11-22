export interface Team {
  number: number;
  carBrand: string;
  pilotName: string;
  pilotCountry: string;
  navigatorName: string;
  navigatorCountry: string;
  time: string;
}

export const SLOT_COUNT = 10;
export const emptyGrid = () => Array<number | null>(SLOT_COUNT).fill(null);

export interface Rally {
  revision: number;
  started: boolean;
  teams: Team[];
  grid: (number | null)[];
  position: number;
}

export function timeInCentiseconds(time: string): number {
  const match = /^(\d{1,3}):([0-5]?\d)[:.](\d{1,2})$/.exec(time);
  if (!match) return NaN;
  const fraction = time.includes('.') ? match[3].padEnd(2, '0') : match[3];
  return Number(match[1]) * 6000 + Number(match[2]) * 100 + Number(fraction);
}

export function placeTeam(grid: Rally['grid'], team: number, position: number) {
  const target = position - 1;
  const next = [...grid];
  let free = next.indexOf(null, target);
  if (free === -1) free = next.lastIndexOf(null, target);
  if (free === -1) return next;

  const step = Math.sign(free - target);
  while (free !== target) {
    next[free] = next[free - step];
    free -= step;
  }
  next[target] = team;
  return next;
}

export function snapshot(rally: Rally) {
  const competitors = [...rally.teams].sort((a, b) =>
    timeInCentiseconds(a.time) - timeInCentiseconds(b.time) || a.number - b.number);
  const eligible = competitors.slice(0, SLOT_COUNT);
  const selectingCompetitor = rally.started
    ? eligible.findLast(team => !rally.grid.includes(team.number)) ?? null
    : null;
  const toSlots = (grid: Rally['grid']) => grid.map((number, index) => ({
    position: index + 1,
    competitor: competitors.find(team => team.number === number) ?? null,
  }));
  return {
    revision: rally.revision,
    started: rally.started,
    competitors,
    eligibleCount: eligible.length,
    selectingCompetitor,
    currentPosition: rally.position,
    startPositions: toSlots(rally.grid),
    previewPositions: toSlots(selectingCompetitor
      ? placeTeam(rally.grid, selectingCompetitor.number, rally.position) : rally.grid),
  };
}

const fields = ['carBrand', 'pilotName', 'pilotCountry', 'navigatorName', 'navigatorCountry', 'time'] as const;

export function parseTeam(input: unknown): Team | null {
  if (!input || typeof input !== 'object') return null;
  const values = input as Record<string, unknown>;
  if (typeof values.number !== 'number' || !Number.isSafeInteger(values.number) || values.number < 1 || values.number > 99999) return null;
  const team = { number: values.number } as Team;
  for (const field of fields) {
    const value = values[field];
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) return null;
    team[field] = value.trim();
  }
  const cs = timeInCentiseconds(team.time);
  if (!Number.isFinite(cs)) return null;
  team.time = [Math.floor(cs / 6000), Math.floor(cs / 100) % 60, cs % 100]
    .map(value => String(value).padStart(2, '0')).join(':');
  return team;
}
