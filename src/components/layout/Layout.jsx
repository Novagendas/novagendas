import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '../ThemeToggle';
import NotificationsPopover from '../NotificationsPopover';
import './Layout.css';

/* ── Route label map ─────────────────────────────────────── */
const ROUTE_META = {
  dashboard: { label: 'Vista General',        emoji: '📊' },
  agenda:    { label: 'Agenda de Citas',       emoji: '📅' },
  clients:   { label: 'Pacientes',             emoji: '👥' },
  services:  { label: 'Catálogo de Servicios', emoji: '💉' },
  payments:  { label: 'Registro de Pagos',     emoji: '💳' },
  inventory: { label: 'Inventario',            emoji: '📦' },
  users:     { label: 'Gestión de Usuarios',   emoji: '🔑' },
  audit:     { label: 'Registro de Auditoría', emoji: '📜' },
};

export default function Layout({ children, user, tenant, currentRoute, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta  = ROUTE_META[currentRoute] || { label: currentRoute, emoji: '🏠' };
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleNavigate = (route) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <div className="layout-root">

      {/* Mobile overlay */}
      <div
        className={`layout-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <div className={`layout-sidebar-wrapper${mobileOpen ? ' open' : ''}`}>
        <Sidebar
          user={user}
          tenant={tenant}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      </div>

      {/* Main content area */}
      <div className="layout-content animate-fade-in">

        {/* Top header */}
        <header className="layout-header glass">

          <div className="layout-header-left">
            {/* Hamburger (mobile only) */}
            <button
              className="layout-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Route icon */}
            <div className="layout-route-icon hide-on-mobile">
              {meta.emoji}
            </div>

            {/* Route info */}
            <div className="layout-route-info">
              <h2>{meta.label}</h2>
              <p>{today}</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="layout-header-right">
            <ThemeToggle />

            <NotificationsPopover user={user} tenant={tenant} />

            <div className="layout-user-section">
              <div
                className="layout-profile"
                onClick={() => onNavigate('profile')}
                role="button"
                tabIndex={0}
              >
                <div className="layout-avatar">
                  {(user?.name || 'U').substring(0, 1).toUpperCase()}
                </div>
                <div className="layout-profile-info hide-on-mobile">
                  <p className="layout-profile-name">{user?.name || 'Usuario'}</p>
                  <p className="layout-profile-role">{user?.role || 'Administrador'}</p>
                </div>
              </div>

              <button
                className="layout-logout-icon-btn"
                onClick={onLogout}
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`layout-main${
          currentRoute === 'agenda' || currentRoute === 'clients'
            ? ' layout-main--fill' : ''
        }`}>
          <div className={`layout-inner${
            currentRoute === 'agenda' || currentRoute === 'clients'
              ? ' layout-inner--fill' : ''
          }`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
