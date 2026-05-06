import React, { useState, useEffect } from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import './LandingPage.css';

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('reveal-visible');
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const GCalIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const NAV_LINKS = [
  { id: 'funciones',     label: 'Funciones' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'sectores',      label: 'Sectores' },
  { id: 'contacto',      label: 'Contacto' },
];

const SECTORES = [
  { label: '🏥 Clínicas estéticas', highlight: true },
  { label: '🧖 Spas & bienestar' },
  { label: '🦷 Consultorios' },
  { label: '✂️ Barberías & salones' },
  { label: '🧠 Psicólogos' },
  { label: '💪 Centros deportivos' },
  { label: '🐾 Veterinarias' },
  { label: '+ Más' },
];

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    bg: '#ede9fe',
    title: 'Agenda drag & drop',
    desc: 'Vistas día, semana y mes. Arrastra citas para moverlas. Múltiples especialistas y detección automática de conflictos de horario.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    bg: '#dbeafe',
    title: 'Gestión de clientes',
    desc: 'Historial completo por cliente, evolución por sesión, notas privadas y datos de contacto centralizados.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    bg: '#dcfce7',
    title: 'Pagos y facturación',
    desc: 'Registra ingresos, aplica abonos, diferencia métodos de pago y genera reportes financieros por período.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      </svg>
    ),
    bg: '#ffedd5',
    title: 'Control de inventario',
    desc: 'Seguimiento de productos e insumos. Alertas de stock bajo. Registro automático de lo consumido por sesión.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="5" height="9"/>
        <rect x="9" y="7" width="5" height="14"/>
        <rect x="15" y="3" width="5" height="18"/>
      </svg>
    ),
    bg: '#f0fdf4',
    title: 'Estadísticas y reportes',
    desc: 'Ingresos, citas por especialista, servicios más rentables y tendencias mes a mes en tiempo real.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    bg: '#fce7f3',
    title: 'Roles y permisos',
    desc: 'Admin, recepcionista y especialista. Cada usuario ve solo lo que le corresponde, con trazabilidad completa.',
  },
];

const DIFF_ITEMS = [
  'Acceso desde cualquier dispositivo con navegador',
  'Multi-tenant: cada negocio en su propio subdominio',
  'Sincronización nativa con Google Calendar',
  'Días festivos y bloqueos de agenda configurables',
  'Registro de auditoría de cada acción del equipo',
];

const DEMO_STATS = [
  { val: '24', label: 'Citas hoy' },
  { val: '8',  label: 'Especialistas' },
  { val: '312', label: 'Clientes' },
];

const DEMO_BARS = [
  ['Servicio A', 78],
  ['Servicio B', 63],
  ['Servicio C', 45],
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useReveal();

  return (
    <div className="lp">

      {/* ─── Nav ─── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <img src="/logoclaro.jpeg" alt="Novagendas" className="lp-logo-img" />
          <span className="lp-brand-name">Novagendas</span>
        </div>

        <div className="lp-nav-links">
          {NAV_LINKS.map(({ id, label }) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </div>

        <div className="lp-nav-actions">
          <ThemeToggle />
          <a href="#contacto" className="lp-nav-cta">Solicitar demo →</a>
          <button
            className="lp-mobile-btn"
            onClick={() => setIsMenuOpen(o => !o)}
            aria-label="Menú"
          >
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
          {NAV_LINKS.map(({ id, label }) => (
            <a key={id} href={`#${id}`} onClick={() => setIsMenuOpen(false)} className="lp-mobile-link">
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ─── Hero ─── */}
      <div className="lp-hero-wrap">
        <div className="lp-hero">

          {/* Left */}
          <div className="lp-hero-left">
            <div className="lp-pill-row reveal stagger-1">
              <span className="lp-pill lp-pill--primary">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Software de agendamiento
              </span>
              <span className="lp-pill lp-pill--green">✓ Sincroniza con Google Calendar</span>
              <span className="lp-pill">Multi-usuario</span>
            </div>

            <h1 className="lp-hero-h1 reveal stagger-2">
              Agenda tu negocio.<br />
              <span className="lp-gradient-text">Sin caos. Sin papel.</span>
            </h1>

            <p className="lp-hero-sub reveal stagger-3">
              Novagendas centraliza citas, clientes, pagos e inventario en una sola plataforma.
              Para clínicas, spas, consultorios y cualquier negocio que trabaje con citas.
            </p>

            <div className="lp-gcal-proof reveal stagger-4">
              <GCalIcon size={20} />
              <span>Integración nativa con Google Calendar</span>
              <span className="lp-gcal-proof-sync">
                <span className="lp-gcal-dot" />
                Sincronización en tiempo real
              </span>
            </div>

            <div className="lp-hero-ctas reveal stagger-5">
              <a href="#contacto" className="lp-btn-primary">
                Solicitar demostración <ArrowRight />
              </a>
              <a href="#funciones" className="lp-btn-ghost">Ver funcionalidades</a>
            </div>
          </div>

          {/* Right — Bento */}
          <div className="lp-bento reveal stagger-2">

            <div className="lp-bento-card lp-bento-card--purple">
              <span className="lp-bento-label">Citas hoy</span>
              <div className="lp-bento-num">24</div>
              <span className="lp-bento-sub lp-bento-sub--green">↑ 3 vs ayer</span>
            </div>

            <div className="lp-bento-card lp-bento-card--dark">
              <div className="lp-gcal-sync">
                <div className="lp-gcal-sync-dot" />
                <span className="lp-gcal-sync-text">Google Calendar activo</span>
              </div>
              <span className="lp-gcal-sync-sub">Último sync hace 2 min · 8 eventos</span>
              <div className="lp-gcal-sync-tag">
                <GCalIcon size={11} />
                novagendas ↔ tu calendario
              </div>
            </div>

            <div className="lp-bento-card lp-bento-card--wide">
              <div className="lp-bento-week-header">
                <span className="lp-bento-label">Agenda esta semana</span>
                <span className="lp-bento-new-btn">+ Nueva cita</span>
              </div>
              <div className="lp-bento-week">
                <div className="lp-week-day">
                  <span className="lp-week-hd">LUN</span>
                  <div className="lp-week-ev lp-ev-blue">09:00 · Cita</div>
                  <div className="lp-week-ev lp-ev-purple">11:30</div>
                </div>
                <div className="lp-week-day">
                  <span className="lp-week-hd">MAR</span>
                  <div className="lp-week-ev lp-ev-green">10:00 · Cita</div>
                </div>
                <div className="lp-week-day">
                  <span className="lp-week-hd">MIÉ</span>
                  <div className="lp-week-ev lp-ev-new">09:00 · Nueva</div>
                  <div className="lp-week-ev lp-ev-orange">14:00</div>
                </div>
                <div className="lp-week-day">
                  <span className="lp-week-hd">JUE</span>
                  <div className="lp-week-ev lp-ev-pink">📅 GCal</div>
                  <div className="lp-week-ev lp-ev-blue">11:00</div>
                </div>
                <div className="lp-week-day">
                  <span className="lp-week-hd">VIE</span>
                  <div className="lp-week-ev lp-ev-green">09:30</div>
                  <div className="lp-week-ev lp-ev-purple">15:00</div>
                </div>
              </div>
            </div>

            <div className="lp-bento-card">
              <span className="lp-bento-label">Ingresos este mes</span>
              <div className="lp-bento-num" style={{ fontSize: '1.7rem' }}>$4.2M</div>
              <div className="lp-bar-group">
                <div className="lp-bar lp-bar-1" />
                <div className="lp-bar lp-bar-2" />
                <div className="lp-bar lp-bar-3" />
                <div className="lp-bar lp-bar-4" />
                <div className="lp-bar lp-bar-5" />
                <div className="lp-bar lp-bar-6" />
              </div>
            </div>

            <div className="lp-bento-card">
              <span className="lp-bento-label">Módulos activos</span>
              <div className="lp-fpills">
                <span className="lp-fpill lp-fpill-blue">📅 Agenda</span>
                <span className="lp-fpill lp-fpill-green">💰 Pagos</span>
                <span className="lp-fpill lp-fpill-purple">👥 Clientes</span>
                <span className="lp-fpill lp-fpill-orange">📦 Inventario</span>
                <span className="lp-fpill lp-fpill-blue">📊 Reportes</span>
                <span className="lp-fpill lp-fpill-green">👤 Equipo</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Sectores ─── */}
      <div id="sectores" className="lp-sectores">
        <div className="lp-sectores-inner">
          <div className="lp-sectores-label">Para cualquier negocio que trabaje con citas</div>
          <div className="lp-sectores-chips">
            {SECTORES.map(({ label, highlight }) => (
              <div key={label} className={`lp-sector-chip${highlight ? ' lp-sector-chip--highlight' : ''}`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Funcionalidades ─── */}
      <section id="funciones" className="lp-section lp-section--alt">
        <div className="lp-section-inner">
          <div className="lp-section-tag reveal">Funcionalidades</div>
          <h2 className="lp-section-h2 reveal stagger-1">
            Todo lo que tu negocio <span className="lp-gradient-text">realmente necesita</span>
          </h2>
          <p className="lp-section-sub reveal stagger-2">
            Cada módulo fue construido para el flujo real de un negocio con citas. Sin funciones de relleno.
          </p>

          <div className="lp-features-grid">

            {/* GCal — banner ancho */}
            <div className="lp-feat-card lp-feat-card--gcal reveal">
              <div className="lp-feat-gcal-content">
                <div className="lp-feat-icon" style={{ background: '#f0fdf4', marginBottom: '0.75rem' }}>📅</div>
                <div className="lp-feat-title" style={{ fontSize: '1.15rem' }}>
                  Sincronización con Google Calendar
                </div>
                <p className="lp-feat-desc" style={{ marginTop: '0.5rem' }}>
                  Todas las citas se sincronizan automáticamente con Google Calendar de tu negocio.
                  Tus clientes reciben invitaciones con recordatorios — tú ves todo desde un solo lugar, sin duplicar trabajo.
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
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-4)', marginBottom: 6 }}>
                  Vista sincronizada
                </div>
                <div className="lp-gcal-mini-week">
                  <div className="lp-week-day">
                    <span className="lp-week-hd">HOY</span>
                    <div className="lp-week-ev lp-ev-new">10:00 Cita</div>
                    <div className="lp-week-ev lp-ev-pink">📅 GCal</div>
                  </div>
                  <div className="lp-week-day">
                    <span className="lp-week-hd">MAÑ</span>
                    <div className="lp-week-ev lp-ev-green">09:30</div>
                    <div className="lp-week-ev lp-ev-blue">14:00</div>
                  </div>
                  <div className="lp-week-day">
                    <span className="lp-week-hd">JUE</span>
                    <div className="lp-week-ev lp-ev-purple">11:00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feat-card reveal" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="lp-feat-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="lp-feat-title">{f.title}</div>
                <p className="lp-feat-desc">{f.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ─── Diferenciadores ─── */}
      <section id="como-funciona" className="lp-diff">
        <div className="lp-diff-inner">
          <div className="lp-diff-text reveal">
            <div className="lp-diff-tag">Por qué elegirnos</div>
            <h2 className="lp-diff-h2">No es solo software.<br />Es tu socio operativo.</h2>
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

          <div className="lp-demo-card reveal stagger-2">
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
              <div className="lp-demo-bar-title">Servicios más solicitados</div>
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

      {/* ─── CTA / Contacto ─── */}
      <section id="contacto" className="lp-cta">
        <div className="lp-cta-inner">
          <div className="lp-section-tag reveal">Empieza hoy</div>
          <h2 className="lp-cta-h2 reveal stagger-1">
            ¿Listo para organizar<br />
            <span className="lp-gradient-text">tu negocio?</span>
          </h2>
          <p className="lp-cta-sub reveal stagger-2">
            Agenda una demostración personalizada y descubre cómo Novagendas
            se adapta a tu flujo de trabajo en menos de una semana.
          </p>
          <div className="lp-contact-form-wrap reveal stagger-3">
            <form
              className="lp-contact-form"
              onSubmit={e => { e.preventDefault(); alert('¡Gracias! Te contactaremos pronto.'); }}
            >
              <div className="lp-contact-row">
                <input className="lp-input" type="text" placeholder="Nombre de tu negocio" required />
                <input className="lp-input" type="email" placeholder="Correo electrónico" required />
              </div>
              <input className="lp-input" type="tel" placeholder="WhatsApp o teléfono (opcional)" />
              <textarea className="lp-input lp-textarea" placeholder="Cuéntanos sobre tu negocio y qué necesitas mejorar" rows={3} />
              <button type="submit" className="lp-btn-primary lp-btn-full">
                Solicitar demostración gratuita <ArrowRight />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/logoclaro.jpeg" alt="Novagendas" className="lp-footer-logo" />
            <span className="lp-footer-name">Novagendas</span>
            <span className="lp-footer-tagline">· El software de agendamiento para tu negocio</span>
          </div>
          <div className="lp-footer-links">
            <a href="/terminos">Términos y Privacidad</a>
            <a href="/condiciones">Condiciones de Servicio</a>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Novagendas. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
