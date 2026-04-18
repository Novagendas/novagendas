import React from 'react';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-main)' }}>
      <ParticleBackground />
      
      {/* ── Modern Navbar ── */}
      <nav style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ color: '#fff', fontWeight: 800 }}>NA</span>
           </div>
           <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>NovaAgendas</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-3)' }}>
          <a href="#features" style={{ textDecoration: 'none', color: 'inherit' }}>Soluciones</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: 'inherit' }}>Planes</a>
          <a href="#about" style={{ textDecoration: 'none', color: 'inherit' }}>Nosotros</a>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle style={{ position: 'relative' }} />
          <button className="btn btn-outline" style={{ display: 'none', md: 'block' }}>Contáctanos</button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 800 }}>
          <div style={{ display: 'inline-block', marginBottom: '1.5rem', padding: '0.25rem 1rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--border-focus)' }}>
            Lanzamiento v6.0 · Plataforma SaaS Premium
          </div>
          
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 1.5rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Gestión inteligente para <br />
            <span style={{ color: 'var(--primary)' }}>negocios de estética</span>
          </h1>
          
          <p style={{ fontSize: '1.15rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: 640, margin: '0 auto 2.5rem' }}>
            El ecosistema definitivo y profesional para médicos, terapeutas y clínicas. Controla tu agenda, pacientes, ingresos e inventario desde un portal unificado de máximo rendimiento.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {(() => {
              const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
              const baseDomain = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
              const protocol = isLocal ? 'http:' : 'https:';
              const portPart = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');
              
              return (
                <>
                  <a href={`${protocol}//admin.${baseDomain}${portPart}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                     Panel Administrativo
                  </a>
                  <a href={`${protocol}//soleil.${baseDomain}${portPart}`} className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                     Ver Tienda Demo
                  </a>
                </>
              );
            })()}
          </div>
          
          {/* Subtle Trust Indicators */}
          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plataforma segura y confiable</p>
             <div style={{ display: 'flex', gap: '2rem', opacity: 0.5, filter: 'grayscale(100%)' }}>
               <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>SUPABASE</span>
               <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>PCI DSS</span>
               <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>HIPAA READY</span>
             </div>
          </div>
        </div>
      </main>

    </div>
  );
}
