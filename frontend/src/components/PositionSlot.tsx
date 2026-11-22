import PrologosPosition, { type CompetitorPositionProps } from './PrologosPosition';

interface PositionSlotProps {
  position: number;
  competitor: CompetitorPositionProps | null;
  isSelecting: boolean;
}

export default function PositionSlot({ position, competitor, isSelecting }: PositionSlotProps) {
  return (
    <div className={`result-row${isSelecting ? ' selecting' : ''}`}>
      <span className="display-rank">{position}º</span>
      {competitor ? <PrologosPosition {...competitor} /> : <div className="slot-empty">—</div>}
    </div>
  );
}
