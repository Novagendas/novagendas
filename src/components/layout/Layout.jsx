import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

/* ── Route label map ────────────────────────────────────── */
const ROUTE_META = {
  dashboard: { label: 'Dashboard',              emoji: '📊' },
  agenda:    { label: 'Agenda de Citas',         emoji: '📅' },
  clients:   { label: 'Pacientes',               emoji: '👥' },
  services:  { label: 'Catálogo de Servicios',   emoji: '💉' },
  payments:  { label: 'Registro de Pagos',       emoji: '💳' },
  inventory: { label: 'Inventario',              emoji: '📦' },
  users:     { label: 'Gestión de Usuarios',     emoji: '🔑' },
  audit:     { label: 'Registro de Auditoría',   emoji: '📜' },
};

export default function Layout({ children, user, tenant, currentRoute, onNavigate, onLogout }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('novagendas_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('novagendas_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const meta = ROUTE_META[currentRoute] || { label: currentRoute, emoji: '🏠' };
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar Navigation */}
      <Sidebar user={user} tenant={tenant} currentRoute={currentRoute} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header Bar */}
        <header className="glass" style={{
          height: 72, minHeight: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem',
          borderBottom: '1px solid var(--border)',
          zIndex: 100,
          position: 'relative'
        }}>
          {/* Breadcrumb / Title Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 42, height: 42,
              background: 'var(--primary-light)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem',
              boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.1)'
            }}>
              {meta.emoji}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {meta.label}
              </h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600, textTransform: 'capitalize' }}>
                {today}
              </p>
            </div>
          </div>

          {/* Right Action Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="btn-outline"
              title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
              style={{ width: 40, height: 40, padding: 0, borderRadius: 10, border: '1px solid var(--border)' }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Notifications Button */}
            <button 
              className="btn-outline"
              title="Notificaciones"
              style={{ width: 40, height: 40, padding: 0, borderRadius: 10, border: '1px solid var(--border)', position: 'relative' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--surface)' }} />
            </button>

            <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 0.5rem' }} />

            {/* Profile Summary */}
            <div className="flex items-center gap-3">
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, margin: 0, color: 'var(--text-4)', textTransform: 'uppercase' }}>{user?.role}</p>
              </div>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                boxShadow: '0 4px 12px var(--primary-light)'
              }}>
                {user?.name?.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '2rem',
          background: 'var(--bg)',
          position: 'relative'
        }}>
          {/* Subtle Background Decoration */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
            pointerEvents: 'none', opacity: 0.5, zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
