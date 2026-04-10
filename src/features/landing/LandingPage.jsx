import React from 'react';

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-main)' }}>
      
      <div style={{ textAlign: 'center', maxWidth: 600, padding: '2rem' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: 24, margin: '0 auto 2rem',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 40px -10px var(--primary-glow)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem', letterSpacing: '-0.04em' }}>
          nova<span style={{ color: 'var(--primary)' }}>agendas</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          El ecosistema SaaS definitivo para médicos, terapeutas y clínicas. Gestiona tus citas, inventario y sucursales en un solo lugar.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {(() => {
            const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
            const baseDomain = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
            const protocol = isLocal ? 'http:' : 'https:';
            const portPart = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');
            
            return (
              <>
                <a href={`${protocol}//admin.${baseDomain}${portPart}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', fontSize: '1rem', borderRadius: '1rem' }}>
                   Portal de Administración
                </a>
                <a href={`${protocol}//soleil.${baseDomain}${portPart}`} className="btn btn-outline" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', fontSize: '1rem', borderRadius: '1rem' }}>
                   Ver Tienda Demo
                </a>
              </>
            );
          })()}
        </div>
      </div>
      
    </div>
  );
}
