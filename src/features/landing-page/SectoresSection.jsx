import { SECTORES } from './data';
import './SectoresSection.css';

export default function SectoresSection() {
  return (
    <div id="sectores" className="lp-sectores">
      <div className="lp-container">
        <p className="lp-sectores-label">Para cualquier negocio que trabaje con citas</p>
        <div className="lp-sectores-chips">
          {SECTORES.map(({ label, highlight }) => (
            <div
              key={label}
              className={`lp-sector-chip${highlight ? ' lp-sector-chip--highlight' : ''}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
