import React from "react";
import PrologosPosition, { CompetitorPositionProps } from "./PrologosPosition";

interface SelectingCompetitorProps {
  competitor: CompetitorPositionProps;
}

const SelectingCompetitor: React.FC<SelectingCompetitorProps> = ({
  competitor
}) => {
  return (
    <div className="selecting-competitor">
      <div className="selecting-card">
        <PrologosPosition {...competitor} />
      </div>
    </div>
  )
}

export default SelectingCompetitor;