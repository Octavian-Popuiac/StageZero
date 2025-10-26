import React from "react";
import PrologosPosition, { CompetitorPositionProps } from "./PrologosPosition";
import { usePosition } from "../contexts/PositionContext";

interface SelectingCompetitorProps {
  competitor: CompetitorPositionProps;
}

const SelectingCompetitor: React.FC<SelectingCompetitorProps> = ({
  competitor
}) => {
  const { currentPosition } = usePosition();

  return (
    <div className="selecting-competitor">
      <div className="selecting-card">
        <PrologosPosition {...competitor} />
      </div>
    </div>
  )
}

export default SelectingCompetitor;