import React from 'react';

/* ─── Icon paths ───────────────────────────────────────── */
const ICONS = {
  dashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  agenda: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  clients: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  services: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
  payments: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  inventory: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
  logs: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>,
};

const MAIN_NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'agenda', label: 'Agenda de Citas' },
  { id: 'clients', label: 'Pacientes' },
];

const BUSINESS_NAV = [
  { id: 'services', label: 'Servicios' },
  { id: 'payments', label: 'Registro de Pagos' },
  { id: 'inventory', label: 'Inventario' },
];

const ADMIN_NAV = [
  { id: 'users', label: 'Gestión de Usuarios' },
  { id: 'logs', label: 'Movimientos' },
];

export default function Sidebar({ user, tenant, currentRoute, onNavigate, onLogout }) {

  const NavBtn = ({ item, activeColor }) => {
    const active = currentRoute === item.id;
    return (
      <button
        onClick={() => onNavigate(item.id)}
        className={`nav-btn ${active ? 'active' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          width: '100%', padding: '0.7rem 0.85rem',
          borderRadius: 'var(--radius)',
          border: 'none',
          cursor: 'pointer', textAlign: 'left',
          background: active ? `${activeColor}15` : 'transparent',
          color: active ? activeColor : 'var(--text-3)',
          transition: 'var(--transition)',
          fontFamily: 'var(--font-main)',
          position: 'relative',
          fontWeight: active ? 700 : 500,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: active ? `${activeColor}15` : 'var(--surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'var(--transition)',
          color: active ? activeColor : 'var(--text-4)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{ICONS[item.id]}</svg>
        </div>
        <span style={{ flex: 1, fontSize: '0.9rem' }}>{item.label}</span>
        {active && <div style={{ width: 4, height: 16, background: activeColor, borderRadius: 4, position: 'absolute', left: 0 }} />}
      </button>
    );
  };

  const SectionLabel = ({ label }) => (
    <p style={{
      fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--text-4)',
      padding: '1.5rem 0.85rem 0.5rem'
    }}>
      {label}
    </p>
  );

  const uName = user?.name || 'Administrador';
  const uRole = user?.role || 'admin';
  const uInitials = uName.substring(0, 2).toUpperCase();

  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(() => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{
      width: 260, minWidth: 260, height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* ── Brand ── */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', boxShadow: '0 4px 12px var(--primary-light)'
          }}>
            <img
              src={isDark ? '/logodark.jpeg' : '/logoclaro.jpeg'}
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = 'NA'; }}
            />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              NovAgendas
            </h3>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tenant?.name || 'Administración'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
        <SectionLabel label="Principal" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {MAIN_NAV.map(item => {
            if (uRole === 'especialista' && item.id === 'dashboard') return null;
            return <NavBtn key={item.id} item={item} activeColor="var(--primary)" />
          })}
        </div>

        {uRole !== 'especialista' && (
          <>
            <SectionLabel label="Negocio" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {BUSINESS_NAV.map(item => {
                if (uRole === 'recepcion' && item.id === 'payments') return null;
                return <NavBtn key={item.id} item={item} activeColor="var(--secondary)" />
              })}
            </div>
          </>
        )}

        {uRole === 'admin' && (
          <>
            <SectionLabel label="Administración" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {ADMIN_NAV.map(item => <NavBtn key={item.id} item={item} activeColor="var(--accent)" />)}
            </div>
          </>
        )}
      </nav>

      {/* ── User profile card ── */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div style={{
          padding: '0.75rem', borderRadius: 'var(--radius)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '0.85rem'
          }}>
            {uInitials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uName}</p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase' }}>{uRole}</p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'var(--danger-light)', color: 'var(--danger)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
