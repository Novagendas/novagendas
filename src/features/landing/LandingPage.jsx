import React, { useState, useEffect, useRef } from 'react';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './LandingPage.css';

/* ── Intersection Observer hook ── */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal-visible'); }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Counter animation ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = Math.ceil(target / 60);
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(start);
        if (start >= target) clearInterval(interval);
      }, 20);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString('es-CO')}{suffix}</span>;
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useReveal();

  return (
    <div className="lp">
      <ParticleBackground />

      {/* ─── Navbar ─── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <div className="lp-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="lp-brand-name">Novagendas</span>
        </div>

        <div className="lp-nav-links">
          <a href="#problema">Problema</a>
          <a href="#solucion">Solución</a>
          <a href="#funciones">Funciones</a>
          <a href="#contacto">Contacto</a>
        </div>

        <div className="lp-nav-actions">
          <ThemeToggle />
          <button className="lp-mobile-btn" onClick={() => setIsMenuOpen(o => !o)} aria-label="Menú">
            {isMenuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="lp-mobile-menu">
          <button className="lp-mobile-close" onClick={() => setIsMenuOpen(false)}>✕</button>
          {['problema','solucion','funciones','contacto'].map(s => (
            <a key={s} href={`#${s}`} onClick={() => setIsMenuOpen(false)} className="lp-mobile-link">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          ))}
        </div>
      )}

      {/* ─── Hero ─── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge reveal stagger-1">
            <span className="lp-badge-dot" />
            Software especializado para clínicas y centros estéticos
          </div>

          <h1 className="lp-hero-h1 reveal stagger-2">
            Tu clínica, organizada.<br />
            <span className="lp-gradient-text">Sin fricción. Sin papel.</span>
          </h1>

          <p className="lp-hero-sub reveal stagger-3">
            Novagendas centraliza la agenda, los pacientes, los pagos y el inventario
            de tu centro estético o clínica en una sola plataforma diseñada para el sector salud.
          </p>

          <div className="lp-hero-ctas reveal stagger-4">
            <a href="#contacto" className="lp-btn-primary">
              Solicitar demostración
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a href="#funciones" className="lp-btn-ghost">Ver funcionalidades</a>
          </div>

          {/* Mini-UI mockup */}
          <div className="lp-mockup reveal stagger-5">
            <div className="lp-mockup-bar">
              <span /><span /><span />
              <div className="lp-mockup-url">novagendas.com · agenda</div>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-sidebar">
                {['📊','📅','👥','💰','📦'].map((icon, i) => (
                  <div key={i} className={`lp-mockup-nav-item ${i === 1 ? 'active' : ''}`}>{icon}</div>
                ))}
              </div>
              <div className="lp-mockup-content">
                <div className="lp-mockup-header-bar">
                  <div className="lp-mockup-title-block">
                    <div className="lp-mockup-line w-40" />
                    <div className="lp-mockup-line w-60 thin" />
                  </div>
                  <div className="lp-mockup-new-btn">+ Nueva cita</div>
                </div>
                <div className="lp-mockup-calendar">
                  {[...Array(5)].map((_, col) => (
                    <div key={col} className="lp-mockup-col">
                      <div className="lp-mockup-col-header" />
                      {col === 1 && <div className="lp-mockup-appt accent">09:00 · Botox</div>}
                      {col === 2 && <div className="lp-mockup-appt green">10:30 · Relleno</div>}
                      {col === 0 && <div className="lp-mockup-appt purple">11:00 · Valoración</div>}
                      {col === 3 && <div className="lp-mockup-appt orange">14:00 · Láser</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="lp-stats">
        <div className="lp-stats-inner">
          {[
            { value: 500, suffix: '+', label: 'Citas gestionadas' },
            { value: 12,  suffix: '',  label: 'Clínicas activas' },
            { value: 98,  suffix: '%', label: 'Tasa de satisfacción' },
            { value: 3,   suffix: 'x', label: 'Menos tiempo administrativo' },
          ].map((s, i) => (
            <div key={i} className="lp-stat-item reveal" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="lp-stat-value"><Counter target={s.value} suffix={s.suffix} /></div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Problema ─── */}
      <section id="problema" className="lp-section lp-section--alt">
        <div className="lp-section-inner">
          <div className="lp-section-tag reveal">El problema</div>
          <h2 className="lp-section-h2 reveal stagger-1">
            Gestionar una clínica sin las herramientas correctas
            <span className="lp-gradient-text"> cuesta tiempo y pacientes</span>
          </h2>
          <p className="lp-section-sub reveal stagger-2">
            Los centros estéticos y clínicas de salud enfrentan a diario una realidad caótica
            que frena su crecimiento y afecta la experiencia del paciente.
          </p>

          <div className="lp-problems-grid">
            {[
              { icon: '📋', title: 'Agendas en papel o WhatsApp', desc: 'Doble reservas, olvidos y horas perdidas coordinando manualmente cada cita.' },
              { icon: '🗂️', title: 'Historias clínicas dispersas', desc: 'Fichas en hojas sueltas, fotos en el celular, notas sin estructura ni seguridad.' },
              { icon: '💸', title: 'Pagos sin trazabilidad', desc: 'No sabes cuánto ingresó hoy, quién debe, qué servicios son más rentables.' },
              { icon: '📦', title: 'Inventario a ciegas', desc: 'Te quedas sin insumos el día más ocupado porque no hay control de stock.' },
              { icon: '👤', title: 'Sin control de especialistas', desc: 'Cada profesional trabaja de forma aislada, sin visibilidad para el administrador.' },
              { icon: '🔒', title: 'Datos del paciente en riesgo', desc: 'Información sensible guardada en lugares inseguros o sin acceso controlado.' },
            ].map((p, i) => (
              <div key={i} className="lp-problem-card reveal" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="lp-problem-icon">{p.icon}</div>
                <div>
                  <div className="lp-problem-title">{p.title}</div>
                  <div className="lp-problem-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Transición ─── */}
      <div className="lp-bridge reveal">
        <div className="lp-bridge-inner">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          <p>Hay una mejor forma de gestionar tu clínica</p>
        </div>
      </div>

      {/* ─── Solución ─── */}
      <section id="solucion" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-tag lp-section-tag--green reveal">La solución</div>
          <h2 className="lp-section-h2 reveal stagger-1">
            Una plataforma diseñada
            <span className="lp-gradient-text"> específicamente para ti</span>
          </h2>
          <p className="lp-section-sub reveal stagger-2">
            Novagendas no es un software genérico adaptado. Fue construido desde cero
            para las necesidades reales de clínicas estéticas y centros de salud.
          </p>

          <div className="lp-solution-cards">
            {[
              {
                step: '01',
                title: 'Ingresa tu clínica',
                desc: 'Registra tu negocio, configura tus especialistas y define los servicios que ofreces en minutos.',
                color: 'var(--primary)',
              },
              {
                step: '02',
                title: 'Gestiona desde un solo lugar',
                desc: 'Agenda, historial de pacientes, inventario, pagos y estadísticas en un panel unificado y accesible desde cualquier dispositivo.',
                color: '#7c3aed',
              },
              {
                step: '03',
                title: 'Haz crecer tu negocio',
                desc: 'Toma decisiones basadas en datos reales: qué servicios generan más, qué especialistas son más eficientes y cuáles son tus horarios pico.',
                color: '#16a34a',
              },
            ].map((s, i) => (
              <div key={i} className="lp-solution-card reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="lp-solution-step" style={{ background: `${s.color}18`, color: s.color, borderColor: `${s.color}30` }}>{s.step}</div>
                <h3 className="lp-solution-title">{s.title}</h3>
                <p className="lp-solution-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Funciones ─── */}
      <section id="funciones" className="lp-section lp-section--alt">
        <div className="lp-section-inner">
          <div className="lp-section-tag reveal">Funcionalidades</div>
          <h2 className="lp-section-h2 reveal stagger-1">Todo lo que necesita tu clínica</h2>
          <p className="lp-section-sub reveal stagger-2">
            Módulos pensados para el flujo real de trabajo de un centro estético o de salud.
          </p>

          <div className="lp-features-grid">
            {[
              {
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                color: 'var(--primary)',
                title: 'Agenda inteligente',
                desc: 'Vistas día, semana y mes con arrastrar y soltar. Múltiples especialistas, detección de conflictos y sincronización con Google Calendar.',
              },
              {
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                color: '#7c3aed',
                title: 'Gestión de pacientes',
                desc: 'Historial clínico, evolución por procedimiento, notas privadas y datos de contacto en un perfil centralizado y seguro.',
              },
              {
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                color: '#16a34a',
                title: 'Pagos y facturación',
                desc: 'Registra ingresos, aplica abonos, diferencia métodos de pago y genera reportes financieros por período.',
              },
              {
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>,
                color: '#ea580c',
                title: 'Control de inventario',
                desc: 'Seguimiento de productos e insumos, alertas de stock bajo y registro automático de lo consumido por sesión.',
              },
              {
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="5" height="9"/><rect x="9" y="7" width="5" height="14"/><rect x="15" y="3" width="5" height="18"/></svg>,
                color: '#0891b2',
                title: 'Estadísticas y reportes',
                desc: 'Visualiza ingresos, citas por especialista, servicios más rentables y tendencias de crecimiento mes a mes.',
              },
              {
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
                color: '#db2777',
                title: 'Gestión de equipo',
                desc: 'Roles diferenciados para admin, recepcionista y especialista. Cada usuario ve solo lo que le corresponde.',
              },
            ].map((f, i) => (
              <div key={i} className="lp-feature-card reveal" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="lp-feature-icon-box" style={{ background: `${f.color}12`, color: f.color, borderColor: `${f.color}20` }}>
                  {f.icon}
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Diferenciadores ─── */}
      <section className="lp-section lp-section--accent">
        <div className="lp-section-inner lp-diff-inner">
          <div className="lp-diff-text reveal">
            <div className="lp-section-tag lp-section-tag--white">Por qué elegirnos</div>
            <h2 className="lp-section-h2 lp-white">No es solo software.<br />Es tu socio operativo.</h2>
            <p className="lp-section-sub lp-white-sub">
              Novagendas se adapta a tu modelo de negocio, no al revés. Multi-sede, multi-usuario y
              pensado para crecer contigo.
            </p>
            <ul className="lp-diff-list">
              {[
                'Acceso desde cualquier dispositivo con navegador',
                'Multi-tenant: cada clínica tiene su propio subdominio',
                'Roles y permisos granulares por usuario',
                'Datos seguros con Supabase PostgreSQL',
                'Integración nativa con Google Calendar',
                'Días festivos y bloqueos de agenda configurables',
              ].map((item, i) => (
                <li key={i} className="lp-diff-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-diff-visual reveal stagger-2">
            <div className="lp-diff-card">
              <div className="lp-diff-card-header">
                <div className="lp-diff-avatar">NA</div>
                <div>
                  <div className="lp-diff-card-name">Clínica Soleil</div>
                  <div className="lp-diff-card-sub">soleil.novagendas.com</div>
                </div>
                <div className="lp-diff-card-badge">Activo</div>
              </div>
              <div className="lp-diff-stats">
                <div className="lp-diff-stat"><span className="lp-diff-stat-val">24</span><span>Citas hoy</span></div>
                <div className="lp-diff-stat"><span className="lp-diff-stat-val">8</span><span>Especialistas</span></div>
                <div className="lp-diff-stat"><span className="lp-diff-stat-val">312</span><span>Pacientes</span></div>
              </div>
              <div className="lp-diff-bar-section">
                <div className="lp-diff-bar-label"><span>Servicios más solicitados</span></div>
                {[['Botox', 78], ['Relleno', 63], ['Valoración', 45]].map(([name, pct]) => (
                  <div key={name} className="lp-diff-bar-row">
                    <span className="lp-diff-bar-name">{name}</span>
                    <div className="lp-diff-bar-track"><div className="lp-diff-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="lp-diff-bar-pct">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contacto / CTA ─── */}
      <section id="contacto" className="lp-section lp-cta-section">
        <div className="lp-cta-inner reveal">
          <div className="lp-section-tag reveal">Empieza hoy</div>
          <h2 className="lp-section-h2 reveal stagger-1">
            ¿Listo para transformar<br />
            <span className="lp-gradient-text">la gestión de tu clínica?</span>
          </h2>
          <p className="lp-section-sub reveal stagger-2">
            Agenda una demostración personalizada y descubre cómo Novagendas
            se adapta a tu flujo de trabajo en menos de una semana.
          </p>
          <div className="lp-contact-form-wrap reveal stagger-3">
            <form className="lp-contact-form" onSubmit={e => { e.preventDefault(); alert('¡Gracias! Te contactaremos pronto.'); }}>
              <div className="lp-contact-row">
                <input className="lp-input" type="text" placeholder="Nombre de tu clínica" required />
                <input className="lp-input" type="email" placeholder="Correo electrónico" required />
              </div>
              <input className="lp-input" type="tel" placeholder="WhatsApp o teléfono (opcional)" />
              <textarea className="lp-input lp-textarea" placeholder="Cuéntanos brevemente sobre tu negocio y qué necesitas mejorar" rows={3} />
              <button type="submit" className="lp-btn-primary lp-btn-full">
                Solicitar demostración gratuita
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo-mark lp-logo-mark--sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="lp-footer-brand-name">Novagendas</span>
          </div>
          <p className="lp-footer-tagline">El software de gestión que las clínicas estéticas necesitaban.</p>
          <div className="lp-footer-links">
            <a href="/terminos">Términos y Privacidad</a>
            <span>·</span>
            <a href="/condiciones">Condiciones de Servicio</a>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Novagendas. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
