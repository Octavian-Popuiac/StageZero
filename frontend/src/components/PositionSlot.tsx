import React from "react";
import PrologosPosition, { CompetitorPositionProps } from "./PrologosPosition";

interface PositionSlotProps {
  position: number;
  isOccupied: boolean;
  competitor?: CompetitorPositionProps | null;
}

const PositionSlot: React.FC<PositionSlotProps> = ({
  position,
  isOccupied,
  competitor,
}) => {
  return (
    <div className="slot-container">
      <div className="background-container" />
      <div className="slot-position-box">
        <span className="slot-position-number">{position}º</span>
      </div>

      {isOccupied && competitor ? (
        <PrologosPosition {...competitor} />
      ) : (
        <div className="slot-empty">
          <span className="slot-empty-text">----</span>
        </div>
      )}
    </div>
  )
}

export default PositionSlot;