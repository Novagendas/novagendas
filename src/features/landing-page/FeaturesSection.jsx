import { FEATURES } from './data';
import { GCalIcon } from './icons';
import './FeaturesSection.css';

const GCAL_MINI = [
  { day: 'HOY', evs: [{ label: '10:00 Cita', cls: 'lp-ev-main' }, { label: '📅 GCal', cls: 'lp-ev-pink' }] },
  { day: 'MAÑ', evs: [{ label: '09:30', cls: 'lp-ev-green' }, { label: '14:00', cls: 'lp-ev-blue' }] },
  { day: 'JUE', evs: [{ label: '11:00', cls: 'lp-ev-purple' }] },
];

export default function FeaturesSection() {
  return (
    <section id="funciones" className="lp-features-section">
      <div className="lp-container">
        <div className="lp-section-tag lp-reveal">Funcionalidades</div>
        <h2 className="lp-section-h2 lp-reveal lp-stagger-1">
          Todo lo que tu negocio <span className="lp-gradient-text">realmente necesita</span>
        </h2>
        <p className="lp-section-sub lp-reveal lp-stagger-2">
          Cada módulo fue construido para el flujo real de un negocio con citas. Sin funciones de relleno.
        </p>

        <div className="lp-features-grid">

          {/* GCal card — full width */}
          <div className="lp-feat-card lp-feat-card--gcal lp-reveal">
            <div className="lp-feat-gcal-content">
              <div className="lp-feat-icon" style={{ background: '#F0FDF4' }}>📅</div>
              <div className="lp-feat-title">Sincronización con Google Calendar</div>
              <p className="lp-feat-desc">
                Todas las citas se sincronizan automáticamente con Google Calendar de tu negocio.
                Tus clientes reciben invitaciones con recordatorios — tú ves todo desde un solo lugar.
              </p>
              <div className="lp-gcal-flow">
                <div className="lp-gcal-flow-node"><GCalIcon size={14} /> Google Calendar</div>
                <span className="lp-gcal-flow-arrow">⇄</span>
                <div className="lp-gcal-flow-node">📅 Novagendas</div>
                <span className="lp-gcal-flow-arrow">→</span>
                <div className="lp-gcal-flow-node">✉️ Invitación al cliente</div>
              </div>
            </div>
            <div className="lp-feat-gcal-visual">
              <div className="lp-feat-gcal-visual-label">Vista sincronizada</div>
              <div className="lp-gcal-mini-week">
                {GCAL_MINI.map(({ day, evs }) => (
                  <div key={day} className="lp-week-col">
                    <span className="lp-week-hd">{day}</span>
                    {evs.map((ev, i) => (
                      <div key={i} className={`lp-week-ev ${ev.cls}`}>{ev.label}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature cards */}
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="lp-feat-card lp-reveal"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="lp-feat-icon" style={{ background: f.iconBg }}>{f.icon}</div>
              <div className="lp-feat-title">{f.title}</div>
              <p className="lp-feat-desc">{f.desc}</p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
