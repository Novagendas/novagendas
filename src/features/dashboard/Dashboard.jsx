import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';

/* ── Stat card ───────────────────────────────────────── */
const StatCard = ({ label, value, sub, color, icon, delay = 0 }) => (
  <div className="card-stat animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
    {/* Decorative Bubbles */}
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}08`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -10, left: -10, width: 40, height: 40, borderRadius: '50%', background: `${color}05`, pointerEvents: 'none' }} />
    
    <div style={{ 
      width: 48, height: 48, borderRadius: '14px', 
      background: `${color}12`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      marginBottom: '1.25rem',
      color: color,
      boxShadow: `inset 0 0 0 1px ${color}15`
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--text)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </h2>
      <p style={{ fontWeight: 700, color: 'var(--text-2)', fontSize: '0.875rem', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-4)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{sub}</p>
    </div>
  </div>
);

/* ── Quick Action Button ──────────────────────────────── */
const QuickBtn = ({ label, emoji, color, onClick }) => (
  <button
    onClick={onClick}
    className="btn-outline"
    style={{ 
      display: 'flex', alignItems: 'center', gap: '0.85rem', 
      padding: '0.85rem 1rem', borderRadius: '14px', 
      background: 'var(--surface)', cursor: 'pointer', 
      border: '1px solid var(--border)',
      textAlign: 'left', width: '100%', transition: 'var(--transition)' 
    }}
    onMouseEnter={e => { 
      e.currentTarget.style.borderColor = color; 
      e.currentTarget.style.background = `${color}08`;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.borderColor = 'var(--border)'; 
      e.currentTarget.style.background = 'var(--surface)';
      e.currentTarget.style.transform = 'none';
    }}
  >
    <div style={{ 
      fontSize: '1.1rem', width: 36, height: 36, 
      background: `${color}12`, borderRadius: 10, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
    }}>
      {emoji}
    </div>
    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-2)', flex: 1 }}>{label}</span>
    <svg style={{ color: 'var(--text-4)', opacity: 0.5 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
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
    
    try {
      const { count: cCount } = await supabase.from('cliente').select('*', { count: 'exact', head: true }).eq('idnegocios', tenant.id);
      const { data: allProds } = await supabase.from('producto').select('*').eq('idnegocios', tenant.id);
      const lowStock = allProds?.filter(p => p.cantidad <= p.cantidadminima) || [];

      const { data: appData } = await supabase
        .from('cita')
        .select(`*, estadocita(descripcion), cliente(nombre, cedula)`)
        .eq('idnegocios', tenant.id)
        .gte('fechahorainicio', `${todayStr}T00:00:00`)
        .lte('fechahorainicio', `${todayStr}T23:59:59`);
      
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
    } catch (e) {
      console.error("Dashboard error:", e);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: 'Ingresos Hoy', value: fmt(data.revenue), sub: 'CIERRE DIARIO', color: 'var(--success)', icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
    { label: 'Citas Hoy', value: data.todayAppts.length, sub: 'PROGRAMACIÓN', color: 'var(--primary)', icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
    { label: 'Pacientes', value: data.clientCount, sub: 'BASE DE DATOS', color: 'var(--accent)', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
    { label: 'Inasistencias', value: '0', sub: 'CONTROL CLINICO', color: 'var(--secondary)', icon: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* 🟢 Greeting Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        boxShadow: '0 20px 40px -10px var(--primary-light)', 
        position: 'relative', overflow: 'hidden',
        color: '#fff'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>
            ¡Hola de nuevo, {user?.name?.split(' ')[0] || 'Admin'}! ✨
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1rem', fontWeight: 600 }}>
             Tienes {data.todayAppts.length} citas programadas para hoy. ¡Que sea un gran día!
          </p>
        </div>
        <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 800, padding: '0.85rem 1.5rem', borderRadius: '14px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} onClick={() => onNavigate('agenda')}>
          Ver Agenda Completa
        </button>
      </div>

      {/* 🟠 Grid de Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 100} />)}
      </div>

      {/* 🔵 Main Layout Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left: Agenda Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Pacientes para Hoy</h3>
            <span className="badge badge-primary">{data.todayAppts.length} Citas</span>
          </div>
          
          <div style={{ flex: 1, maxHeight: '450px', overflowY: 'auto' }}>
            {data.loading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                 <div className="spinner" style={{ margin: '0 auto 1rem', borderColor: 'var(--primary-light)', borderTopColor: 'var(--primary)', width: 32, height: 32 }} />
                 <p style={{ fontWeight: 600, color: 'var(--text-4)' }}>Sincronizando datos...</p>
              </div>
            ) : data.todayAppts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Hora</th>
                    <th>Paciente</th>
                    <th>Identificación</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayAppts.map(app => (
                    <tr key={app.idcita}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          {app.fechahorainicio.split('T')[1].substring(0,5)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{app.cliente?.nombre || '—'}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{app.cliente?.cedula || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${app.estadocita?.descripcion === 'Finalizado' ? 'badge-success' : 'badge-primary'}`}>
                          {app.estadocita?.descripcion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p style={{ fontWeight: 700, margin: 0 }}>No hay citas agendadas para hoy</p>
                <p style={{ fontSize: '0.85rem' }}>Usa el botón "Agendar Cita" para comenzar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar on Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Inventory Alert */}
          {data.lowStock.length > 0 && (
            <div className="animate-fade-up" style={{ background: 'var(--danger-light)', padding: '1.5rem', borderRadius: '20px', border: '1.5px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h4 style={{ color: 'var(--danger)', margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>ALERTAS DE STOCK</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {data.lowStock.slice(0,4).map(prod => (
                  <div key={prod.idproducto} className="flex justify-between items-center" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-2)' }}>{prod.nombre}</span>
                    <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>{prod.cantidad} disp.</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline w-full" style={{ marginTop: '1.25rem', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--danger)', fontHeight: 700 }} onClick={() => onNavigate('inventory')}>
                Gestionar Stock
              </button>
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>
              Acceso Rápido
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <QuickBtn label="Nueva Cita" emoji="📅" color="var(--primary)" onClick={() => onNavigate('agenda')} />
              <QuickBtn label="Registrar Paciente" emoji="👤" color="var(--secondary)" onClick={() => onNavigate('clients')} />
              <QuickBtn label="Gestionar Cobros" emoji="💳" color="var(--success)" onClick={() => onNavigate('payments')} />
              <QuickBtn label="Ver Inventario" emoji="📦" color="var(--accent)" onClick={() => onNavigate('inventory')} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
