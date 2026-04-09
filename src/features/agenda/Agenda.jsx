import React, { useState, useRef } from 'react';
import { useGlobalState } from '../../context/GlobalState';

/* ─── Helpers ──────────────────────────────────────────── */
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
const startOf = (date, unit) => {
  const d = new Date(date);
  if (unit === 'week') {
    const day = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Mon
  }
  if (unit === 'month') { d.setDate(1); }
  d.setHours(0, 0, 0, 0);
  return d;
};
const toDateStr  = (d) => d.toISOString().split('T')[0];
const toTimeStr  = (h, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const timeToDec  = (t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
const SLOT_H     = 72; // px per hour
const HOURS      = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM - 7 PM
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* ─── Month mini calendar helper ─────────────────────────── */
function buildMonthGrid(pivot) {
  const y = pivot.getFullYear(), m = pivot.getMonth();
  const first = new Date(y, m, 1);
  const last  = new Date(y, m + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* ─── Status badge color ──────────────────────────────────── */
const statusColor = { 'Confirmada': 'var(--success)', 'En Espera': 'var(--warning)', 'Pendiente': 'var(--text-3)', 'Cancelada': 'var(--danger)' };

/* ═══════════════════════════════════════════════════════════
   MAIN AGENDA COMPONENT
══════════════════════════════════════════════════════════ */
export default function Agenda({ user }) {
  const { appointments: allAppts, addAppointment, updateAppointment, deleteAppointment, services, clients } = useGlobalState();

  const appointments = user?.role === 'especialista' 
    ? allAppts.filter(a => a.doctor === user.name) 
    : allAppts;

  /* ------ View state ------ */
  const [view, setView]    = useState('week'); // 'day' | 'week' | 'month'
  const [pivot, setPivot]  = useState(new Date()); // reference date for current view

  /* ------ Modal state ------ */
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [preDate,   setPreDate]     = useState('');
  const [preTime,   setPreTime]     = useState('');
  const [form, setForm]             = useState({ clientId: '', serviceId: '', date: '', time: '09:00' });

  /* ------ Detail popover ------ */
  const [detailAppt, setDetailAppt] = useState(null); // appointment object being inspected
  const [editStatus, setEditStatus] = useState(null);  // inline status editing

  const openDetail  = (appt, e) => { e.stopPropagation(); setDetailAppt(appt); setEditStatus(appt.status); };
  const closeDetail = () => setDetailAppt(null);
  const saveStatus  = () => { updateAppointment(detailAppt.id, { status: editStatus }); setDetailAppt(a => ({ ...a, status: editStatus })); };
  const handleDeleteFromDetail = () => { deleteAppointment(detailAppt.id); closeDetail(); };

  /* ------ Drag state ------ */
  const dragging = useRef(null); // { id, startDecHour }

  /* ── Navigation ── */
  const goToday = () => setPivot(new Date());
  const goPrev  = () => {
    if (view === 'day')   setPivot(p => addDays(p, -1));
    if (view === 'week')  setPivot(p => addDays(p, -7));
    if (view === 'month') setPivot(p => { const d = new Date(p); d.setMonth(d.getMonth() - 1); return d; });
  };
  const goNext  = () => {
    if (view === 'day')   setPivot(p => addDays(p, 1));
    if (view === 'week')  setPivot(p => addDays(p, 7));
    if (view === 'month') setPivot(p => { const d = new Date(p); d.setMonth(d.getMonth() + 1); return d; });
  };

  /* ── Date helpers based on view ── */
  const weekStart = startOf(pivot, 'week');
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr  = toDateStr(new Date());

  /* UI title for the header */
  const headerTitle = (() => {
    const opts = { month: 'long', year: 'numeric' };
    if (view === 'day')   return pivot.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'week')  return `Semana del ${weekDays[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (view === 'month') return pivot.toLocaleDateString('es-CO', opts);
    return '';
  })();

  /* ── Open creation form ── */
  const openCreate = (date = '', time = '') => {
    setEditId(null);
    setForm({ clientId: '', serviceId: '', date: date || todayStr, time: time || '09:00' });
    setShowModal(true);
  };

  const startEdit = (appt) => {
    setEditId(appt.id);
    setForm({ clientId: appt.clientId, serviceId: appt.serviceId, date: appt.date, time: appt.time });
    closeDetail();
    setShowModal(true);
  };

  /* ── Submit new appointment ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientId || !form.serviceId || !form.date) return;
    const svc = services.find(s => s.id === parseInt(form.serviceId));
    
    if (editId) {
      updateAppointment(editId, {
        clientId: parseInt(form.clientId),
        serviceId: parseInt(form.serviceId),
        date: form.date,
        time: form.time,
        duration: svc?.duration || 60
      });
    } else {
      addAppointment({
        ...form,
        clientId: parseInt(form.clientId),
        serviceId: parseInt(form.serviceId),
        duration: svc?.duration || 60,
        doctor: user?.role === 'especialista' ? user.name : undefined
      });
    }
    setShowModal(false);
    setEditId(null);
  };

  /* ── Drag handlers ── */
  const onDragStart = (e, appt) => {
    dragging.current = { id: appt.id, startDecHour: timeToDec(appt.time) };
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.45'; }, 0);
  };

  const onDragEnd   = (e) => { if (e.target) e.target.style.opacity = '1'; dragging.current = null; };

  const onDragOver  = (e) => e.preventDefault();

  /* Drop on a time-grid cell → update date + time */
  const onDropCell  = (e, dateStr, hour) => {
    e.preventDefault();
    if (!dragging.current) return;
    updateAppointment(dragging.current.id, { date: dateStr, time: toTimeStr(hour) });
    dragging.current = null;
  };

  /* ── Appt style ── */
  const apptStyle = (appt) => {
    const top    = (timeToDec(appt.time) - 7) * SLOT_H;
    const height = (appt.duration / 60)        * SLOT_H;
    const svc    = services.find(s => s.id === appt.serviceId);
    const color  = svc?.color || 'var(--primary)';
    return {
      position: 'absolute', top: top + 1, left: 3, right: 3,
      minHeight: height - 3, height: height - 3,
      background: color, borderRadius: 6, padding: '4px 7px',
      color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
      boxShadow: `0 2px 8px ${color}50`, overflow: 'hidden', zIndex: 10,
      borderLeft: '3px solid rgba(255,255,255,0.45)',
      transition: 'opacity 0.15s',
    };
  };

  /* ── Reusable: list of appointments in a day column ── */
  const DayColumn = ({ dateStr }) => {
    const dayAppts = appointments.filter(a => a.date === dateStr);
    return (
      <div style={{ position: 'relative', flex: 1, height: '100%' }}>
        {HOURS.map(h => (
          <div
            key={h}
            onDragOver={onDragOver}
            onDrop={e => onDropCell(e, dateStr, h)}
            onClick={() => openCreate(dateStr, toTimeStr(h))}
            style={{ height: SLOT_H, borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          />
        ))}
        {/* Appointments overlay */}
        {dayAppts.map(appt => {
          const client = clients.find(c => c.id === appt.clientId);
          const svc    = services.find(s => s.id === appt.serviceId);
          return (
            <div
              key={appt.id}
              style={apptStyle(appt)}
              draggable
              onDragStart={e => onDragStart(e, appt, dateStr)}
              onDragEnd={onDragEnd}
              onClick={e => openDetail(appt, e)}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client?.name || 'Cita'}</div>
              {(appt.duration / 60) * SLOT_H > 38 && (
                <div style={{ opacity: 0.88, fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc?.name}</div>
              )}
              {(appt.duration / 60) * SLOT_H > 52 && (
                <div style={{ marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.18)', padding: '1px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor[appt.status] || '#fff', flexShrink: 0 }} />
                  {appt.status}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────
     VIEW: DAY
  ───────────────────────────────────────────────────── */
  const ViewDay = () => (
    <div style={{ display: 'flex', flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      {/* Time labels */}
      <div style={{ width: 60, flexShrink: 0, position: 'relative' }}>
        {HOURS.map(h => (
          <div key={h} style={{ height: SLOT_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 4, fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}>
            {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
          </div>
        ))}
      </div>
      {/* Single column */}
      <div style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative' }}>
        <DayColumn dateStr={toDateStr(pivot)} />
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────
     VIEW: WEEK
  ───────────────────────────────────────────────────── */
  const ViewWeek = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', overflow: 'hidden' }}>
      {/* Day headers — sticky */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ width: 60, flexShrink: 0 }} />
        {weekDays.map((d, i) => {
          const ds       = toDateStr(d);
          const isToday  = ds === todayStr;
          return (
            <div key={i} style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderLeft: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => { setPivot(d); setView('day'); }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{DAY_LABELS[i]}</div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', margin: '4px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? 'var(--primary)' : 'transparent', color: isToday ? '#fff' : 'var(--text)', fontWeight: isToday ? 800 : 600, fontSize: '1.05rem' }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      {/* Scrollable time grid */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
        {/* Time labels */}
        <div style={{ width: 60, flexShrink: 0 }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: SLOT_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}>
              {h === 12 ? '12 PM' : h > 12 ? `${h - 12}p` : `${h}a`}
            </div>
          ))}
        </div>
        {weekDays.map((d, i) => (
          <div key={i} style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative' }}>
            <DayColumn dateStr={toDateStr(d)} />
          </div>
        ))}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────
     VIEW: MONTH
  ───────────────────────────────────────────────────── */
  const ViewMonth = () => {
    const grid = buildMonthGrid(pivot);
    const pivotMonth = pivot.getMonth();
    return (
      <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)' }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '0.65rem 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d}</div>
          ))}
        </div>
        {/* Month grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', alignItems: 'stretch' }}>
          {grid.map((day, idx) => {
            if (!day) return <div key={idx} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }} />;
            const ds       = toDateStr(day);
            const isToday  = ds === todayStr;
            const dayAppts = appointments.filter(a => a.date === ds);
            const isCurrentMonth = day.getMonth() === pivotMonth;
            return (
              <div
                key={idx}
                onClick={() => { setPivot(day); setView('day'); }}
                style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '8px 6px', minHeight: 96, cursor: 'pointer', background: isToday ? 'var(--primary-light)' : 'transparent', opacity: isCurrentMonth ? 1 : 0.4, transition: 'background 0.18s' }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? 'var(--primary)' : 'transparent', color: isToday ? '#fff' : 'var(--text)', fontWeight: isToday ? 800 : 600, fontSize: '0.85rem', marginBottom: 4 }}>
                  {day.getDate()}
                </div>
                {dayAppts.slice(0, 3).map(a => {
                  const svc = services.find(s => s.id === a.serviceId);
                  const client = clients.find(c => c.id === a.clientId);
                  return (
                    <div key={a.id} style={{ background: svc?.color || 'var(--primary)', borderRadius: 4, color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '2px 5px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.time} {client?.name || 'Cita'}
                    </div>
                  );
                })}
                {dayAppts.length > 3 && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 700 }}>+{dayAppts.length - 3} más</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: '100%', overflow: 'hidden' }}>

      {/* ── Main Calendar Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', overflow: 'hidden' }}>

        {/* Calendar Header Controls */}
        <div className="page-header" style={{ padding: '0.85rem 1.25rem' }}>
          {/* Left: Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }} onClick={goToday}>Hoy</button>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button className="btn btn-ghost btn-icon" onClick={goPrev} title="Anterior">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={goNext} title="Siguiente">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>{headerTitle}</h3>
          </div>

          {/* Right: View switcher + New button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
              {[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '0.38rem 0.9rem', borderRadius: 7, border: 'none', fontFamily: 'var(--font-main)', fontSize: '0.82rem', fontWeight: view === v ? 700 : 500, background: view === v ? 'var(--surface)' : 'transparent', color: view === v ? 'var(--text)' : 'var(--text-3)', cursor: 'pointer', boxShadow: view === v ? 'var(--shadow-xs)' : 'none', transition: 'var(--transition)' }}>
                  {label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }} onClick={() => openCreate()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agendar Cita
            </button>
          </div>
        </div>

        {/* Calendar view */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'day'   && <ViewDay />}
          {view === 'week'  && <ViewWeek />}
          {view === 'month' && <ViewMonth />}
        </div>
      </div>

      {/* ── Side Panel: Create appointment ── */}
      {showModal && (
        <div className="card animate-slide-right" style={{ minWidth: 320, width: 320, height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{editId ? 'Editar Cita' : 'Nueva Cita'}</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-4)', fontWeight: 500 }}>{editId ? 'Modificar detalles de la cita' : 'Reservar espacio en la agenda'}</p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {/* Paciente */}
            <div className="input-group">
              <label>Paciente</label>
              <select className="input-field" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                <option value="" disabled>Selecciona paciente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Servicio */}
            <div className="input-group">
              <label>Tratamiento</label>
              <select className="input-field" value={form.serviceId} onChange={e => setForm({ ...form, serviceId: e.target.value })} required>
                <option value="" disabled>Selecciona servicio...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
              </select>
            </div>

            {/* Date + Time */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-2)' }}>📅 Fecha y Hora</p>
              <div className="input-group">
                <label>Fecha</label>
                <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Hora de Inicio</label>
                <input type="time" className="input-field" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>

            {/* Service preview */}
            {form.serviceId && (() => {
              const svc = services.find(s => s.id === parseInt(form.serviceId));
              if (!svc) return null;
              return (
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${svc.color}30`, borderLeft: `3px solid ${svc.color}`, background: `${svc.color}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>{svc.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600 }}>{svc.duration} min</span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem' }}>
              <button type="button" className="btn btn-outline w-full" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary w-full">Confirmar</button>
            </div>
          </form>

          {/* Today's mini appointment list */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-2)', fontSize: '0.82rem', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>Citas de Hoy</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {appointments.filter(a => a.date === todayStr).sort((a,b) => a.time.localeCompare(b.time)).map(appt => {
                const client = clients.find(c => c.id === appt.clientId);
                const svc    = services.find(s => s.id === appt.serviceId);
                return (
                  <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: svc?.color || 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--primary)', minWidth: 36 }}>{appt.time}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client?.name || '—'}</p>
                    </div>
                    <button onClick={() => deleteAppointment(appt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '2px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.18s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                );
              })}
              {appointments.filter(a => a.date === todayStr).length === 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-4)', textAlign: 'center', padding: '0.75rem' }}>Sin citas para hoy</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Appointment Detail Modal ── */}
      {detailAppt && (() => {
        const client = clients.find(c => c.id === detailAppt.clientId);
        const svc    = services.find(s => s.id === detailAppt.serviceId);
        const apptDate = detailAppt.date ? new Date(detailAppt.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
        const color  = svc?.color || 'var(--primary)';
        return (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-box animate-scale-in" style={{ maxWidth: 440, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

              {/* Colored header */}
              <div style={{ background: color, padding: '1.5rem 1.75rem 1rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: -30, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[detailAppt.status] || '#fff' }} />
                      {detailAppt.status}
                    </div>
                    <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{client?.name || 'Paciente'}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.82)', margin: '0.25rem 0 0', fontSize: '0.82rem', fontWeight: 500 }}>
                      CC {client?.doc || '—'} · {client?.phone || 'Sin teléfono'}
                    </p>
                  </div>
                  <button onClick={closeDetail} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>✕</button>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Info grid 2×2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: '🗓️ Fecha',         value: apptDate },
                    { label: '⏰ Hora',           value: detailAppt.time },
                    { label: '⏱️ Duración',       value: `${detailAppt.duration} minutos` },
                    { label: '👩‍⚕️ Especialista',  value: detailAppt.doctor || 'Dra. Fabiola' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem 0.9rem' }}>
                      <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Service card */}
                {svc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: `${color}0E`, border: `1px solid ${color}28`, borderRadius: 'var(--radius)', padding: '0.9rem 1rem', borderLeft: `3px solid ${color}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>💊</div>
                    <div>
                      <p style={{ margin: '0 0 0.15rem', fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{svc.name}</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 500 }}>
                        {svc.category} · {svc.duration} min ·{' '}
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(svc.price)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Inline status editor */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Actualizar Estado</label>
                    <select className="input-field" style={{ fontSize: '0.875rem' }} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                      {['Confirmada', 'En Espera', 'Pendiente', 'Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button onClick={saveStatus} className="btn btn-success" style={{ padding: '0.65rem 1rem', flexShrink: 0, fontSize: '0.82rem', height: 44 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Guardar
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.85rem' }} onClick={closeDetail}>Cerrar</button>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: 'none' }} onClick={() => startEdit(detailAppt)}>
                    Editar Cita
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.85rem' }} onClick={handleDeleteFromDetail}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
