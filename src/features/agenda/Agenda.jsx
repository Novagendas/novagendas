import React, { useState, useRef, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

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

const statusColor = { 'Confirmada': 'var(--success)', 'En Espera': 'var(--warning)', 'Pendiente': 'var(--text-3)', 'Cancelada': 'var(--danger)' };

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

export default function Agenda({ user, tenant }) {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [specialists, setSpecialists] = useState([]);

  /* ------ View state ------ */
  const [view, setView]    = useState('week'); // 'day' | 'week' | 'month'
  const [pivot, setPivot]  = useState(new Date()); 

  /* ------ Modal state ------ */
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ clientId: '', serviceId: '', specialistId: '', date: '', time: '09:00' });

  /* ------ Detail popover ------ */
  const [detailAppt, setDetailAppt] = useState(null); 
  const [editStatus, setEditStatus] = useState(null);  

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    try {
      const { data: cliData } = await supabase.from('cliente').select('*').eq('idnegocios', tenant.id);
      const { data: svcData } = await supabase.from('servicios').select('*').eq('idnegocios', tenant.id);
      const { data: usrData } = await supabase.from('usuario').select('*').eq('idnegocios', tenant.id);
      
      setClients(cliData || []);
      setServices(svcData || []);
      setSpecialists(usrData || []);

      const { data: apptData, error } = await supabase
        .from('cita')
        .select(`
          *,
          estadocita (descripcion)
        `)
        .eq('idnegocios', tenant.id);

      if (!error && apptData) {
        const mapped = apptData.map(a => {
          const start = a.fechahorainicio || '';
          const end = a.fechahorafin || '';
          
          return {
            id: a.idcita,
            clientId: a.idcliente,
            serviceId: null, 
            date: start.split('T')[0] || new Date().toISOString().split('T')[0],
            time: start.includes('T') ? start.split('T')[1].substring(0, 5) : '09:00',
            duration: start && end ? (new Date(end) - new Date(start)) / 60000 : 30,
            status: a.estadocita?.descripcion || 'Pendiente',
            doctor: a.idusuario ? 'Especialista' : 'Pendiente'
          };
        });
        setAppointments(mapped);
      }
    } catch (err) {
      console.error("Error loading agenda data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  const openDetail  = (appt, e) => { e.stopPropagation(); setDetailAppt(appt); setEditStatus(appt.status); };
  const closeDetail = () => setDetailAppt(null);

  const saveStatus  = async () => {
    const statusMap = { 'Confirmada': 1, 'En Espera': 2, 'Cancelada': 3, 'Completada': 4 };
    const statusId = statusMap[editStatus] || 1;
    
    const { error } = await supabase.from('cita').update({ idestadocita: statusId }).eq('idcita', detailAppt.id);
    if (!error) {
      await insertLog({
        accion: 'UPDATE',
        entidad: 'Cita',
        descripcion: `Cambio de estado: ${detailAppt.status} → ${editStatus} (Cita #${detailAppt.id})`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      fetchData();
      setDetailAppt(a => ({ ...a, status: editStatus }));
    }
  };

  const handleDeleteFromDetail = async () => {
    const { error } = await supabase.from('cita').delete().eq('idcita', detailAppt.id);
    if (!error) {
      await insertLog({
        accion: 'DELETE',
        entidad: 'Cita',
        descripcion: `Se eliminó la cita de ${clients.find(c => c.idcliente === detailAppt.clientId)?.nombre || 'Paciente'}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      fetchData();
      closeDetail();
    }
  };

  /* ------ Drag state ------ */
  const dragging = useRef(null); 

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

  const headerTitle = (() => {
    const opts = { month: 'long', year: 'numeric' };
    if (view === 'day')   return pivot.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'week')  return `Semana del ${weekDays[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (view === 'month') return pivot.toLocaleDateString('es-CO', opts);
    return '';
  })();

  const openCreate = (date = '', time = '') => {
    setEditId(null);
    setForm({ 
      clientId: '', 
      serviceId: '', 
      specialistId: specialists.length ? specialists[0].idusuario : '', 
      date: date || todayStr, 
      time: time || '09:00' 
    });
    setShowModal(true);
  };

  const startEdit = (appt) => {
    setEditId(appt.id);
    const original = appointments.find(a => a.id === appt.id);
    setForm({ 
      clientId: appt.clientId, 
      serviceId: appt.serviceId, 
      specialistId: original?.idusuario || '',
      date: appt.date, 
      time: appt.time 
    });
    closeDetail();
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.date) return;
    
    // Duration estimation
    let duration = 60;
    if (form.serviceId) {
      const svc = services.find(s => s.idservicios === parseInt(form.serviceId));
      if (svc) duration = svc.duracion;
    }
    
    const startStr = `${form.date}T${form.time}:00`;
    const end = new Date(new Date(startStr).getTime() + duration * 60000);
    const endStr = end.toISOString();

    const payload = {
      idcliente: parseInt(form.clientId),
      idusuario: form.specialistId ? parseInt(form.specialistId) : null,
      fechahorainicio: startStr,
      fechahorafin: endStr,
      idestadocita: 2, // En Espera (Default)
      idtipocita: 1,   // Valoracion default
      idnegocios: tenant.id
    };

    if (editId) {
      const { error } = await supabase.from('cita').update(payload).eq('idcita', editId);
      if (!error) {
        await insertLog({
          accion: 'UPDATE',
          entidad: 'Cita',
          descripcion: `Reprogramación de cita #${editId} para el ${form.date} a las ${form.time}`,
          idUsuario: user.idusuario || user.id,
          idNegocios: tenant.id
        });
        fetchData();
      }
    } else {
      const { error } = await supabase.from('cita').insert([payload]);
      if (!error) {
        const client = clients.find(c => c.idcliente === payload.idcliente);
        await insertLog({
          accion: 'CREATE',
          entidad: 'Cita',
          descripcion: `Nueva cita agendada para ${client?.nombre || 'Paciente'} el ${form.date} a las ${form.time}`,
          idUsuario: user.idusuario || user.id,
          idNegocios: tenant.id
        });
        fetchData();
      }
    }
    setShowModal(false);
    setEditId(null);
  };

  const onDragStart = (e, appt) => {
    dragging.current = { id: appt.id, startDecHour: timeToDec(appt.time) };
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.45'; }, 0);
  };

  const onDragEnd   = (e) => { if (e.target) e.target.style.opacity = '1'; dragging.current = null; };
  const onDragOver  = (e) => e.preventDefault();

  const onDropCell  = async (e, dateStr, hour) => {
    e.preventDefault();
    if (!dragging.current) return;
    
    const apptId = dragging.current.id;
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const startStr = `${dateStr}T${toTimeStr(hour)}:00`;
    const end = new Date(new Date(startStr).getTime() + appt.duration * 60000);
    const endStr = end.toISOString();

    const { error } = await supabase.from('cita').update({
      fechahorainicio: startStr,
      fechahorafin: endStr
    }).eq('idcita', apptId);

    if (!error) {
      await insertLog({
        accion: 'UPDATE',
        entidad: 'Cita',
        descripcion: `Cita #${apptId} movida (Drag&Drop) al ${dateStr} ${toTimeStr(hour)}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      fetchData();
    }
    dragging.current = null;
  };

  const apptStyle = (appt) => {
    const top    = (timeToDec(appt.time) - 7) * SLOT_H;
    const height = (appt.duration / 60)        * SLOT_H;
    return {
      position: 'absolute', top: top + 1, left: 3, right: 3,
      minHeight: height - 3, height: height - 3,
      background: 'var(--primary)', borderRadius: 6, padding: '4px 7px',
      color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
      boxShadow: `0 2px 8px var(--primary-light)`, overflow: 'hidden', zIndex: 10,
      borderLeft: '3px solid rgba(255,255,255,0.45)',
      transition: 'opacity 0.15s',
    };
  };

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
        {dayAppts.map(appt => {
          const client = clients.find(c => c.idcliente === appt.clientId);
          return (
            <div
              key={appt.id}
              style={apptStyle(appt)}
              draggable
              onDragStart={e => onDragStart(e, appt)}
              onDragEnd={onDragEnd}
              onClick={e => openDetail(appt, e)}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client?.nombre || 'Cita'}</div>
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

  const ViewDay = () => (
    <div style={{ display: 'flex', flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      <div style={{ width: 60, flexShrink: 0, position: 'relative' }}>
        {HOURS.map(h => (
          <div key={h} style={{ height: SLOT_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 4, fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-4)', borderBottom: '1px solid var(--border)' }}>
            {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative' }}>
        <DayColumn dateStr={toDateStr(pivot)} />
      </div>
    </div>
  );

  const ViewWeek = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', overflow: 'hidden' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
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

  const ViewMonth = () => {
    const grid = buildMonthGrid(pivot);
    const pivotMonth = pivot.getMonth();
    return (
      <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)' }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '0.65rem 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d}</div>
          ))}
        </div>
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
                  const client = clients.find(c => c.idcliente === a.clientId);
                  return (
                    <div key={a.id} style={{ background: 'var(--primary)', borderRadius: 4, color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '2px 5px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.time} {client?.nombre || 'Cita'}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: '100%', overflow: 'hidden' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', overflow: 'hidden' }}>
        <div className="page-header" style={{ padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }} onClick={goToday}>Hoy</button>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button className="btn btn-ghost btn-icon" onClick={goPrev}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={goNext}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>{headerTitle}</h3>
          </div>

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

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando agenda...</div> : (
            <>
              {view === 'day'   && <ViewDay />}
              {view === 'week'  && <ViewWeek />}
              {view === 'month' && <ViewMonth />}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="card animate-slide-right" style={{ minWidth: 320, width: 320, height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{editId ? 'Editar Cita' : 'Nueva Cita'}</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div className="input-group">
              <label>Paciente</label>
              <select className="input-field" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                <option value="" disabled>Selecciona paciente...</option>
                {clients.map(c => <option key={c.idcliente} value={c.idcliente}>{c.nombre} {c.apellido}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Tratamiento (Opcional)</label>
              <select className="input-field" value={form.serviceId} onChange={e => setForm({ ...form, serviceId: e.target.value })}>
                <option value="">Selecciona servicio...</option>
                {services.map(s => <option key={s.idservicios} value={s.idservicios}>{s.nombre} ({s.duracion}m)</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Profesional / Especialista</label>
              <select className="input-field" value={form.specialistId} onChange={e => setForm({ ...form, specialistId: e.target.value })} required>
                <option value="" disabled>Selecciona profesional...</option>
                {specialists.map(u => <option key={u.idusuario} value={u.idusuario}>{u.nombre} {u.apellido}</option>)}
              </select>
            </div>

            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group">
                <label>Fecha</label>
                <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Hora</label>
                <input type="time" className="input-field" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full">Confirmar</button>
          </form>
        </div>
      )}

      {detailAppt && (() => {
        const client = clients.find(c => c.idcliente === detailAppt.clientId);
        const apptDate = detailAppt.date ? new Date(detailAppt.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
        return (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-box animate-scale-in" style={{ maxWidth: 440, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ background: 'var(--primary)', padding: '1.5rem 1.75rem 1rem', color: '#fff' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{client?.nombre || 'Paciente'}</h2>
                <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>CC {client?.cedula || '—'}</p>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p><strong>Fecha:</strong> {apptDate}</p>
                <p><strong>Hora:</strong> {detailAppt.time}</p>
                
                <div className="input-group">
                  <label>Estado</label>
                  <select className="input-field" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    {['Confirmada', 'En Espera', 'Pendiente', 'Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-success flex-1" onClick={saveStatus}>Guardar Estado</button>
                  <button className="btn btn-danger flex-1" onClick={handleDeleteFromDetail}>Eliminar Cita</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
