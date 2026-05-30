import { Icon, CountUp } from './ui';

// ============================================================
// Stat strip + Features
// ============================================================

export function StatStrip() {
  return (
    <div className="statstrip">
      <div className="lp-wrap-wide statstrip-inner">
        <div className="stat reveal">
          <div className="big"><CountUp to={100} format={(n) => n} /><span className="u">%</span></div>
          <div className="cap">Agenda centralizada</div>
        </div>
        <div className="stat reveal reveal-d1">
          <div className="big"><CountUp to={0} /></div>
          <div className="cap">Dobles reservas</div>
        </div>
        <div className="stat reveal reveal-d2">
          <div className="big"><CountUp to={9} format={(n) => n} /><span className="u">+</span></div>
          <div className="cap">Módulos de gestión</div>
        </div>
        <div className="stat reveal reveal-d3">
          <div className="big"><CountUp to={24} /><span className="u">/7</span></div>
          <div className="cap">Disponible siempre</div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: 'calendar-clock', tint: 'var(--blue-soft)', color: 'var(--blue-600)',
    title: 'Agenda en tiempo real',
    desc: 'Toda tu operación en una vista de equipo que se actualiza al instante. Los horarios ocupados se bloquean solos para que nunca haya una doble reserva.' },
  { icon: 'users', tint: 'var(--violet-soft)', color: 'var(--violet)',
    title: 'Especialistas y servicios',
    desc: 'Asigna cada cita al especialista disponible y controla los tiempos de atención por tipo de servicio. Cada quien sabe qué sigue.' },
  { icon: 'credit-card', tint: 'var(--emerald-soft)', color: 'var(--emerald)',
    title: 'Registro de pagos',
    desc: 'Lleva el cierre diario y el historial de ingresos sin hojas de cálculo. Tus números, claros y siempre a la mano.' },
  { icon: 'calendar-x', tint: 'var(--amber-soft)', color: 'var(--amber)',
    title: 'Reagenda y cancela con orden',
    desc: 'Días bloqueados, reprogramaciones e inasistencias estructuradas. Los cambios dejan de ser un dolor de cabeza.' },
  { icon: 'box', tint: 'var(--slate-soft)', color: 'var(--slate-600)',
    title: 'Inventario y servicios',
    desc: 'Controla insumos y catálogo de servicios desde el mismo panel. Todo lo que mueve tu negocio, en un solo lugar.' },
  { icon: 'bar-chart-3', tint: 'var(--blue-soft)', color: 'var(--blue-600)',
    title: 'Estadísticas internas',
    desc: 'Volumen de servicios, frecuencia de atención y ocupación por especialista. Decide con datos, no con corazonadas.' },
];

export function Features() {
  return (
    <section className="section" id="funciones">
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />Todo en una plataforma</span>
          <h2 className="reveal reveal-d1">Lo que tu negocio necesita, sin lo que le sobra</h2>
          <p className="reveal reveal-d2">No la herramienta más compleja del mercado — la más útil y adaptada a cómo trabajas de verdad.</p>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <article className={'feat-card reveal reveal-d' + ((i % 3) + 1)} key={f.title}>
              <div className="feat-ico" style={{ background: f.tint, color: f.color }}>
                <Icon name={f.icon} size={24} color={f.color} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="feat-link">Conocer más<Icon name="arrow-right" size={15} /></span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
