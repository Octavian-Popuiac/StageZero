import React from "react";

export interface CompetitorPositionProps {
  number: number;
  carBrand: string;
  pilotName: string;
  pilotCountry: string;
  navigatorName: string;
  navigatorCountry: string;
  time: string;
}

const PrologosPosition: React.FC<CompetitorPositionProps> = ({
  number,
  carBrand = '',
  pilotName = '---',
  pilotCountry = '',
  navigatorName = '---',
  navigatorCountry = '',
  time = '--:--:--',
}) => {
  return (
    <div className="prologos-row">
      <div className="number-box">
        <span className="number">{number}</span>
      </div>

      <div className="car-brand-box">
        <img src={`/brands/${carBrand.toLowerCase()}.png`} alt={carBrand} className="brand-logo" />
      </div>

      <div className="crew-box">
        <div className="pilot-info">
          <img src={`/flags/${pilotCountry.toLowerCase()}.png`} alt={pilotCountry} className="flag-icon" />
          <span className="pilot-name">{pilotName}</span>
        </div>

        <div className="navigator-info">
          <img src={`/flags/${navigatorCountry.toLowerCase()}.png`} alt={navigatorCountry} className="flag-icon" />
          <span className="navigator-name">{navigatorName}</span>
        </div>
      </div>

      <div className="time-box">
        <span className="time-text">{time}</span>
      </div>
    </div>
  )
}

export default PrologosPosition;