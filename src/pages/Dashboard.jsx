import React from 'react';
import { useGlobalState } from '../context/GlobalState';

/* ── Stat card ───────────────────────────────────────── */
const StatCard = ({ label, value, sub, color, icon, delay = 0 }) => (
  <div className="card-stat animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
    {/* Decorative bubbles */}
    <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: `${color}0D`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -12, right: 24, width: 60, height: 60, borderRadius: '50%', background: `${color}08`, pointerEvents: 'none' }} />

    {/* Icon pill */}
    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: `0 0 0 7px ${color}07` }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
    </div>

    <h2 style={{ fontSize: '2.15rem', margin: '0 0 0.2rem', color, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1 }}>{value}</h2>
    <p style={{ fontWeight: 700, color: 'var(--text-2)', margin: '0 0 0.3rem', fontSize: '0.875rem' }}>{label}</p>
    <p style={{ fontSize: '0.76rem', color: 'var(--text-4)', margin: 0, fontWeight: 500, lineHeight: 1.45 }}>{sub}</p>
  </div>
);

/* ── Quick action row item ────────────────────────────── */
const QuickBtn = ({ label, emoji, color, onClick }) => (
  <button
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'var(--font-main)', textAlign: 'left', width: '100%', transition: 'var(--transition)' }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}0A`; e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.transform = 'translateX(3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
  >
    <span style={{ fontSize: '1rem', width: 32, height: 32, background: `${color}15`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{emoji}</span>
    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-2)', flex: 1 }}>{label}</span>
    <svg style={{ color: 'var(--text-4)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
  </button>
);

export default function Dashboard({ onNavigate }) {
  const { clients, inventory, appointments, services } = useGlobalState();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const lowStockItems     = inventory.filter(i => i.stock <= i.minStock);
  const todayRevenue      = todayAppointments.reduce((sum, app) => {
    const svc = services.find(s => s.id === app.serviceId);
    return sum + (svc ? svc.price : 0);
  }, 0);

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: 'Ingresos Estimados Hoy', value: fmt(todayRevenue), sub: 'Basado en citas agendadas', color: 'var(--success)', icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'Citas Programadas Hoy',  value: todayAppointments.length, sub: 'Para el día de hoy', color: 'var(--primary)', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
    { label: 'Total de Pacientes',     value: clients.length, sub: 'Fichados en el sistema', color: 'var(--accent)', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> },
    { label: 'Alertas de Inventario',  value: lowStockItems.length, sub: lowStockItems.length > 0 ? 'Requieren reabastecimiento' : 'Inventario óptimo', color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--success)', icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
  ];

  const statusBadge = (status) => {
    const map = { 'Confirmada': 'badge-success', 'En Espera': 'badge-warning', 'Cancelada': 'badge-danger', 'Pendiente': 'badge-neutral' };
    return map[status] || 'badge-neutral';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Welcome Banner ── */}
      <div style={{ background: 'linear-gradient(130deg, var(--primary) 0%, #6366f1 55%, var(--accent) 100%)', borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px var(--primary-glow)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div className="animate-blob" style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', left: '40%', top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '3px 12px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '0.6rem', backdropFilter: 'blur(8px)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Sistema Activo
          </div>
          <h2 style={{ color: '#fff', margin: '0 0 0.35rem', fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.1 }}>
            Bienvenida, <span style={{ color: 'rgba(255,255,255,0.9)' }}>Dra. Fabiola</span> 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.78)', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => onNavigate('agenda')}
          style={{ padding: '0.7rem 1.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.32)', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem', backdropFilter: 'blur(8px)', transition: 'var(--transition)', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agendar Cita
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.1rem' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 65} />)}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.25rem' }}>

        {/* Today's Appointments */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', animationDelay: '200ms' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Agenda del Día</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-4)', fontWeight: 500 }}>{todayAppointments.length} cita{todayAppointments.length !== 1 ? 's' : ''} programada{todayAppointments.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="btn btn-outline" style={{ padding: '0.42rem 0.9rem', fontSize: '0.8rem' }} onClick={() => onNavigate('agenda')}>
              Ver Agenda&nbsp;→
            </button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 320 }}>
            {todayAppointments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>{['Hora', 'Paciente', 'Servicio', 'Estado'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {todayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map(app => {
                    const client = clients.find(c => c.id === app.clientId);
                    const svc    = services.find(s => s.id === app.serviceId);
                    return (
                      <tr key={app.id}>
                        <td>
                          <span style={{ fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 9px', borderRadius: 6, fontSize: '0.79rem' }}>{app.time}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{client?.name || '—'}</div>
                          <div style={{ fontSize: '0.71rem', color: 'var(--text-4)', marginTop: 1, fontWeight: 500 }}>CC {client?.doc || ''}</div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: svc?.color || 'var(--primary)', flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-2)', fontWeight: 500, fontSize: '0.875rem' }}>{svc?.name || '—'}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${statusBadge(app.status)}`}>{app.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ border: 'none', padding: '3rem 1.5rem' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-3)' }}>No hay citas para hoy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Inventory Alert */}
          {lowStockItems.length > 0 ? (
            <div className="animate-fade-in" style={{ background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', animationDelay: '250ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <h4 style={{ margin: 0, color: 'var(--danger)', fontSize: '0.95rem' }}>¡Stock Crítico!</h4>
              </div>
              {lowStockItems.slice(0, 3).map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(220,38,38,0.10)', fontSize: '0.79rem' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>{i.name}</span>
                  <span style={{ flexShrink: 0, fontWeight: 800, color: 'var(--danger)' }}>×{i.stock}</span>
                </div>
              ))}
              <button className="btn btn-danger w-full" style={{ marginTop: '0.9rem', fontSize: '0.82rem' }} onClick={() => onNavigate('inventory')}>
                Revisar Almacén →
              </button>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ background: 'var(--success-light)', border: '1px solid rgba(5,150,105,0.22)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start', animationDelay: '250ms' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.2rem', color: 'var(--success)', fontSize: '0.95rem' }}>Inventario Óptimo</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--success)', opacity: 0.85 }}>Todos los insumos están en niveles adecuados.</p>
              </div>
            </div>
          )}

          {/* Quick Access */}
          <div className="card animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Acceso Rápido</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <QuickBtn label="Agendar Nueva Cita"    emoji="📅" color="var(--primary)"   onClick={() => onNavigate('agenda')} />
              <QuickBtn label="Registrar Paciente"    emoji="👤" color="var(--secondary)"  onClick={() => onNavigate('clients')} />
              <QuickBtn label="Registrar un Pago"     emoji="💳" color="var(--success)"    onClick={() => onNavigate('payments')} />
              <QuickBtn label="Ver Inventario"         emoji="📦" color="var(--warning)"    onClick={() => onNavigate('inventory')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
