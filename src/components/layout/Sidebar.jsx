import React from 'react';

/* ─── Icon paths ───────────────────────────────────────── */
const ICONS = {
  dashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  agenda:    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  clients:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  services:  <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
  payments:  <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  inventory: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>,
};

const MAIN_NAV = [
  { id: 'dashboard', label: 'Dashboard' },
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
];

export default function Sidebar({ user, currentRoute, onNavigate, onLogout }) {

  const NavBtn = ({ item, activeColor, activeBg, activeBorder }) => {
    const active = currentRoute === item.id;
    return (
      <button
        onClick={() => onNavigate(item.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.68rem',
          width: '100%', padding: '0.6rem 0.82rem',
          borderRadius: 'var(--radius)', border: `1px solid ${active ? activeBorder : 'transparent'}`,
          cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem',
          fontWeight: active ? 700 : 500,
          background: active ? activeBg : 'transparent',
          color: active ? activeColor : 'var(--text-3)',
          transition: 'var(--transition)', fontFamily: 'var(--font-main)',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
      >
        <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: active ? `${activeColor}18` : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', border: active ? `1px solid ${activeColor}25` : '1px solid transparent' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? activeColor : 'var(--text-4)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{ICONS[item.id]}</svg>
        </span>
        <span style={{ flex: 1, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
        {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeColor, flexShrink: 0, boxShadow: `0 0 6px ${activeColor}` }} />}
      </button>
    );
  };

  const SectionLabel = ({ label }) => (
    <p style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', paddingLeft: '0.82rem', margin: '0 0 0.45rem' }}>{label}</p>
  );

  const Sep = () => <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0.4rem 0.9rem' }} />;

  // Default fallback if user is somehow null
  const uName = user?.name || 'Administrador';
  const uEmail = user?.email || 'admin@soleil.com';
  const uInitials = uName.substring(0, 2).toUpperCase();
  const uRole = user?.role || 'admin';

  return (
    <div style={{
      width: 256, minWidth: 256, height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '1.1rem 0.75rem',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0.6rem 1.4rem', borderBottom: '1px solid var(--border)', marginBottom: '1.2rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 50%, var(--accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px var(--primary-glow)', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--text)' }}>nova<span style={{ color: 'var(--primary)' }}>agendas</span></h3>
          <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-4)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1px' }}>Centro Soleil</p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
        <SectionLabel label="Principal" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.14rem' }}>
          {MAIN_NAV.map(item => {
            // Especialista solo ve Agenda y Pacientes
            if (uRole === 'especialista' && item.id === 'dashboard') return null;
            return <NavBtn key={item.id} item={item} activeColor="var(--primary)" activeBg="var(--primary-light)" activeBorder="rgba(59,130,246,0.20)" />
          })}
        </div>

        {/* Hide business nav if especialista */}
        {uRole !== 'especialista' && (
          <>
            <Sep />
            <SectionLabel label="Negocio" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.14rem' }}>
              {BUSINESS_NAV.map(item => {
                // Recepción no ve Registro de Pagos
                if (uRole === 'recepcion' && item.id === 'payments') return null;
                return <NavBtn key={item.id} item={item} activeColor="var(--secondary)" activeBg="var(--secondary-light)" activeBorder="rgba(6,182,212,0.20)" />
              })}
            </div>
          </>
        )}

        {/* Hide admin panel if not admin */}
        {uRole === 'admin' && (
          <>
            <Sep />
            <SectionLabel label="Administración" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.14rem' }}>
              {ADMIN_NAV.map(item => <NavBtn key={item.id} item={item} activeColor="var(--accent)" activeBg="var(--accent-light)" activeBorder="rgba(139,92,246,0.20)" />)}
            </div>
          </>
        )}
      </nav>

      {/* ── User profile card ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.68rem', padding: '0.6rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: uRole === 'admin' ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.78rem', flexShrink: 0, letterSpacing: '0.01em' }}>
            {uInitials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uName}</p>
            <p style={{ margin: 0, color: 'var(--text-4)', fontSize: '0.67rem', fontWeight: 500 }}>{uRole.toUpperCase()}</p>
          </div>
          <span style={{ padding: '1px 6px', borderRadius: 5, background: 'var(--success-light)', color: 'var(--success)', fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0, border: '1px solid rgba(5,150,105,0.18)' }}>Live</span>
        </div>
        <button
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.845rem', fontWeight: 600, color: 'var(--danger)', transition: 'var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
