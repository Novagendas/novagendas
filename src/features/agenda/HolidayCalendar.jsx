import React, { useState, useEffect, useCallback } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

const TIPO_OPTIONS = [
  { value: 'feriado',       label: 'Día Feriado',         color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  { value: 'nodisponible',  label: 'No Disponible',       color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  { value: 'mantenimiento', label: 'Mantenimiento',       color: '#7c3aed', bg: '#ede9fe', border: '#a5b4fc' },
];

const tipoInfo = (tipo) => TIPO_OPTIONS.find(t => t.value === tipo) || TIPO_OPTIONS[0];

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const toDateStr = (d) => d.toISOString().slice(0, 10);
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function HolidayCalendar({ user, tenant, canManage = false }) {
  const [pivot, setPivot] = useState(new Date());
  const [bloqueados, setBloqueados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailDate, setDetailDate] = useState(null);
  const [citasAfectadas, setCitasAfectadas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  const [form, setForm] = useState({ tipo: 'feriado', motivo: '' });
  const [snack, setSnack] = useState(null);

  const showSnack = (msg, type = 'success') => {
    setSnack({ msg, type });
    setTimeout(() => setSnack(null), 3000);
  };

  const fetchBloqueados = useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('diasbloqueados')
      .select('*')
      .eq('idnegocios', tenant.id)
      .order('fecha');
    setBloqueados(data || []);
    setLoading(false);
  }, [tenant?.id]);

  useEffect(() => { fetchBloqueados(); }, [fetchBloqueados]);

  const blockedMap = bloqueados.reduce((acc, b) => { acc[b.fecha] = b; return acc; }, {});

  const fetchCitasAfectadas = async (fechaStr) => {
    setLoadingCitas(true);
    const dayStart = fechaStr + 'T00:00:00';
    const dayEnd = fechaStr + 'T23:59:59';
    const { data } = await supabase
      .from('cita')
      .select(`
        idcita, fechahorainicio,
        cliente (nombre, apellido, telefono, email),
        usuario (nombre, apellido),
        citaservicios ( servicios (nombre) )
      `)
      .eq('idnegocios', tenant.id)
      .gte('fechahorainicio', dayStart)
      .lte('fechahorainicio', dayEnd)
      .is('deleted_at', null);
    setCitasAfectadas(data || []);
    setLoadingCitas(false);
  };

  const handleDayClick = async (date) => {
    if (!date) return;
    const dateStr = toDateStr(date);
    const isBlocked = blockedMap[dateStr];
    if (isBlocked) {
      setDetailDate({ ...isBlocked, dateObj: date });
      await fetchCitasAfectadas(dateStr);
      setModalOpen('detail');
    } else if (canManage) {
      setSelectedDate(dateStr);
      setForm({ tipo: 'feriado', motivo: '' });
      setModalOpen('add');
    }
  };

  const handleBloquear = async (e) => {
    e.preventDefault();
    if (!selectedDate || !form.motivo.trim()) {
      showSnack('Ingresa un motivo', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('diasbloqueados').insert([{
      idnegocios: tenant.id,
      fecha: selectedDate,
      tipo: form.tipo,
      motivo: form.motivo.trim(),
      created_by: user?.idusuario || user?.id,
    }]);
    if (error) {
      showSnack('Error: ' + error.message, 'error');
    } else {
      await insertLog({
        accion: 'CREATE',
        entidad: 'DíaBloqueado',
        descripcion: `Día bloqueado: ${selectedDate} — ${form.motivo}`,
        idUsuario: user?.idusuario || user?.id,
        idNegocios: tenant.id,
      });
      showSnack(`Día ${selectedDate} bloqueado`);
      setModalOpen(false);
      fetchBloqueados();
    }
    setSaving(false);
  };

  const handleDesbloquear = async () => {
    if (!detailDate) return;
    setSaving(true);
    const { error } = await supabase.from('diasbloqueados')
      .delete()
      .eq('iddiasbloqueados', detailDate.iddiasbloqueados);
    if (error) {
      showSnack('Error: ' + error.message, 'error');
    } else {
      await insertLog({
        accion: 'DELETE',
        entidad: 'DíaBloqueado',
        descripcion: `Día desbloqueado: ${detailDate.fecha}`,
        idUsuario: user?.idusuario || user?.id,
        idNegocios: tenant.id,
      });
      showSnack(`Día ${detailDate.fecha} desbloqueado`, 'warning');
      setModalOpen(false);
      setDetailDate(null);
      fetchBloqueados();
    }
    setSaving(false);
  };

  const year = pivot.getFullYear();
  const month = pivot.getMonth();
  const cells = buildMonthGrid(year, month);
  const today = toDateStr(new Date());

  const prevMonth = () => setPivot(new Date(year, month - 1, 1));
  const nextMonth = () => setPivot(new Date(year, month + 1, 1));

  const upcomingBlocked = bloqueados
    .filter(b => b.fecha >= today)
    .slice(0, 8);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Días Bloqueados</h2>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-3)' }}>
          {canManage
            ? 'Bloquea fechas para que no se puedan agendar citas. Haz clic en un día del calendario.'
            : 'Consulta los días bloqueados. Solo puedes ver esta información.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Calendar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.35rem 0.7rem', cursor: 'pointer', color: 'var(--text-2)', fontSize: '1rem' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{MONTH_NAMES[month]} {year}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.35rem 0.7rem', cursor: 'pointer', color: 'var(--text-2)', fontSize: '1rem' }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-4)', padding: '0.2rem 0' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-4)' }}>
              <span className="spinner-mini" /> Cargando...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {cells.map((date, i) => {
                if (!date) return <div key={i} />;
                const dateStr = toDateStr(date);
                const isToday = dateStr === today;
                const blocked = blockedMap[dateStr];
                const isPast = dateStr < today;
                const info = blocked ? tipoInfo(blocked.tipo) : null;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(date)}
                    title={blocked ? `${info.label}: ${blocked.motivo}` : isPast ? 'Fecha pasada' : canManage ? 'Clic para bloquear' : ''}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      border: isToday ? '2px solid var(--primary)' : blocked ? `2px solid ${info.border}` : '1px solid var(--border)',
                      borderRadius: 8,
                      background: blocked ? info.bg : isPast ? 'var(--bg-2)' : 'var(--card-bg)',
                      color: blocked ? info.color : isPast ? 'var(--text-4)' : 'var(--text)',
                      cursor: isPast && !blocked ? 'default' : 'pointer',
                      fontWeight: isToday ? 800 : blocked ? 700 : 400,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 1,
                      opacity: isPast && !blocked ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {date.getDate()}
                    {blocked && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: info.color, marginTop: 1 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            {TIPO_OPTIONS.map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                <span style={{ color: 'var(--text-3)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: upcoming blocked days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-2)' }}>Próximos días bloqueados</h3>
          {upcomingBlocked.length === 0 ? (
            <div className="card" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.83rem' }}>
              Sin días bloqueados próximos
            </div>
          ) : upcomingBlocked.map(b => {
            const info = tipoInfo(b.tipo);
            const fecha = new Date(b.fecha + 'T12:00:00');
            return (
              <div
                key={b.iddiasbloqueados}
                className="card"
                style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${info.color}`, cursor: 'pointer' }}
                onClick={() => {
                  setDetailDate({ ...b, dateObj: fecha });
                  fetchCitasAfectadas(b.fecha);
                  setModalOpen('detail');
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: info.color }}>
                  {fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{b.motivo}</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, background: info.bg, color: info.color, padding: '1px 7px', borderRadius: 99, border: `1px solid ${info.border}`, marginTop: 4, display: 'inline-block' }}>
                  {info.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: agregar bloqueo */}
      {modalOpen === 'add' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="card animate-scale-in" style={{ width: 420, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Bloquear día</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '0.6rem 1rem', background: 'var(--primary-light)', borderRadius: 8, marginBottom: '1rem', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
              📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <form onSubmit={handleBloquear} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-3)' }}>Tipo de bloqueo</label>
                <select className="input-field" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-3)' }}>Motivo *</label>
                <input className="input-field" required placeholder="Ej: Festivo nacional, Cierre por mantenimiento…" value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                  {saving ? 'Bloqueando…' : 'Bloquear día'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: detalle del día bloqueado */}
      {modalOpen === 'detail' && detailDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="card animate-scale-in" style={{ width: 480, padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Día bloqueado</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '1.2rem' }}>✕</button>
            </div>

            {(() => {
              const info = tipoInfo(detailDate.tipo);
              return (
                <div style={{ padding: '0.75rem 1rem', background: info.bg, borderRadius: 10, border: `1px solid ${info.border}`, marginBottom: '1.1rem' }}>
                  <div style={{ fontWeight: 700, color: info.color, fontSize: '0.92rem' }}>
                    {new Date(detailDate.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: info.color, opacity: 0.8, marginTop: 3 }}>
                    {info.label} · {detailDate.motivo}
                  </div>
                </div>
              );
            })()}

            <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>
              Citas afectadas {loadingCitas ? '…' : `(${citasAfectadas.length})`}
            </h4>

            {loadingCitas ? (
              <div style={{ color: 'var(--text-4)', fontSize: '0.83rem', padding: '0.5rem 0' }}>
                <span className="spinner-mini" /> Cargando citas...
              </div>
            ) : citasAfectadas.length === 0 ? (
              <div style={{ color: 'var(--text-4)', fontSize: '0.83rem', padding: '0.5rem 0' }}>
                Sin citas agendadas en este día.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {citasAfectadas.map(c => {
                  const hora = new Date(c.fechahorainicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                  const clienteNombre = c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido}` : '—';
                  const servicios = c.citaservicios?.map(cs => cs.servicios?.nombre).filter(Boolean).join(', ') || '—';
                  const especialista = c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : '—';
                  return (
                    <div key={c.idcita} style={{ padding: '0.65rem 0.9rem', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{clienteNombre}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600 }}>{hora}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{servicios}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: 1 }}>
                        Especialista: {especialista}
                        {c.cliente?.telefono && <span> · Tel: {c.cliente.telefono}</span>}
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: '0.6rem 0.8rem', background: '#fef3c7', borderRadius: 8, border: '1px solid #fcd34d', fontSize: '0.78rem', color: '#92400e', fontWeight: 600 }}>
                  ⚠ Contacta a estos pacientes para reprogramar sus citas antes de confirmar el bloqueo.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cerrar</button>
              {canManage && (
                <button className="btn" onClick={handleDesbloquear} disabled={saving}
                  style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626', borderRadius: 8, padding: '0.5rem 1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Desbloqueando…' : 'Desbloquear día'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {snack && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: snack.type === 'error' ? '#dc2626' : '#16a34a', color: '#fff', padding: '0.7rem 1.4rem', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {snack.msg}
        </div>
      )}
    </div>
  );
}
