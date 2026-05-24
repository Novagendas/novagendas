import { DIFF_ITEMS, DEMO_STATS, DEMO_BARS } from './data';
import { CheckIcon } from './icons';
import './DiffSection.css';

export default function DiffSection() {
  return (
    <section id="como-funciona" className="lp-diff-section">
      <div className="lp-container lp-diff-inner">

        <div className="lp-diff-text lp-reveal">
          <div className="lp-section-tag">Por qué elegirnos</div>
          <h2 className="lp-section-h2">
            No es solo software.<br />
            <span className="lp-gradient-text">Es tu socio operativo.</span>
          </h2>
          <p className="lp-diff-sub">
            Novagendas se adapta a tu modelo de negocio, no al revés. Cada clínica, spa o consultorio
            tiene su propio subdominio, sus propios datos y su propia configuración.
          </p>
          <ul className="lp-diff-list">
            {DIFF_ITEMS.map((item, i) => (
              <li key={i} className="lp-diff-item">
                <div className="lp-diff-check"><CheckIcon /></div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-demo-card lp-reveal lp-stagger-2">
          <div className="lp-demo-header">
            <div className="lp-demo-avatar">TN</div>
            <div>
              <div className="lp-demo-name">Tu Negocio</div>
              <div className="lp-demo-url">tunegocio.novagendas.com</div>
            </div>
            <div className="lp-demo-badge">Activo</div>
          </div>

          <div className="lp-demo-stats">
            {DEMO_STATS.map(({ val, label }) => (
              <div key={label} className="lp-demo-stat">
                <div className="lp-demo-stat-val">{val}</div>
                <div className="lp-demo-stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="lp-demo-bars">
            <div className="lp-demo-bars-title">Servicios más solicitados</div>
            {DEMO_BARS.map(([name, pct]) => (
              <div key={name} className="lp-demo-bar-row">
                <span className="lp-demo-bar-name">{name}</span>
                <div className="lp-demo-bar-track">
                  <div className="lp-demo-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="lp-demo-bar-pct">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
