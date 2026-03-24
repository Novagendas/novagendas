import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

/* ── Route label map ────────────────────────────────────── */
const ROUTE_META = {
  dashboard: { label: 'Dashboard',              emoji: '📊' },
  agenda:    { label: 'Agenda de Citas',         emoji: '📅' },
  clients:   { label: 'Pacientes',               emoji: '👥' },
  services:  { label: 'Catálogo de Servicios',   emoji: '💊' },
  payments:  { label: 'Registro de Pagos',       emoji: '💳' },
  inventory: { label: 'Inventario',              emoji: '📦' },
  users:     { label: 'Gestión de Usuarios',     emoji: '🔑' },
};

export default function Layout({ children, user, currentRoute, onNavigate, onLogout }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('soleil_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soleil_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const meta = ROUTE_META[currentRoute] || { label: currentRoute, emoji: '🏠' };
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar user={user} currentRoute={currentRoute} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Area */}
      <div
        className="flex-col animate-fade-in"
        style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg)',
        }}
      >
        {/* Top Header Bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          {/* Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 38, height: 38,
              background: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              {meta.emoji}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize', lineHeight: 1.1 }}>{meta.label}</h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-4)', fontWeight: 500, textTransform: 'capitalize', marginTop: 2 }}>{today}</p>
            </div>
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Cambiar a Oscuro' : 'Cambiar a Claro'}
              style={{
                padding: '0.5rem',
                width: 38, height: 38,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)',
                fontSize: '1.05rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Notification stub */}
            <button
              title="Notificaciones"
              style={{
                padding: '0.5rem',
                width: 38, height: 38,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)',
                position: 'relative',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--danger)',
                border: '2px solid var(--surface)',
              }} />
            </button>

            {/* User avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'default',
              boxShadow: '0 2px 8px var(--primary-glow)',
            }}>
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
