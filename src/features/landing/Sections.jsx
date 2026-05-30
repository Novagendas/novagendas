import { Icon, Logo } from './ui';

// ============================================================
// Steps + Quote + Pillars + CTA + Footer
// ============================================================

export function Steps() {
  const steps = [
    { n: '1', icon: 'log-in', t: 'Configura tu negocio', d: 'Carga tus servicios, especialistas y horarios de atención. La curva de aprendizaje es mínima — estás listo en minutos.' },
    { n: '2', icon: 'calendar-plus', t: 'Registra cada cita', d: 'Tus clientes te escriben por WhatsApp, llaman o llegan; tú las registras y el sistema asigna y bloquea el espacio.' },
    { n: '3', icon: 'trending-up', t: 'Controla y mejora', d: 'Sigue tus ingresos, ocupación e inasistencias con reportes internos. Tu negocio evoluciona con datos reales.' },
  ];
  return (
    <section className="section" id="como-funciona">
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />Cómo funciona</span>
          <h2 className="reveal reveal-d1">Tu primer paso hacia la transformación digital</h2>
          <p className="reveal reveal-d2">Sin riesgo técnico y sin complicaciones. Tres pasos para pasar del caos al control.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className={'step s' + s.n + ' reveal reveal-d' + (i + 1)} key={s.n}>
              {i < 2 && <span className="step-line" />}
              <div className="step-num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Quote() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="quote-band reveal">
          <div className="mark">“</div>
          <blockquote>
            Antes vivíamos pegados a un cuaderno y al WhatsApp. Con Novagendas tenemos toda la agenda en
            tiempo real, sin choques de horario, y por fin sé exactamente cuánto entra cada día.
          </blockquote>
          <div className="quote-by">
            <span className="av">DG</span>
            <span className="who">
              <b>Daniela González</b>
              <span>Administradora · Estudio de estética</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Pillars() {
  const pillars = [
    { icon: 'feather', t: 'Simplicidad', d: 'Fácil de usar desde el primer día.' },
    { icon: 'zap', t: 'Eficiencia', d: 'Menos tareas manuales, más control.' },
    { icon: 'puzzle', t: 'Adaptabilidad', d: 'Se ajusta a cómo trabajas tú.' },
    { icon: 'sliders-horizontal', t: 'Control', d: 'Toda tu operación en un lugar.' },
    { icon: 'trending-up', t: 'Evolución', d: 'Crece con tu negocio.' },
  ];
  return (
    <section className="section section-surface" id="valores" style={{ paddingTop: 96 }}>
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />Nuestra filosofía</span>
          <h2 className="reveal reveal-d1">Hecho para ser útil, no complejo</h2>
          <p className="reveal reveal-d2">Cinco principios guían cada decisión de Novagendas.</p>
        </div>
        <div className="pillars">
          {pillars.map((p, i) => (
            <div className={'pillar reveal reveal-d' + (i + 1)} key={p.t}>
              <span className="pi"><Icon name={p.icon} size={22} /></span>
              <b>{p.t}</b>
              <span>{p.d}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA({ onLaunchDemo }) {
  return (
    <section className="section" id="cta" style={{ paddingTop: 40 }}>
      <div className="lp-wrap">
        <div className="cta reveal">
          <div className="cta-bg">
            <span className="cta-grid" />
            <span className="cta-blob c1" />
            <span className="cta-blob c2" />
          </div>
          <div className="cta-inner">
            <span className="eyebrow on-dark"><span className="eyebrow-dot" />Empieza hoy</span>
            <h2>Tu negocio, organizado.<br />Tú, en control.</h2>
            <p>Da el primer paso hacia la transformación digital de tu negocio de estética. Sin riesgo técnico, con resultados desde el día uno.</p>
            <div className="cta-actions">
              <a className="btn btn-primary btn-lg" href="#" onClick={(e) => { e.preventDefault(); onLaunchDemo && onLaunchDemo(); }}>Agenda Demo<Icon name="arrow-right" size={18} /></a>
              <a className="btn btn-ghost-light btn-lg" href="#" onClick={(e) => { e.preventDefault(); onLaunchDemo && onLaunchDemo(); }}><Icon name="calendar" size={18} />Agenda Demo</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const cols = [
    { h: 'Producto', links: ['Agenda de Citas', 'Pacientes', 'Registro de Pagos', 'Estadísticas'] },
    { h: 'Empresa', links: ['Nosotros', 'Filosofía', 'Contacto', 'Soporte'] },
    { h: 'Recursos', links: ['Guía de inicio', 'Preguntas frecuentes', 'Privacidad', 'Términos'] },
  ];
  return (
    <footer className="footer">
      <div className="lp-wrap">
        <div className="footer-top">
          <div>
            <Logo />
            <p className="footer-desc">Plataforma web de agendamiento inteligente para profesionales de estética y negocios de servicios. Tu negocio, organizado.</p>
          </div>
          {cols.map((c) => (
            <div className="footer-col" key={c.h}>
              <h4>{c.h}</h4>
              {c.links.map((l) => {
                let href = "#";
                if (l === 'Términos') href = "/terminos";
                if (l === 'Privacidad') href = "/condiciones";
                return <a href={href} key={l}>{l}</a>;
              })}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="cp">© 2026 Novagendas. Todos los derechos reservados.</span>
          <div className="footer-social">
            <a href="#" aria-label="Instagram"><Icon name="camera" size={18} /></a>
            <a href="#" aria-label="Comunidad"><Icon name="users" size={18} /></a>
            <a href="#" aria-label="WhatsApp"><Icon name="message-circle" size={18} /></a>
            <a href="#" aria-label="Correo"><Icon name="mail" size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
