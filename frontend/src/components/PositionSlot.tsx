import React from "react";
import PrologosPosition, { CompetitorPositionProps } from "./PrologosPosition";
import { usePosition } from "../contexts/PositionContext";

interface PositionSlotProps {
  position: number;
  isOccupied: boolean;
  competitor?: CompetitorPositionProps | null;
  isSelecting?: boolean;
}

const PositionSlot: React.FC<PositionSlotProps> = ({
  position,
  isOccupied,
  competitor,
  isSelecting = false
}) => {

  return (
    <div className="slot-container">
      <div className="background-container" />
      <div className="slot-position-box">
        <span className="slot-position-number">{position}º</span>
      </div>

      {isOccupied && competitor ? (
        <div className="ocupied-competitor">
          <PrologosPosition {...competitor} />
        </div>
      ) : isSelecting && competitor ? (
        <div className="ocupied-competitor selecting">
          <PrologosPosition {...competitor} />
        </div>
      ) : (
        <div className="slot-empty">
        </div>
      )}
    </div>
  )
}

export default PositionSlot;