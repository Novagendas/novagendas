import React from 'react';
import './Sidebar.css';

/* ─── Icon paths ────────────────────────────────────────── */
const ICONS = {
  dashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  agenda:    <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  clients:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  services:  <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
  payments:  <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  inventory: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
  logs:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>,
};

const MAIN_NAV = [
  { id: 'dashboard', label: 'Vista General' },
  { id: 'agenda',    label: 'Agenda de Citas' },
  { id: 'clients',   label: 'Pacientes' },
];

const BUSINESS_NAV = [
  { id: 'services',  label: 'Servicios' },
  { id: 'payments',  label: 'Registro de Pagos' },
  { id: 'inventory', label: 'Inventario' },
];

const ADMIN_NAV = [
  { id: 'users', label: 'Gestión de Usuarios' },
  { id: 'logs',  label: 'Movimientos' },
];

/* ── Nav button ─────────────────────────────────────────── */
function NavBtn({ item, active, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={`nav-btn${active ? ' active' : ''}`}
    >
      <div className="nav-btn-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          {ICONS[item.id]}
        </svg>
      </div>
      <span className="nav-btn-label">{item.label}</span>
      <div className="nav-btn-indicator" />
    </button>
  );
}

/* ── Section label ──────────────────────────────────────── */
function SectionLabel({ label }) {
  return <p className="sidebar-section-label">{label}</p>;
}

/* ── Sidebar ────────────────────────────────────────────── */
export default function Sidebar({ user, tenant, currentRoute, onNavigate, onLogout }) {
  const uName     = user?.name || 'Administrador';
  const uRole     = user?.role || 'admin';
  const uInitials = uName.substring(0, 2).toUpperCase();

  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sidebar">

      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img
            src={isDark ? '/logodark.jpeg' : '/logoclaro.jpeg'}
            alt="Logo"
            className="sidebar-logo-img"
            onError={e => { e.target.classList.add('hidden-img'); e.target.parentElement.innerHTML = 'NA'; }}
          />
        </div>
        <div className="sidebar-brand-info">
          <h3 className="sidebar-brand-name">NovAgendas</h3>
          <p className="sidebar-tenant-name">{tenant?.name || 'Administración'}</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        <SectionLabel label="Principal" />
        {MAIN_NAV.map(item => {
          if (uRole === 'especialista' && item.id === 'dashboard') return null;
          return (
            <NavBtn
              key={item.id}
              item={item}
              active={currentRoute === item.id}
              onNavigate={onNavigate}
            />
          );
        })}

        {uRole !== 'especialista' && (
          <>
            <SectionLabel label="Negocio" />
            {BUSINESS_NAV.map(item => {
              if (uRole === 'recepcion' && item.id === 'payments') return null;
              return (
                <NavBtn
                  key={item.id}
                  item={item}
                  active={currentRoute === item.id}
                  onNavigate={onNavigate}
                />
              );
            })}
          </>
        )}

        {uRole === 'admin' && (
          <>
            <SectionLabel label="Administración" />
            {ADMIN_NAV.map(item => (
              <NavBtn
                key={item.id}
                item={item}
                active={currentRoute === item.id}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}
      </nav>

    </div>
  );
}
