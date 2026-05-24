import { useRef, useEffect } from 'react';
import { GCalIcon, ArrowRight } from './icons';
import { BENTO_WEEK, BAR_HEIGHTS } from './data';
import './HeroSection.css';

export default function HeroSection() {
  const bentoRef = useRef(null);

  useEffect(() => {
    let rafId;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (bentoRef.current) {
          const y = window.scrollY * 0.08;
          bentoRef.current.style.transform = `translateY(${y}px)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="lp-hero-wrap">
      <div className="lp-hero lp-container">

        {/* ── Left ── */}
        <div className="lp-hero-left">
          <div className="lp-pill-row lp-reveal lp-stagger-1">
            <span className="lp-pill lp-pill--primary">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Software de agendamiento
            </span>
            <span className="lp-pill lp-pill--green">✓ Google Calendar</span>
            <span className="lp-pill">Multi-usuario</span>
          </div>

          <h1 className="lp-hero-h1 lp-reveal lp-stagger-2">
            Agenda tu negocio.<br />
            <span className="lp-gradient-text">Sin caos. Sin papel.</span>
          </h1>

          <p className="lp-hero-sub lp-reveal lp-stagger-3">
            Novagendas centraliza citas, clientes, pagos e inventario en una sola plataforma.
            Para clínicas, spas, consultorios y cualquier negocio que trabaje con citas.
          </p>

          <div className="lp-gcal-badge lp-reveal lp-stagger-4">
            <GCalIcon size={20} />
            <span>Integración nativa con Google Calendar</span>
            <span className="lp-gcal-badge-sync">
              <span className="lp-pulse-dot" />
              Tiempo real
            </span>
          </div>

          <div className="lp-hero-ctas lp-reveal lp-stagger-5">
            <a href="#funciones" className="lp-btn-primary">
              Ver funcionalidades <ArrowRight />
            </a>
            <a href="#como-funciona" className="lp-btn-secondary">
              Cómo funciona
            </a>
          </div>
        </div>

        {/* ── Right — Bento ── */}
        <div className="lp-bento lp-reveal lp-stagger-2" ref={bentoRef}>

          <div className="lp-bento-card lp-bento-card--accent">
            <span className="lp-bento-label">Citas hoy</span>
            <div className="lp-bento-num">24</div>
            <span className="lp-bento-trend">↑ 3 vs ayer</span>
          </div>

          <div className="lp-bento-card lp-bento-card--dark">
            <div className="lp-gcal-sync-row">
              <span className="lp-pulse-dot" />
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
              {BENTO_WEEK.map(({ day, events }) => (
                <div key={day} className="lp-week-col">
                  <span className="lp-week-hd">{day}</span>
                  {events.map((ev, i) => (
                    <div key={i} className={`lp-week-ev ${ev.cls}`}>{ev.label}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="lp-bento-card">
            <span className="lp-bento-label">Ingresos este mes</span>
            <div className="lp-bento-num lp-bento-num--sm">$4.2M</div>
            <div className="lp-mini-bars">
              {BAR_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className={`lp-mini-bar${i === 3 ? ' lp-mini-bar--accent' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
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
    </section>
  );
}
