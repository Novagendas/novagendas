import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '../ThemeToggle';
import NotificationsPopover from '../NotificationsPopover';

/* ── Route label map ────────────────────────────────────── */
const ROUTE_META = {
  dashboard: { label: 'Dashboard', emoji: '📊' },
  agenda: { label: 'Agenda de Citas', emoji: '📅' },
  clients: { label: 'Pacientes', emoji: '👥' },
  services: { label: 'Catálogo de Servicios', emoji: '💉' },
  payments: { label: 'Registro de Pagos', emoji: '💳' },
  inventory: { label: 'Inventario', emoji: '📦' },
  users: { label: 'Gestión de Usuarios', emoji: '🔑' },
  audit: { label: 'Registro de Auditoría', emoji: '📜' },
};

export default function Layout({ children, user, tenant, currentRoute, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = ROUTE_META[currentRoute] || { label: currentRoute, emoji: '🏠' };
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Cerrar sidebar en navegación móvil
  const handleNavigate = (route) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)', zIndex: 998, animation: 'fadeIn 0.2s' }}
        />
      )}

      {/* Sidebar Wrapper */}
      <div
        className={`sidebar-wrapper ${mobileOpen ? 'open' : ''}`}
        style={{
          height: '100vh',
          zIndex: 999,
          transition: 'transform 0.3s var(--ease)',
          flexShrink: 0
        }}
      >
        <Sidebar user={user} tenant={tenant} currentRoute={currentRoute} onNavigate={handleNavigate} onLogout={onLogout} />
      </div>

      {/* Main Content Area */}
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header Bar */}
        <header className="glass" style={{
          height: 72, minHeight: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem',
          zIndex: 100,
          position: 'relative'
        }}>
          {/* Breadcrumb / Title Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Hamburger Button (Mobile Only) */}
            <button
              className="mobile-only-btn btn-icon btn-ghost"
              onClick={() => setMobileOpen(true)}
              style={{ display: 'none', minWidth: '44px', minHeight: '44px', marginRight: '-0.25rem', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>

            <div className="hide-on-mobile" style={{
              width: 44, height: 44,
              background: 'var(--primary-light)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.1)'
            }}>
              {meta.emoji}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.25rem' }}>
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

            <ThemeToggle style={{ position: 'relative' }} />

            {/* Notifications Popover */}
            <NotificationsPopover user={user} tenant={tenant} />

            <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 0.5rem' }} />

            {/* Profile Summary */}
            <div className="flex items-center gap-3" onClick={() => onNavigate('profile')} style={{ cursor: 'pointer', marginLeft: '0.25rem' }}>
              <div className="hide-on-mobile" style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, margin: 0, color: 'var(--text-4)', textTransform: 'uppercase' }}>{user?.role}</p>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                boxShadow: '0 4px 12px var(--primary-light)',
                flexShrink: 0
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
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', height: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
