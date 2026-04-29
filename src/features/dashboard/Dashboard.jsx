import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import { isCalendarConnected, connectCalendar, clearCalendarAuth } from '../../services/googleCalendar';
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
  const [calConnected, setCalConnected] = useState(() => isCalendarConnected());
  const [showGcalConnectModal, setShowGcalConnectModal] = useState(false);
  const [showGcalDisconnectModal, setShowGcalDisconnectModal] = useState(false);

  const handleCalSync = async () => {
    if (calConnected) {
      setShowGcalDisconnectModal(true);
      return;
    }
    setShowGcalConnectModal(true);
  };

  const confirmConnectGcal = async () => {
    setShowGcalConnectModal(false);
    try {
      await connectCalendar(supabase);
    } catch (err) {
      setCalConnected(false);
    }
  };

  const confirmDisconnectGcal = () => {
    clearCalendarAuth();
    setCalConnected(false);
    setShowGcalDisconnectModal(false);
  };

  const [data, setData] = useState({
    todayAppts: [],
    clientCount: 0,
    lowStock: [],
    revenue: 0,
    loading: true,
  });

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, [tenant]);

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
          <h1>Bienvenido, {user?.name?.split(' ')[0] || 'Administrador'}</h1>
          <p>Hoy tienes {data.todayAppts.length} citas programadas. Mantén el control de tu negocio.</p>
        </div>
        <div className="dashboard-banner-actions">
          <button
            className={`btn btn-outline btn-gcal-sync ${calConnected ? 'gcal-connected' : ''}`}
            onClick={handleCalSync}
            title={calConnected ? 'Google Calendar conectado — clic para desconectar' : 'Conectar Google Calendar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {calConnected ? 'Calendar conectado' : 'Sincronizar Google Calendar'}
            {calConnected && <span className="gcal-dot-connected" />}
          </button>
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="empty-state-title">No hay citas agendadas para hoy</p>
                <p className="empty-state-text">Usa el botón "Agendar Cita" para comenzar.</p>
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

      {/* Modal: Conectar Google Calendar */}
      {showGcalConnectModal && (
        <div className="appt-modal-overlay high-z" onClick={() => setShowGcalConnectModal(false)}>
          <div className="appt-modal animate-scale-in modal-gcal-connect" onClick={e => e.stopPropagation()}>
            <div className="conflict-modal-body">
              <div className="gcal-disconnect-icon">
                <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                  <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                  <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
                  <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                </svg>
              </div>
              <h3 className="conflict-modal-title">Conectar Google Calendar</h3>
              <p className="conflict-modal-text">
                Se recomienda iniciar sesión con <strong>la cuenta de Google del negocio</strong> para que las citas se sincronicen en ese calendario.
              </p>
              

              <div className="gcal-disconnect-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-modal-action"
                  onClick={() => setShowGcalConnectModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-modal-action-bold"
                  onClick={confirmConnectGcal}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Desconectar Google Calendar */}
      {showGcalDisconnectModal && (
        <div className="appt-modal-overlay high-z" onClick={() => setShowGcalDisconnectModal(false)}>
          <div className="appt-modal animate-scale-in modal-gcal-disconnect" onClick={e => e.stopPropagation()}>
            <div className="conflict-modal-body">
              <div className="gcal-disconnect-icon" style={{ color: 'var(--warning)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 6 8 1 12"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <h3 className="conflict-modal-title">¿Desconectar Google Calendar?</h3>
              <p className="conflict-modal-text">
                Las nuevas citas no se sincronizarán con tu calendario de Google, pero los eventos existentes permanecerán.
              </p>

              <div className="gcal-disconnect-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-modal-action"
                  onClick={() => setShowGcalDisconnectModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-modal-action-bold"
                  onClick={confirmDisconnectGcal}
                >
                  Sí, Desconectar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
