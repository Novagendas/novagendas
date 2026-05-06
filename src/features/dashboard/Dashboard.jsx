import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import './Dashboard.css';

/* ── Stat Card ──────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color, icon, delay = 0 }) => (
  <div
    className="card-stat animate-fade-up"
    style={{
      animationDelay: `${delay}ms`,
      '--accent-color': color
    }}
  >
    <div className="stat-card-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
    </div>

    <div className="stat-card-body">
      <h2>{value}</h2>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-sub">{sub}</p>
    </div>
  </div>
);

/* ── Quick Action Button ────────────────────────────────── */
const QuickBtn = ({ label, emoji, color, onClick }) => (
  <button
    onClick={onClick}
    className="quick-btn"
    style={{ '--btn-color': color }}
  >
    <div className="quick-btn-icon">
      {emoji}
    </div>
    <span className="quick-btn-label">{label}</span>
    <svg className="quick-btn-chevron" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
);

/* ── Dashboard ──────────────────────────────────────────── */
export default function Dashboard({ user, tenant, onNavigate }) {
  const [data, setData] = useState({
    todayAppts: [],
    clientCount: 0,
    lowStock: [],
    revenue: 0,
    loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startISO   = startOfDay.toISOString();
    const endISO     = endOfDay.toISOString();

    try {
      const { count: cCount } = await supabase
        .from('cliente').select('*', { count: 'exact', head: true }).eq('idnegocios', tenant.id);

      const { data: allProds } = await supabase
        .from('producto').select('*').eq('idnegocios', tenant.id);
      const lowStock = allProds?.filter(p => p.cantidad <= p.cantidadminima) || [];

      const { data: appData } = await supabase
        .from('cita')
        .select('*, estadocita(descripcion), cliente(nombre, cedula), usuario(nombre, apellido)')
        .eq('idnegocios', tenant.id)
        .gte('fechahorainicio', startISO)
        .lte('fechahorainicio', endISO);

      const { data: payData } = await supabase
        .from('pagos').select('monto').eq('idnegocios', tenant.id)
        .gte('fecha', startISO).lte('fecha', endISO);

      const revenue = payData?.reduce((s, p) => s + Number(p.monto), 0) || 0;

      setData({ todayAppts: appData || [], clientCount: cCount || 0, lowStock, revenue, loading: false });
    } catch (e) {
      console.error('Dashboard error:', e);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [tenant.id]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [tenant, fetchData]);

  const fmt = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: 'Ingresos Hoy',   value: fmt(data.revenue),        sub: 'CIERRE DIARIO',  color: 'var(--success)',   icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'Citas Hoy',      value: data.todayAppts.length,   sub: 'PROGRAMACIÓN',   color: 'var(--primary)',   icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
    { label: 'Pacientes',      value: data.clientCount,         sub: 'BASE DE DATOS',  color: 'var(--accent)',    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> },
    { label: 'Inasistencias',  value: '0',                      sub: 'CONTROL CLINICO',color: 'var(--secondary)', icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> },
  ];

  return (
    <div className="dashboard-root animate-fade-in">

      {/* Banner de bienvenida */}
      <div className="dashboard-banner">
        <div>
          <h1>Bienvenido, {user?.name?.split(' ')[0]?.trim() || 'Administrador'}</h1>
          <p>Hoy tienes {data.todayAppts.length} citas programadas. Mantén el control de tu negocio.</p>
        </div>
        <div className="dashboard-banner-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('agenda')}>
            Ver Agenda Diaria
          </button>
        </div>
      </div>

      {/* Grid de estadísticas */}
      <div className="dashboard-stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 100} />)}
      </div>

      {/* Layout principal: tabla + sidebar */}
      <div className="dashboard-main-layout">

        {/* Tabla de citas */}
        <div className="card dashboard-table-card">
          <div className="dashboard-table-header">
            <h3>Pacientes para Hoy</h3>
            <span className="badge badge-primary">{data.todayAppts.length} Citas</span>
          </div>

          <div className="dashboard-table-scroll">
            {data.loading ? (
              <div className="dashboard-table-skeleton">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="dashboard-skeleton-row" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="skeleton dashboard-skeleton-time" />
                    <div className="skeleton dashboard-skeleton-name" />
                    <div className="skeleton dashboard-skeleton-doc" />
                    <div className="skeleton dashboard-skeleton-badge" />
                  </div>
                ))}
              </div>
            ) : data.todayAppts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="dashboard-table-time-col">Hora</th>
                    <th>Paciente</th>
                    <th>Identificación</th>
                    <th className="dashboard-appt-status-cell">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayAppts.map(app => (
                    <tr key={app.idcita}>
                      <td><span className="dashboard-appt-time">{app.fechahorainicio.split('T')[1].substring(0, 5)}</span></td>
                      <td className="dashboard-appt-name">{app.cliente?.nombre || '—'}</td>
                      <td className="dashboard-appt-doc">{app.cliente?.cedula || 'N/A'}</td>
                      <td className="dashboard-appt-status-cell">
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
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="empty-state-title">No hay citas agendadas para hoy</p>
                <p className="empty-state-text">Usá el botón "Ver Agenda Diaria" para comenzar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="dashboard-right-col">

          {/* Alerta de inventario */}
          {data.lowStock.length > 0 && (
            <div className="inventory-alert animate-fade-up">
              <div className="inventory-alert-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="3">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h4>ALERTAS DE STOCK</h4>
              </div>
              <div className="inventory-alert-list">
                {data.lowStock.slice(0, 4).map(prod => (
                  <div key={prod.idproducto} className="inventory-alert-item">
                    <span className="inventory-alert-item-name">{prod.nombre}</span>
                    <span className="badge badge-danger inventory-badge-low">
                      {prod.cantidad} disp.
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-outline btn-full inventory-alert-manage-btn"
                onClick={() => onNavigate('inventory')}
              >
                Gestionar Stock
              </button>
            </div>
          )}

          {/* Acceso rápido */}
          <div className="card quick-actions-card">
            <h4 className="quick-actions-title">Acceso Rápido</h4>
            <div className="quick-actions-list">
              <QuickBtn label="Nueva Cita"          emoji="📅" color="var(--primary)"   onClick={() => onNavigate('agenda')} />
              <QuickBtn label="Registrar Paciente"  emoji="👤" color="var(--secondary)" onClick={() => onNavigate('clients')} />
              <QuickBtn label="Gestionar Cobros"    emoji="💳" color="var(--success)"   onClick={() => onNavigate('payments')} />
              <QuickBtn label="Ver Inventario"      emoji="📦" color="var(--accent)"    onClick={() => onNavigate('inventory')} />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
