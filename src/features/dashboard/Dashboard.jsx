import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';

/* ── Stat card ───────────────────────────────────────── */
const StatCard = ({ label, value, sub, color, icon, delay = 0 }) => (
  <div className="card-stat animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
    <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: `${color}0D`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -12, right: 24, width: 60, height: 60, borderRadius: '50%', background: `${color}08`, pointerEvents: 'none' }} />
    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: `0 0 0 7px ${color}07` }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
    </div>
    <h2 style={{ fontSize: '2.15rem', margin: '0 0 0.2rem', color, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1 }}>{value}</h2>
    <p style={{ fontWeight: 700, color: 'var(--text-2)', margin: '0 0 0.3rem', fontSize: '0.875rem' }}>{label}</p>
    <p style={{ fontSize: '0.76rem', color: 'var(--text-4)', margin: 0, fontWeight: 500, lineHeight: 1.45 }}>{sub}</p>
  </div>
);

const QuickBtn = ({ label, emoji, color, onClick }) => (
  <button
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'var(--font-main)', textAlign: 'left', width: '100%', transition: 'var(--transition)' }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}0A`; e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.transform = 'translateX(3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
  >
    <span style={{ fontSize: '1rem', width: 32, height: 32, background: `${color}15`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{emoji}</span>
    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-2)', flex: 1 }}>{label}</span>
    <svg style={{ color: 'var(--text-4)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
  </button>
);

export default function Dashboard({ user, tenant, onNavigate }) {
  const [data, setData] = useState({
    todayAppts: [],
    clientCount: 0,
    lowStock: [],
    revenue: 0,
    loading: true
  });

  const fetchData = async () => {
    if (!tenant?.id) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Total Clients
    const { count: cCount } = await supabase.from('cliente').select('*', { count: 'exact', head: true }).eq('idnegocios', tenant.id);
    
    // Low Stock
    // Fetch all products for the tenant and filter client-side to find those below minimum stock
    const { data: allProds } = await supabase.from('producto').select('*').eq('idnegocios', tenant.id);
    const lowStock = allProds?.filter(p => p.cantidad <= p.cantidadminima) || [];

    // Today Appointments
    const { data: appData } = await supabase
      .from('cita')
      .select(`*, estadocita(descripcion), cliente(nombre, cedula)`)
      .eq('idnegocios', tenant.id)
      .gte('fechahorainicio', `${todayStr}T00:00:00`)
      .lte('fechahorainicio', `${todayStr}T23:59:59`);
    
    // Revenue Today
    const { data: payData } = await supabase
      .from('pagos')
      .select('monto')
      .eq('idnegocios', tenant.id)
      .gte('fecha', `${todayStr}T00:00:00`);
    
    const revenue = payData?.reduce((s, p) => s + Number(p.monto), 0) || 0;

    setData({
      todayAppts: appData || [],
      clientCount: cCount || 0,
      lowStock: lowStock,
      revenue: revenue,
      loading: false
    });
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: 'Ingresos Hoy', value: fmt(data.revenue), sub: 'Dinero ingresado hoy', color: 'var(--success)', icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
    { label: 'Citas Hoy', value: data.todayAppts.length, sub: 'Programadas para hoy', color: 'var(--primary)', icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
    { label: 'Pacientes', value: data.clientCount, sub: 'Fichados en el sistema', color: 'var(--accent)', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
    { label: 'Alertas Inventario', value: data.lowStock.length, sub: data.lowStock.length > 0 ? 'Reponer pronto' : 'Stock óptimo', color: data.lowStock.length > 0 ? 'var(--danger)' : 'var(--success)', icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(130deg, var(--primary) 0%, #6366f1 55%, var(--accent) 100%)', borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px var(--primary-glow)', position: 'relative', overflow: 'hidden' }}>
        <div className="animate-blob" style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ color: '#fff', margin: '0 0 0.35rem', fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.1 }}>
            ¡Hola, {user?.nombre?.split(' ')[0] || 'Admin'}! 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.78)', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
             {tenant?.name || 'Cargando...'} · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.32)' }} onClick={() => onNavigate('agenda')}>
          Agendar Cita
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.1rem' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 65} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.25rem' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Agenda de Hoy</h3>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onNavigate('agenda')}>Todo →</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 320 }}>
            {data.loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div> : data.todayAppts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr><th>Hora</th><th>Paciente</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {data.todayAppts.map(app => (
                    <tr key={app.idcita}>
                      <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{app.fechahorainicio.split('T')[1].substring(0,5)}</span></td>
                      <td>{app.cliente?.nombre || '—'}</td>
                      <td><span className="badge badge-success">{app.estadocita?.descripcion}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>No hay actividades registradas.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {data.lowStock.length > 0 && (
            <div style={{ background: 'var(--danger-light)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <h4 style={{ color: 'var(--danger)', margin: '0 0 0.5rem' }}>⚠️ Stock Bajo</h4>
              {data.lowStock.slice(0,3).map(i => <p key={i.idproducto} style={{ fontSize: '0.8rem', margin: '2px 0' }}>{i.nombre}: <strong>{i.cantidad}</strong></p>)}
            </div>
          )}

          <div className="card">
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Acceso Rápido</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <QuickBtn label="Nueva Cita" emoji="📅" color="var(--primary)" onClick={() => onNavigate('agenda')} />
              <QuickBtn label="Nuevo Paciente" emoji="👤" color="var(--secondary)" onClick={() => onNavigate('clients')} />
              <QuickBtn label="Cobrar" emoji="💳" color="var(--success)" onClick={() => onNavigate('payments')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
