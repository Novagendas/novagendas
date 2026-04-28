import React, { useState, useEffect } from 'react';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './LandingPage.css';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal-visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Calcular URLs de demo */
  const isLocal      = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
  const baseDomain   = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
  const protocol     = isLocal ? 'http:' : 'https:';
  const portPart     = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');
  const adminUrl     = `${protocol}//admin.${baseDomain}${portPart}`;
  const demoUrl      = `${protocol}//soleil.${baseDomain}${portPart}`;

  return (
    <div className="landing-page">
      <ParticleBackground />

      {/* ── Navbar ── */}
      <nav className="landing-nav animate-fade-down">
        <div className="landing-nav-brand reveal stagger-1">
          <div className="landing-brand-logo animate-float">
            <span>NA</span>
          </div>
          <span className="landing-brand-name">Novagendas</span>
        </div>

        <div className="landing-nav-links reveal stagger-2">
          <a href="#features" className="hover-lift">Soluciones</a>
          <a href="#pricing"  className="hover-lift">Planes</a>
          <a href="#about"    className="hover-lift">Nosotros</a>
        </div>

        <div className="landing-nav-actions reveal stagger-3">
          <ThemeToggle />
          <button className="landing-mobile-menu-btn" onClick={() => setIsMenuOpen(o => !o)}>☰</button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="landing-mobile-menu">
          <a href="#features" onClick={() => setIsMenuOpen(false)}>Soluciones</a>
          <a href="#pricing"  onClick={() => setIsMenuOpen(false)}>Planes</a>
          <a href="#about"    onClick={() => setIsMenuOpen(false)}>Nosotros</a>
        </div>
      )}

      {/* ── Hero ── */}
      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge reveal stagger-1">
            Lanzamiento v6.0 · Plataforma SaaS Premium
          </div>

          <h1 className="reveal stagger-2">
            Gestión inteligente para <br />
            <span className="landing-hero-accent">negocios de estética</span>
          </h1>

          <p className="landing-hero-sub reveal stagger-3">
            El ecosistema definitivo y profesional para médicos, terapeutas y clínicas.
            Controla tu agenda, pacientes, ingresos e inventario desde un portal unificado de máximo rendimiento.
          </p>

          <div className="landing-hero-ctas reveal stagger-4">
            <a href={adminUrl} className="btn btn-primary hover-lift landing-cta-btn">
              Panel Administrativo
            </a>
            <a href={demoUrl} className="btn btn-secondary hover-lift landing-cta-btn">
              Ver Tienda Demo
            </a>
          </div>

          {/* Trust indicators */}
          <div className="landing-trust reveal stagger-5">
            <p className="landing-trust-label">Plataforma segura y confiable</p>
            <div className="landing-trust-logos">
              <span className="animate-float">SUPABASE</span>
              <span className="animate-float delay-1s">PCI DSS</span>
              <span className="animate-float delay-2s">HIPAA READY</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Features ── */}
      <section id="features" className="landing-features-section">
        <div className="landing-section-inner">
          <h2 className="reveal">Soluciones Integrales</h2>
          <p className="landing-section-sub reveal stagger-1">
            Todo lo que necesitas para tu negocio en una sola plataforma.
          </p>
          <div className="landing-features-grid">
            {[
              { emoji: '📅', title: 'Gestión de Agendas',      desc: 'Organiza citas, recordatorios automáticos y sincronización en tiempo real para todos tus especialistas.', stagger: 'stagger-1' },
              { emoji: '👥', title: 'Base de Pacientes',       desc: 'Historial clínico, evolución, fotografías y notas confidenciales en un entorno seguro y encriptado.',   stagger: 'stagger-2' },
              { emoji: '📦', title: 'Control de Inventario',   desc: 'Seguimiento de productos, alertas de stock bajo y reportes de insumos utilizados por sesión.',          stagger: 'stagger-3' },
            ].map(f => (
              <div key={f.title} className={`card landing-feature-card reveal ${f.stagger} hover-lift`}>
                <div className="landing-feature-emoji">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="landing-pricing-section">
        <div className="landing-section-inner">
          <h2 className="reveal">Planes Flexibles</h2>
          <p className="landing-section-sub reveal stagger-1">
            Diseñados para escalar con tu clínica o consultorio.
          </p>
          <div className="landing-pricing-grid">
            <div className="card landing-pricing-card reveal stagger-1 hover-lift">
              <h3>Profesional</h3>
              <div className="landing-pricing-price">$29<span>/mes</span></div>
              <ul className="landing-pricing-list">
                <li>✓ 1 Especialista</li>
                <li>✓ Agenda ilimitada</li>
                <li>✓ Fichas clínicas básicas</li>
              </ul>
              <button className="btn btn-outline hover-lift btn-full">Comenzar</button>
            </div>

            <div className="card landing-pricing-card landing-pricing-card--featured reveal stagger-2 hover-lift">
              <div className="landing-pricing-badge">MÁS POPULAR</div>
              <h3>Clínica</h3>
              <div className="landing-pricing-price">100 euros<span>/mes</span></div>
              <ul className="landing-pricing-list">
                <li>✓ Hasta 10 Especialistas</li>
                <li>✓ Inventario y Finanzas</li>
                <li>✓ Multi-sucursal</li>
              </ul>
              <button className="btn btn-primary hover-lift btn-full">Comenzar</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="landing-about-section">
        <div className="landing-about-inner reveal">
          <h2>Sobre Nosotros</h2>
          <p>
            Novagendas nació con la misión de modernizar la gestión en el sector de la estética y la salud.
            Entendemos que el tiempo de los profesionales debe enfocarse en sus pacientes, no en tareas administrativas.
            Por eso construimos una herramienta robusta, segura y fácil de usar, impulsada por tecnología de punta.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <a href="/terminos">Términos y Privacidad</a>
          <span className="landing-footer-sep">·</span>
          <a href="/condiciones">Condiciones de Servicio</a>
        </div>
        <p>© {new Date().getFullYear()} Novagendas. Todos los derechos reservados.</p>
      </footer>
    </div>

  );
}
