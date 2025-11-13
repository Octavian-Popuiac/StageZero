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
        <div className="pilot-box">
          <div className="pilot-flag">
            <img src={`/flags/${pilotCountry.toLowerCase()}.png`} className="flag-icon" />
          </div>
          <div className="pilot-info">
            <span className="pilot-name">{pilotName}</span>
          </div>
        </div>

        <div className="navigator-box">
          <div className="navigator-flag">
            <img src={`/flags/${navigatorCountry.toLowerCase()}.png`} className="flag-icon" />
          </div>
          <div className="navigator-info">
            <span className="navigator-name">{navigatorName}</span>
          </div>
        </div>
      </div>

      <div className="time-box">
        <span className="time-text">{time}</span>
      </div>
    </div>
  )
}

export default PrologosPosition;