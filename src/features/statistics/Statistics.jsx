import { useState } from 'react';
import { useStatistics } from './useStatistics';
import { BarChart, LineChart, HorizontalBars, DonutChart } from './StatisticsCharts';
import { exportToExcel } from '../../utils/exportToExcel';
import { insertLog } from '../../Supabase/supabaseClient';
import { fmt } from '../../utils/formatters';
import './Statistics.css';

const TABS = [
  { id: 'general',    label: 'General' },
  { id: 'citas',      label: 'Citas' },
  { id: 'pacientes',  label: 'Pacientes' },
  { id: 'servicios',  label: 'Servicios' },
  { id: 'pagos',      label: 'Pagos & Abonos' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'usuarios',   label: 'Usuarios' },
];

const SortIcon = ({ col, sortBy, sortDir }) => sortBy === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

const ICO = {
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  money:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  alert:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  check:    <><polyline points="20 6 9 17 4 12"/></>,
  trend:    <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  pkg:      <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  user1:    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
};

function KpiCard({ icon, label, value, sub, color = 'var(--primary)', delay = 0 }) {
  return (
    <div className="card card-stat payment-stat-card animate-fade-up"
      style={{ animationDelay: `${delay}ms`, '--stat-color': color, '--bubble-color-1': `${color}1A`, '--bubble-color-2': `${color}0D`, '--icon-bg': `${color}1A`, '--icon-shadow': `${color}0D` }}>
      <div className="stat-bubble-lg" /><div className="stat-bubble-sm" />
      <div className="stat-icon-wrapper">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function StatsLoader() {
  return (
    <div className="stats-loader">
      <div className="stats-loader-logo">
        <img src="/logoclaro.jpeg" alt="Nova" onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-weight:900;font-size:1rem">NA</span>'; }} />
      </div>
      <div className="stats-loader-bar-wrap"><div className="stats-loader-bar" /></div>
      <div className="stats-loader-dots">
        {[0, 1, 2].map(i => <div key={i} className="stats-loader-dot" />)}
      </div>
      <p className="stats-loader-label">Cargando estadísticas</p>
    </div>
  );
}

function EmptyState({ msg = 'Sin datos en este período' }) {
  return (
    <div className="stats-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>{msg}</p>
    </div>
  );
}

function ChartCard({ title, children, action }) {
  return (
    <div className="card stats-chart-card">
      <div className="stats-chart-header"><h4 className="stats-chart-title">{title}</h4>{action}</div>
      {children}
    </div>
  );
}

// ─── GENERAL ──────────────────────────────────────────────────────────────────
function GeneralSection({ data, loading }) {
  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, incomeByMonth = [], citasByWeek = [], statusDistribution = [] } = data;
  if (!kpis) return <EmptyState />;
  const varTag = (v) => <span className={`stats-var ${v >= 0 ? 'stats-var--up' : 'stats-var--down'}`}>{v >= 0 ? '+' : ''}{v}% vs mes anterior</span>;

  return (
    <div className="stats-fade-in">
      <div className="stats-kpi-grid">
        <KpiCard icon={ICO.calendar} label="Citas este mes" value={kpis.citasTotal} sub={varTag(kpis.citasVar)} color="#4F46E5" delay={0} />
        <KpiCard icon={ICO.money} label="Ingresos este mes" value={fmt(kpis.ingresosMes)} sub={varTag(kpis.ingresosVar)} color="#10B981" delay={65} />
        <KpiCard icon={ICO.users} label="Pacientes activos (90d)" value={kpis.activeClients} color="#0EA5E9" delay={130} />
        <KpiCard icon={ICO.alert} label="Tasa de cancelación" value={`${kpis.cancelRate}%`} color="#F59E0B" delay={195} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Ingresos por mes (últimos 6 meses)">
          {incomeByMonth.every(m => m.value === 0) ? <EmptyState msg="Sin ingresos registrados" /> : <BarChart data={incomeByMonth} color="#4F46E5" formatValue={v => fmt(v)} />}
        </ChartCard>
        <ChartCard title="Citas por semana (últimas 8 semanas)">
          {citasByWeek.every(w => w.value === 0) ? <EmptyState msg="Sin citas registradas" /> : <LineChart data={citasByWeek} color="#0EA5E9" />}
        </ChartCard>
      </div>
      <ChartCard title="Distribución de citas por estado (mes actual)">
        {!statusDistribution.length ? <EmptyState msg="Sin citas este mes" /> : <HorizontalBars data={statusDistribution} formatValue={v => `${v} citas`} />}
      </ChartCard>
    </div>
  );
}

// ─── CITAS ────────────────────────────────────────────────────────────────────
function CitasSection({ data, loading, dateRange, setDateRange, user, tenant }) {
  const doExport = () => {
    const rows = (data?.rawCitas || []).map(c => ({
      id: c.idcita,
      fecha: new Date(c.fechahorainicio).toLocaleDateString('es-CO'),
      horaInicio: new Date(c.fechahorainicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      horaFin: c.fechahorafin ? new Date(c.fechahorafin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
      paciente: c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido}` : '',
      especialista: c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : '',
      estado: c.estadocita?.descripcion || '',
      observacion: c.observacion || '',
    }));
    const cols = [
      { key: 'id', label: 'ID' }, { key: 'fecha', label: 'Fecha' },
      { key: 'horaInicio', label: 'Hora Inicio' }, { key: 'horaFin', label: 'Hora Fin' },
      { key: 'paciente', label: 'Paciente' }, { key: 'especialista', label: 'Especialista' },
      { key: 'estado', label: 'Estado' }, { key: 'observacion', label: 'Observación' },
    ];
    exportToExcel(rows, cols, 'citas');
    insertLog({ accion: 'EXPORT', entidad: 'Citas', descripcion: 'Exportación de citas a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, citasByDow = [], citasByHour = [], top5 = [] } = data;
  if (!kpis) return <EmptyState />;

  return (
    <div className="stats-fade-in">
      <div className="stats-filter-row">
        <label className="stats-label">Desde</label>
        <input type="date" className="stats-date-input" value={dateRange?.from || ''} onChange={e => setDateRange(dr => ({ ...dr, from: e.target.value }))} />
        <label className="stats-label">Hasta</label>
        <input type="date" className="stats-date-input" value={dateRange?.to || ''} onChange={e => setDateRange(dr => ({ ...dr, to: e.target.value }))} />
        <button className="btn btn-ghost btn-sm" onClick={() => setDateRange(null)}>Este mes</button>
        <button className="btn btn-outline btn-sm" onClick={doExport}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{ICO.download}</svg> Exportar</button>
      </div>
      <div className="stats-kpi-grid">
        <KpiCard icon={ICO.calendar} label="Total citas" value={kpis.total} color="#4F46E5" delay={0} />
        <KpiCard icon={ICO.check} label="Completadas" value={`${kpis.tasaCompletadas}%`} color="#10B981" delay={65} />
        <KpiCard icon={ICO.alert} label="Canceladas" value={`${kpis.tasaCanceladas}%`} color="#F44336" delay={130} />
        <KpiCard icon={ICO.trend} label="Promedio diario" value={kpis.promedioDiario} color="#0EA5E9" delay={195} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Citas por día de la semana">
          <HorizontalBars data={citasByDow} color="#4F46E5" formatValue={v => `${v} citas`} />
        </ChartCard>
        <ChartCard title="Citas por hora del día">
          <BarChart data={citasByHour} color="#0EA5E9" />
        </ChartCard>
      </div>
      <ChartCard title="Top 5 especialistas con más citas (período)">
        {!top5.length ? <EmptyState msg="Sin datos de especialistas" /> : (
          <div className="stats-top-table">
            {top5.map((s, i) => (
              <div key={i} className="stats-top-row">
                <span className="stats-top-rank">#{i + 1}</span>
                <span className="stats-top-name">{s.name}</span>
                <span className="stats-top-val">{s.count} citas</span>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

// ─── PACIENTES ────────────────────────────────────────────────────────────────
function PacientesSection({ data, loading, user, tenant }) {
  const doExport = () => {
    const rows = (data?.rawClientes || []).map(c => {
      const tp = (data?.topPacientes || []).find(t => t.idcliente === c.idcliente);
      return { id: c.idcliente, nombre: c.nombre, apellido: c.apellido, cedula: c.cedula, telefono: c.telefono, email: c.email, totalCitas: tp?.totalCitas || 0, ultimaCita: tp?.ultimaCita ? new Date(tp.ultimaCita).toLocaleDateString('es-CO') : '', fechaRegistro: c.fecharegistro ? new Date(c.fecharegistro).toLocaleDateString('es-CO') : '' };
    });
    exportToExcel(rows, [
      { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' },
      { key: 'cedula', label: 'Cédula' }, { key: 'telefono', label: 'Teléfono' }, { key: 'email', label: 'Email' },
      { key: 'totalCitas', label: 'Total Citas' }, { key: 'ultimaCita', label: 'Última Cita' }, { key: 'fechaRegistro', label: 'Fecha Registro' },
    ], 'pacientes');
    insertLog({ accion: 'EXPORT', entidad: 'Pacientes', descripcion: 'Exportación de pacientes a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, nuevosByMonth = [], topPacientes = [] } = data;
  if (!kpis) return <EmptyState />;

  return (
    <div className="stats-fade-in">
      <div className="stats-kpi-grid" style={{ marginBottom: '1rem' }}>
        <KpiCard icon={ICO.users} label="Total pacientes" value={kpis.totalPacientes} color="#4F46E5" delay={0} />
        <KpiCard icon={ICO.trend} label="Nuevos este mes" value={kpis.nuevosEsteMes} color="#10B981" delay={65} />
        <KpiCard icon={ICO.check} label="Activos (últimos 30d)" value={kpis.activosUltimos30} color="#0EA5E9" delay={130} />
        <KpiCard icon={ICO.alert} label="En riesgo (+60d sin cita)" value={kpis.enRiesgo} color="#F59E0B" delay={195} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Nuevos pacientes por mes (últimos 6 meses)">
          <BarChart data={nuevosByMonth} color="#4F46E5" />
        </ChartCard>
        <ChartCard title="Top 10 pacientes más frecuentes"
          action={<button className="btn btn-outline btn-sm" onClick={doExport}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{ICO.download}</svg> Exportar todos</button>}>
          {!topPacientes.length ? <EmptyState msg="Sin datos" /> : (
            <div className="stats-top-table">
              {topPacientes.map((p, i) => (
                <div key={i} className="stats-top-row">
                  <span className="stats-top-rank">#{i + 1}</span>
                  <span className="stats-top-name">{p.nombre} {p.apellido}</span>
                  <span className="stats-top-val">{p.totalCitas} citas</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── SERVICIOS ────────────────────────────────────────────────────────────────
function ServiciosSection({ data, loading, user, tenant }) {
  const [sortBy, setSortBy] = useState('citas');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const doExport = () => {
    exportToExcel(data?.rawServicios || [], [
      { key: 'idservicios', label: 'ID' }, { key: 'nombre', label: 'Nombre' },
      { key: 'precio', label: 'Precio' }, { key: 'duracion', label: 'Duración (min)' },
    ], 'servicios');
    insertLog({ accion: 'EXPORT', entidad: 'Servicios', descripcion: 'Exportación de servicios a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, ranking = [], topBarData = [] } = data;
  if (!kpis) return <EmptyState />;

  const getSafeVal = (obj, key) => {
    if (key === 'citas') return Number(obj.citas) || 0;
    if (key === 'ingresos') return Number(obj.ingresos) || 0;
    if (key === 'precio') return Number(obj.precio) || 0;
    return 0;
  };

  const sorted = [...ranking].sort((a, b) => {
    const m = sortDir === 'desc' ? -1 : 1;
    return m * (getSafeVal(a, sortBy) - getSafeVal(b, sortBy));
  });

  return (
    <div className="stats-fade-in">
      <div className="stats-kpi-grid stats-kpi-grid--3" style={{ marginBottom: '1rem' }}>
        <KpiCard icon={ICO.pkg} label="Servicios activos" value={kpis.activeServicesCount} color="#4F46E5" delay={0} />
        <KpiCard icon={ICO.trend} label="Más solicitado (mes)" value={kpis.topService} color="#10B981" delay={65} />
        <KpiCard icon={ICO.money} label="Ingresos generados (mes)" value={fmt(kpis.totalIngresos)} color="#0EA5E9" delay={130} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Top 8 servicios por citas (mes actual)">
          {!topBarData.length ? <EmptyState msg="Sin citas este mes" /> : <HorizontalBars data={topBarData} color="#4F46E5" />}
        </ChartCard>
        <ChartCard title="Ranking de servicios"
          action={<button className="btn btn-outline btn-sm" onClick={doExport}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{ICO.download}</svg> Exportar</button>}>
          <div className="stats-ranking-table">
            <div className="stats-ranking-header">
              <span>Servicio</span>
              <span className="stats-sort-btn" onClick={() => toggleSort('citas')}>Citas<SortIcon col="citas" sortBy={sortBy} sortDir={sortDir} /></span>
              <span className="stats-sort-btn" onClick={() => toggleSort('ingresos')}>Ingresos<SortIcon col="ingresos" sortBy={sortBy} sortDir={sortDir} /></span>
              <span className="stats-sort-btn" onClick={() => toggleSort('precio')}>Precio<SortIcon col="precio" sortBy={sortBy} sortDir={sortDir} /></span>
            </div>
            {sorted.map((s, i) => (
              <div key={i} className="stats-ranking-row">
                <span className="stats-ranking-name">{s.nombre}</span>
                <span>{s.citas}</span>
                <span>{fmt(s.ingresos)}</span>
                <span>{fmt(s.precio)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── PAGOS & ABONOS ────────────────────────────────────────────────────────────
function PagosSection({ data, loading, user, tenant }) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const doExportPagos = () => {
    const rows = (data?.rawPagos || []).map(p => ({
      id: p.idpagos, fecha: new Date(p.fecha).toLocaleDateString('es-CO'),
      paciente: p.cliente ? `${p.cliente.nombre} ${p.cliente.apellido}` : '',
      servicio: p.servicios?.nombre || '', metodo: p.metodopago?.tipo || '',
      monto: p.monto, estado: p.estado || '', observacion: p.observacion || '',
    }));
    exportToExcel(rows, [
      { key: 'id', label: 'ID' }, { key: 'fecha', label: 'Fecha' }, { key: 'paciente', label: 'Paciente' },
      { key: 'servicio', label: 'Servicio' }, { key: 'metodo', label: 'Método de Pago' },
      { key: 'monto', label: 'Monto' }, { key: 'estado', label: 'Estado' }, { key: 'observacion', label: 'Observación' },
    ], 'pagos');
    insertLog({ accion: 'EXPORT', entidad: 'Pagos', descripcion: 'Exportación de pagos a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  const doExportAbonos = () => {
    const rows = (data?.rawAbonos || []).map(a => ({
      id: a.idabono, fecha: a.fecha_abono ? new Date(a.fecha_abono).toLocaleDateString('es-CO') : '',
      paciente: a.cliente ? `${a.cliente.nombre} ${a.cliente.apellido}` : '',
      servicio: a.servicios?.nombre || '', metodo: a.metodopago?.tipo || '',
      monto: a.monto, saldo: a.saldo_disponible, observacion: a.observacion || '',
    }));
    exportToExcel(rows, [
      { key: 'id', label: 'ID' }, { key: 'fecha', label: 'Fecha' }, { key: 'paciente', label: 'Paciente' },
      { key: 'servicio', label: 'Servicio' }, { key: 'metodo', label: 'Método de Pago' },
      { key: 'monto', label: 'Monto' }, { key: 'saldo', label: 'Saldo Disponible' }, { key: 'observacion', label: 'Observación' },
    ], 'abonos');
    insertLog({ accion: 'EXPORT', entidad: 'Abonos', descripcion: 'Exportación de abonos a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, ingresosByMethod = [], ingresosDiarios = [], ultimosPagos = [] } = data;
  if (!kpis) return <EmptyState />;
  const paginated = ultimosPagos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(ultimosPagos.length / PAGE_SIZE);

  return (
    <div className="stats-fade-in">
      <div className="stats-kpi-grid" style={{ marginBottom: '1rem' }}>
        <KpiCard icon={ICO.money} label="Ingresos este mes" value={fmt(kpis.ingresosMes)} color="#10B981" delay={0} />
        <KpiCard icon={ICO.trend} label="Ingresos hoy" value={fmt(kpis.ingresosHoy)} color="#4F46E5" delay={65} />
        <KpiCard icon={ICO.calendar} label="Abonos con saldo" value={kpis.totalAbonos} color="#0EA5E9" delay={130} />
        <KpiCard icon={ICO.pkg} label="Monto en abonos" value={fmt(kpis.montoAbonos)} color="#F59E0B" delay={195} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Ingresos por método de pago (mes actual)">
          {!ingresosByMethod.length ? <EmptyState msg="Sin pagos este mes" /> : <HorizontalBars data={ingresosByMethod} color="#10B981" formatValue={v => fmt(v)} />}
        </ChartCard>
        <ChartCard title="Ingresos acumulados diarios (mes actual)">
          {ingresosDiarios.every(d => d.value === 0) ? <EmptyState msg="Sin ingresos este mes" /> : <LineChart data={ingresosDiarios} color="#10B981" />}
        </ChartCard>
      </div>
      <ChartCard title="Últimos pagos"
        action={<div className="stats-action-row"><button className="btn btn-outline btn-sm" onClick={doExportPagos}>Exportar Pagos</button><button className="btn btn-outline btn-sm" onClick={doExportAbonos}>Exportar Abonos</button></div>}>
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Paciente</th><th>Servicio</th><th>Método</th><th>Monto</th></tr></thead>
          <tbody>
            {paginated.map((p, i) => (
              <tr key={i}>
                <td>{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                <td>{p.cliente ? `${p.cliente.nombre} ${p.cliente.apellido}` : '—'}</td>
                <td>{p.servicios?.nombre || '—'}</td>
                <td>{p.metodopago?.tipo || '—'}</td>
                <td className="stats-monto">{fmt(p.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="stats-pagination">
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Anterior</button>
            <span>{page + 1} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Siguiente →</button>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

// ─── INVENTARIO ────────────────────────────────────────────────────────────────
function InventarioSection({ data, loading, user, tenant }) {
  const doExport = () => {
    const rows = (data?.rawProductos || []).map(p => ({
      id: p.idproducto, nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoriaproducto?.descripcion || '',
      cantidad: p.cantidad, cantidadMinima: p.cantidadminima, precio: p.precio,
      valorTotal: (p.cantidad || 0) * (p.precio || 0),
      estado: p.cantidad <= p.cantidadminima ? 'Crítico' : 'OK',
    }));
    exportToExcel(rows, [
      { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' },
      { key: 'categoria', label: 'Categoría' }, { key: 'cantidad', label: 'Cantidad Actual' },
      { key: 'cantidadMinima', label: 'Cantidad Mínima' }, { key: 'precio', label: 'Precio Unitario' },
      { key: 'valorTotal', label: 'Valor Total' }, { key: 'estado', label: 'Estado Stock' },
    ], 'inventario');
    insertLog({ accion: 'EXPORT', entidad: 'Inventario', descripcion: 'Exportación de inventario a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, criticos, stockRelativo } = data;

  return (
    <div className="stats-fade-in">
      <div className="stats-kpi-grid" style={{ marginBottom: '1rem' }}>
        <KpiCard icon={ICO.pkg} label="Total productos" value={kpis.totalProductos} color="#4F46E5" delay={0} />
        <KpiCard icon={ICO.alert} label="Stock crítico" value={kpis.enStockCritico} color="#F44336" delay={65} />
        <KpiCard icon={ICO.money} label="Valor del inventario" value={fmt(kpis.valorTotal)} color="#10B981" delay={130} />
        <KpiCard icon={ICO.trend} label="Sin movimiento (aprox)" value={kpis.sinMovimiento} color="#9E9E9E" delay={195} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Productos con menor stock relativo (top 10)"
          action={<button className="btn btn-outline btn-sm" onClick={doExport}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{ICO.download}</svg> Exportar</button>}>
          {!stockRelativo.length ? <EmptyState msg="Sin productos registrados" /> : (
            <HorizontalBars data={stockRelativo.map(p => ({ label: p.label, value: p.value, color: p.value <= p.cantidadminima ? '#F44336' : '#4F46E5' }))} formatValue={v => `${v} uds`} />
          )}
        </ChartCard>
        <ChartCard title="Productos en stock crítico">
          {!criticos.length ? (
            <div className="stats-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg><p>Todos los productos tienen stock suficiente</p></div>
          ) : (
            <div className="stats-top-table">
              {criticos.map((p, i) => (
                <div key={i} className={`stats-top-row ${p.cantidad === 0 ? 'stats-row--danger' : 'stats-row--warn'}`}>
                  <span className="stats-top-name">{p.nombre}</span>
                  <span className="stats-top-val">{p.cantidad} / {p.cantidadminima} mín</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── USUARIOS ──────────────────────────────────────────────────────────────────
function UsuariosSection({ data, loading, user, tenant }) {
  const ROLE_LABELS = { admin: 'Admin', especialista: 'Especialista', recepcion: 'Recepción' };

  const doExport = () => {
    exportToExcel(data?.usersTable || [], [
      { key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre Completo' }, { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rol' }, { key: 'citasAtendidas', label: 'Citas Atendidas (mes)' },
    ], 'usuarios');
    insertLog({ accion: 'EXPORT', entidad: 'Usuarios', descripcion: 'Exportación de usuarios a Excel', idUsuario: user?.idusuario || user?.id, idNegocios: tenant?.id });
  };

  if (loading) return <StatsLoader />;
  if (!data) return <EmptyState />;
  const { kpis, usersTable = [], roleDistribution = [] } = data;
  if (!kpis) return <EmptyState />;

  return (
    <div className="stats-fade-in">
      <div className="stats-kpi-grid stats-kpi-grid--4" style={{ marginBottom: '1rem' }}>
        <KpiCard icon={ICO.users} label="Usuarios activos" value={kpis.totalActivos} color="#4F46E5" delay={0} />
        <KpiCard icon={ICO.user1} label="Administradores" value={kpis.admins} color="#7C3AED" delay={65} />
        <KpiCard icon={ICO.check} label="Especialistas" value={kpis.especialistas} color="#0EA5E9" delay={130} />
        <KpiCard icon={ICO.calendar} label="Recepcionistas" value={kpis.recepcionistas} color="#10B981" delay={195} />
      </div>
      <div className="stats-charts-row">
        <ChartCard title="Distribución por rol">
          <DonutChart data={roleDistribution} subLabel="usuarios" />
        </ChartCard>
        <ChartCard title="Actividad del mes"
          action={<button className="btn btn-outline btn-sm" onClick={doExport}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{ICO.download}</svg> Exportar</button>}>
          <div className="stats-top-table">
            {usersTable.map((u, i) => (
              <div key={i} className="stats-top-row">
                <span className="stats-top-name">{u.name}</span>
                <span className="badge" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{ROLE_LABELS[u.role] || u.role}</span>
                <span className="stats-top-val">{u.citasAtendidas} citas</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
const TAB_SUBTITLES = new Map([
  ['general', 'Resumen ejecutivo del negocio'],
  ['citas', 'Análisis de citas y ocupación'],
  ['pacientes', 'Métricas de pacientes y retención'],
  ['servicios', 'Rendimiento de servicios'],
  ['pagos', 'Ingresos, pagos y abonos'],
  ['inventario', 'Control de stock e inventario'],
  ['usuarios', 'Actividad y distribución de usuarios'],
]);

export default function Statistics({ user, tenant }) {
  const [activeTab, setActiveTab] = useState('general');
  const [dateRange, setDateRange] = useState(null);
  const { data, loading } = useStatistics(tenant, activeTab, dateRange);

  return (
    <div className="statistics-container animate-fade-in">
      <div className="statistics-header">
        <div>
          <h2 className="statistics-title">Estadísticas</h2>
          <p className="statistics-subtitle">{TAB_SUBTITLES.get(activeTab)}</p>
        </div>
      </div>

      <div className="stats-tab-bar">
        {TABS.map(tab => (
          <button key={tab.id} type="button"
            className={`filter-btn${activeTab === tab.id ? ' filter-btn--active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setDateRange(null); }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="statistics-content">
        {activeTab === 'general'    && <GeneralSection    data={data} loading={loading} />}
        {activeTab === 'citas'      && <CitasSection      data={data} loading={loading} dateRange={dateRange} setDateRange={setDateRange} user={user} tenant={tenant} />}
        {activeTab === 'pacientes'  && <PacientesSection  data={data} loading={loading} user={user} tenant={tenant} />}
        {activeTab === 'servicios'  && <ServiciosSection  data={data} loading={loading} user={user} tenant={tenant} />}
        {activeTab === 'pagos'      && <PagosSection      data={data} loading={loading} user={user} tenant={tenant} />}
        {activeTab === 'inventario' && <InventarioSection data={data} loading={loading} user={user} tenant={tenant} />}
        {activeTab === 'usuarios'   && <UsuariosSection   data={data} loading={loading} user={user} tenant={tenant} />}
      </div>
    </div>
  );
}
