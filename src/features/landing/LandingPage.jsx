import React, { useState, useEffect } from 'react';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-main)' }}>
      <ParticleBackground />
      
      {/* ── Modern Navbar ── */}
      <nav className="animate-fade-down" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 50, background: 'var(--bg)' }}>
        <div className="reveal stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <div className="animate-float" style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ color: '#fff', fontWeight: 800 }}>NA</span>
           </div>
           <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>NovaAgendas</span>
        </div>
        <div className="nav-links reveal stagger-2" style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-3)' }}>
          <a href="#features" className="hover-lift" style={{ textDecoration: 'none', color: 'inherit' }}>Soluciones</a>
          <a href="#pricing" className="hover-lift" style={{ textDecoration: 'none', color: 'inherit' }}>Planes</a>
          <a href="#about" className="hover-lift" style={{ textDecoration: 'none', color: 'inherit' }}>Nosotros</a>
        </div>
        <div className="nav-actions reveal stagger-3" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle style={{ position: 'relative' }} />
          <button className="btn btn-outline nav-contact-btn hover-lift" style={{ display: 'none' }}>Contáctanos</button>
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text)', display: 'none' }}>
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{ position: 'absolute', top: '70px', left: 0, right: 0, background: 'var(--bg)', borderBottom: '1px solid var(--border)', zIndex: 40, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <a href="#features" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-2)', fontWeight: 600 }}>Soluciones</a>
          <a href="#pricing" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-2)', fontWeight: 600 }}>Planes</a>
          <a href="#about" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-2)', fontWeight: 600 }}>Nosotros</a>
        </div>
      )}

      {/* ── Hero Section ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 800 }}>
          <div className="reveal stagger-1" style={{ display: 'inline-block', marginBottom: '1.5rem', padding: '0.25rem 1rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--border-focus)' }}>
            Lanzamiento v6.0 · Plataforma SaaS Premium
          </div>
          
          <h1 className="reveal stagger-2" style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1.5rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Gestión inteligente para <br />
            <span style={{ color: 'var(--primary)' }}>negocios de estética</span>
          </h1>
          
          <p className="reveal stagger-3" style={{ fontSize: '1.15rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: 640, margin: '0 auto 2.5rem' }}>
            El ecosistema definitivo y profesional para médicos, terapeutas y clínicas. Controla tu agenda, pacientes, ingresos e inventario desde un portal unificado de máximo rendimiento.
          </p>

          <div className="reveal stagger-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {(() => {
              const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
              const baseDomain = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
              const protocol = isLocal ? 'http:' : 'https:';
              const portPart = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');
              
              return (
                <>
                  <a href={`${protocol}//admin.${baseDomain}${portPart}`} className="btn btn-primary hover-lift" style={{ textDecoration: 'none', padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                     Panel Administrativo
                  </a>
                  <a href={`${protocol}//soleil.${baseDomain}${portPart}`} className="btn btn-secondary hover-lift" style={{ textDecoration: 'none', padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                     Ver Tienda Demo
                  </a>
                </>
              );
            })()}
          </div>
          
          {/* Subtle Trust Indicators */}
          <div className="reveal stagger-5" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plataforma segura y confiable</p>
             <div style={{ display: 'flex', gap: '2rem', opacity: 0.5, filter: 'grayscale(100%)' }}>
               <span className="animate-float" style={{ fontWeight: 800, fontSize: '1.2rem' }}>SUPABASE</span>
               <span className="animate-float" style={{ fontWeight: 800, fontSize: '1.2rem', animationDelay: '1s' }}>PCI DSS</span>
               <span className="animate-float" style={{ fontWeight: 800, fontSize: '1.2rem', animationDelay: '2s' }}>HIPAA READY</span>
             </div>
          </div>
        </div>
      </main>

      {/* ── Features Section ── */}
      <section id="features" style={{ padding: '5rem 2rem', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="reveal" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Soluciones Integrales</h2>
          <p className="reveal stagger-1" style={{ color: 'var(--text-3)', marginBottom: '3rem', fontSize: '1.1rem' }}>Todo lo que necesitas para tu negocio en una sola plataforma.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="card reveal stagger-1 hover-lift" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Gestión de Agendas</h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.95rem' }}>Organiza citas, recordatorios automáticos y sincronización en tiempo real para todos tus especialistas.</p>
            </div>
            <div className="card reveal stagger-2 hover-lift" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Base de Pacientes</h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.95rem' }}>Historial clínico, evolución, fotografías y notas confidenciales en un entorno seguro y encriptado.</p>
            </div>
            <div className="card reveal stagger-3 hover-lift" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Control de Inventario</h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.95rem' }}>Seguimiento de productos, alertas de stock bajo y reportes de insumos utilizados por sesión.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="reveal" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Planes Flexibles</h2>
          <p className="reveal stagger-1" style={{ color: 'var(--text-3)', marginBottom: '3rem', fontSize: '1.1rem' }}>Diseñados para escalar con tu clínica o consultorio.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '1rem 0' }}>
            <div className="card reveal stagger-1 hover-lift" style={{ padding: '3rem 2rem', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Profesional</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1rem 0' }}>$29<span style={{ fontSize: '1rem', color: 'var(--text-4)' }}>/mes</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', textAlign: 'left', color: 'var(--text-2)' }}>
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>✓ 1 Especialista</li>
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>✓ Agenda ilimitada</li>
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>✓ Fichas clínicas básicas</li>
              </ul>
              <button className="btn btn-outline hover-lift" style={{ width: '100%' }}>Comenzar</button>
            </div>
            <div className="card reveal stagger-2 hover-lift" style={{ padding: '3rem 2rem', border: '2px solid var(--primary)', transform: 'scale(1.05)' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>MÁS POPULAR</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Clínica</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1rem 0' }}>100 euros a falla<span style={{ fontSize: '1rem', color: 'var(--text-4)' }}>/mes</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', textAlign: 'left', color: 'var(--text-2)' }}>
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>✓ Hasta 10 Especialistas</li>
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>✓ Inventario y Finanzas</li>
                <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>✓ Multi-sucursal</li>
              </ul>
              <button className="btn btn-primary hover-lift" style={{ width: '100%' }}>Comenzar</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" style={{ padding: '5rem 2rem', background: 'var(--surface-2)', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Sobre Nosotros</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-3)', lineHeight: 1.8 }}>
            NovaAgendas nació con la misión de modernizar la gestión en el sector de la estética y la salud. 
            Entendemos que el tiempo de los profesionales debe enfocarse en sus pacientes, no en tareas administrativas. 
            Por eso construimos una herramienta robusta, segura y fácil de usar, impulsada por tecnología de punta.
          </p>
        </div>
      </section>
      
      {/* ── Footer ── */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-4)', fontSize: '0.9rem' }}>
        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="/terminos" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            Términos y Privacidad
          </a>
          <span style={{ color: 'var(--border)' }}>·</span>
          <a href="/condiciones" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
            Condiciones de Servicio
          </a>
        </div>
        © {new Date().getFullYear()} NovaAgendas. Todos los derechos reservados.
      </footer>
    </div>
  );
}
