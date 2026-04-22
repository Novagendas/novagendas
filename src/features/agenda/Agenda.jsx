import React, { useState, useRef, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../services/googleCalendar';

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
const toDateStr = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toTimeStr = (h, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const timeToDec = (t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
const SLOT_H = 72; // px per hour
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const statusColor = { 'Confirmada': 'var(--success)', 'En Espera': 'var(--warning)', 'Pendiente': 'var(--text-3)', 'Cancelada': 'var(--danger)', 'Completada': 'var(--primary)' };

/* ─── Month mini calendar helper ─────────────────────────── */
function buildMonthGrid(pivot) {
  const y = pivot.getFullYear(), m = pivot.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* ─── Searchable Select Component ─────────────────────────── */
const SearchableSelect = ({ label, options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOpt = options.find(o => String(o.value) === String(value));

  return (
    <div className="input-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--surface)',
          border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: '16px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 4px var(--primary-light)' : 'var(--shadow-sm)'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <div style={{ flex: 1, color: selectedOpt ? 'var(--text)' : 'var(--text-5)', fontWeight: selectedOpt ? 700 : 500, fontSize: '0.95rem' }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="3" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>

      {isOpen && (
        <div className="animate-scale-in" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          marginTop: '0.6rem',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 2000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div style={{ position: 'relative' }}>
                <SuggestionInput 
                  autoFocus
                  placeholder="Escribe para buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.9rem', borderRadius: '12px', border: '1.5px solid var(--border-strong)', background: 'var(--surface)' }}
                  spellCheck={true} 
                  lang="es" 
                  suggestions={[...new Set([...options.map(o => o.label), ...commonTerms])]} 
                />
              <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filtered.length > 0 ? filtered.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                style={{
                  padding: '0.9rem 1.25rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: String(value) === String(opt.value) ? 'var(--primary-light)' : 'transparent',
                  color: String(value) === String(opt.value) ? 'var(--primary)' : 'var(--text-2)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={e => e.currentTarget.style.background = String(value) === String(opt.value) ? 'var(--primary-light)' : 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = String(value) === String(opt.value) ? 'var(--primary-light)' : 'transparent'}
              >
                {opt.label}
                {String(value) === String(opt.value) && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            )) : (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-4)', fontWeight: 500 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                No se encontraron resultados para "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Agenda({ user, tenant }) {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialists, setSpecialists] = useState([]);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  
  // Configurable working hours
  const [workHours, setWorkHours] = useState({ start: 6, end: 21 });
  const HOURS = Array.from({ length: workHours.end - workHours.start + 1 }, (_, i) => i + workHours.start);
  const START_H = workHours.start;

  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  /* ------ View state ------ */
  const [view, setView] = useState('week'); // 'day' | 'week' | 'month'
  const [pivot, setPivot] = useState(new Date());

  const [hoveredAppt, setHoveredAppt] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* ------ Modal state ------ */
  const [showModal, setShowModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [tempWorkHours, setTempWorkHours] = useState({ start: 6, end: 21 });
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ clientId: '', serviceIds: [], specialistId: '', date: '', time: '09:00', gcalEventId: null });
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  /* ------ Filter state ------ */
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(user.role === 'especialista' ? (user.idusuario || user.id) : null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [conflictModal, setConflictModal] = useState({ show: false, message: '', details: null });

  /* ------ Conflict Helper ------ */
  const checkConflict = (newDate, newTime, duration, specialistId, excludeId = null) => {
    const newStartMs = new Date(`${newDate}T${newTime}:00`).getTime();
    const newEndMs = newStartMs + (duration * 60000);

    return appointments.find(appt => {
      if (excludeId && appt.id === excludeId) return false;
      if (appt.specialistId !== specialistId) return false;
      if (appt.date !== newDate) return false;
      if (appt.status === 'Cancelada') return false;

      const apptStartMs = new Date(`${appt.date}T${appt.time}:00`).getTime();
      const apptEndMs = apptStartMs + (appt.duration * 60000);

      return (newStartMs < apptEndMs) && (newEndMs > apptStartMs);
    });
  };

  /* ------ Detail popover ------ */
  const [detailAppt, setDetailAppt] = useState(null);
  const [editStatus, setEditStatus] = useState(null);

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    try {
      const { data: cliData } = await supabase.from('cliente').select('*').eq('idnegocios', tenant.id);
      const { data: svcData } = await supabase.from('servicios').select('*').eq('idnegocios', tenant.id);
      
      // Fetch users with 'profesional' role (idrol = 3) via junction table
      const { data: specData } = await supabase
        .from('rolpermisos')
        .select(`
          idusuario,
          usuario:idusuario (idusuario, nombre, apellido, idnegocios)
        `)
        .eq('idrol', 3);

      const filteredSpecs = specData
        ?.map(s => s.usuario)
        .filter(u => u && u.idnegocios === tenant.id) || [];
      
      // Deduplicate
      const uniqueSpecs = Array.from(new Map(filteredSpecs.map(u => [u.idusuario, u])).values());

      setClients(cliData || []);
      setServices(svcData || []);
      setSpecialists(uniqueSpecs);

      const { data: apptData, error } = await supabase
        .from('cita')
        .select(`
          *,
          estadocita (descripcion),
          usuario (nombre, apellido),
          citaservicios (
            idservicios,
            servicios (*)
          )
        `)
        .eq('idnegocios', tenant.id);

      if (!error && apptData) {
        const mapped = apptData.map(a => {
          const startStr = a.fechahorainicio || '';
          const endStr = a.fechahorafin || '';
          
          if (!startStr) return null;

          // Parse to local date object
          const startD = new Date(startStr.replace(' ', 'T'));
          const endD = endStr ? new Date(endStr.replace(' ', 'T')) : new Date(startD.getTime() + 30 * 60000);

          const apptServices = a.citaservicios?.map(cs => cs.servicios).filter(Boolean) || [];
          const totalDuration = apptServices.reduce((sum, s) => sum + (s.duracion || 0), 0) || 30;

          return {
            id: a.idcita,
            clientId: a.idcliente,
            serviceIds: apptServices.map(s => s.idservicios),
            services: apptServices,
            specialistId: a.idusuario,
            date: toDateStr(startD),
            time: toTimeStr(startD.getHours(), startD.getMinutes()),
            duration: totalDuration,
            status: a.estadocita?.descripcion || 'Pendiente',
            doctor: a.usuario ? `${a.usuario.nombre} ${a.usuario.apellido}` : 'Pendiente',
            gcalEventId: a.gcal_event_id || null,
          };
        }).filter(Boolean);
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

  const openDetail = (appt, e) => { e.stopPropagation(); setDetailAppt(appt); setEditStatus(appt.status); setHoveredAppt(null); };
  const closeDetail = () => { setDetailAppt(null); setHoveredAppt(null); };

  const saveStatus = async () => {
    const statusMap = { 'Confirmada': 1, 'En Espera': 2, 'Cancelada': 3, 'Completada': 4 };
    const statusId = statusMap[editStatus] || 1;

    const { error } = await supabase.from('cita').update({ idestadocita: statusId }).eq('idcita', detailAppt.id);
    if (!error) {
      await insertLog({
        accion: 'UPDATE',
        entidad: 'Cita',
        descripcion: `Cambio de estado: ${detailAppt.status} → ${editStatus} (Cita paciente: ${clients.find(c => c.idcliente === detailAppt.clientId)?.nombre || ''})`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      fetchData();
      
      if (editStatus === 'Cancelada') {
        closeDetail();
        showSnack('Cita cancelada', 'error');
      } else {
        setDetailAppt(a => ({ ...a, status: editStatus }));
        showSnack(`Estado actualizado a ${editStatus}`);
      }
    }
  };

  const handleDeleteFromDetail = async () => {
    try {
      const gcalEventId = detailAppt.gcalEventId;
      const clientName = clients.find(c => c.idcliente === detailAppt.clientId)?.nombre || 'Paciente';

      await supabase.from('citaservicios').delete().eq('idcita', detailAppt.id);
      const { error } = await supabase.from('cita').delete().eq('idcita', detailAppt.id);
      if (error) throw error;

      await insertLog({
        accion: 'DELETE',
        entidad: 'Cita',
        descripcion: `Se eliminó la cita de ${clientName}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });

      // Eliminar evento de Google Calendar y notificar a los invitados
      if (gcalEventId) {
        try {
          await deleteCalendarEvent(gcalEventId);
        } catch (calErr) {
          console.warn('No se pudo eliminar el evento de Google Calendar:', calErr.message);
        }
      }

      fetchData();
      closeDetail();
      showSnack('Cita eliminada correctamente');
    } catch (err) {
      showSnack("Error al eliminar la cita: " + (err.message || "Error desconocido"), 'error');
    }
  };

  /* ------ Drag state ------ */
  const dragging = useRef(null);

  /* ── Navigation ── */
  const goToday = () => setPivot(new Date());
  const goPrev = () => {
    if (view === 'day') setPivot(p => addDays(p, -1));
    if (view === 'week') setPivot(p => addDays(p, -7));
    if (view === 'month') setPivot(p => { const d = new Date(p); d.setMonth(d.getMonth() - 1); return d; });
  };
  const goNext = () => {
    if (view === 'day') setPivot(p => addDays(p, 1));
    if (view === 'week') setPivot(p => addDays(p, 7));
    if (view === 'month') setPivot(p => { const d = new Date(p); d.setMonth(d.getMonth() + 1); return d; });
  };

  /* ── Date helpers based on view ── */
  const weekStart = startOf(pivot, 'week');
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = toDateStr(new Date());

  const headerTitle = (() => {
    const opts = { month: 'long', year: 'numeric' };
    if (view === 'day') return pivot.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'week') return `Semana del ${weekDays[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (view === 'month') return pivot.toLocaleDateString('es-CO', opts);
    return '';
  })();

  const openCreate = (date = '', time = '') => {
    setEditId(null);
    setForm({
      clientId: '',
      serviceIds: [],
      specialistId: specialists.length ? specialists[0].idusuario : '',
      date: date || todayStr,
      time: time || '09:00'
    });
    setShowModal(true);
  };

  const startEdit = (appt) => {
    setEditId(appt.id);
    setForm({
      clientId: appt.clientId,
      serviceIds: appt.serviceIds || [],
      specialistId: appt.specialistId || '',
      date: appt.date,
      time: appt.time,
      gcalEventId: appt.gcalEventId || null,
    });
    closeDetail();
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Explicit Validations
    if (!form.clientId) {
      showSnack('⚠️ Por favor selecciona un paciente', 'error');
      return;
    }
    if (form.serviceIds.length === 0) {
      showSnack('⚠️ Debes elegir al menos un servicio', 'error');
      return;
    }
    if (!form.date || !form.time) {
      showSnack('⚠️ Define fecha y hora para la cita', 'error');
      return;
    }

    setSaving(true);

    try {
      // Duration estimation from all selected services
      const selectedServices = services.filter(s => form.serviceIds.includes(s.idservicios));
      const duration = selectedServices.reduce((sum, s) => sum + (s.duracion || 0), 0) || 30;
      
      const startStr = `${form.date}T${form.time}:00`;
      const startDate = new Date(startStr);
      if (isNaN(startDate.getTime())) throw new Error("Fecha u hora inválida.");

      const endDate = new Date(startDate.getTime() + duration * 60000);
      const pad = (n) => String(n).padStart(2, '0');
      const formattedEnd = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

      const payload = {
        idcliente: parseInt(form.clientId),
        idservicio: form.serviceIds[0] || null, // Keep first for legacy/compatibility
        idusuario: form.specialistId ? parseInt(form.specialistId) : null,
        fechahorainicio: startStr,
        fechahorafin: formattedEnd,
        idestadocita: 2, // En Espera (Default)
        idtipocita: 1,   // Valoracion default
        idnegocios: tenant.id
      };

      // ── Overlap Validation ──
      const conflict = checkConflict(form.date, form.time, duration, form.specialistId, editId);

      if (conflict) {
        const conflictClient = clients.find(c => c.idcliente === conflict.clientId);
        const startTime = conflict.time;
        const endTime = getEndTime(conflict);
        
        setSaving(false);
        setConflictModal({
          show: true,
          message: `Conflicto de Horario`,
          details: {
            clientName: `${conflictClient?.nombre || 'otro paciente'} ${conflictClient?.apellido || ''}`,
            startTime,
            endTime
          }
        });
        return;
      }

      let appointmentId = editId;

      if (editId) {
        const { error } = await supabase.from('cita').update(payload).eq('idcita', editId);
        if (error) throw error;
      } else {
        const { data: newAppt, error } = await supabase.from('cita').insert([payload]).select().single();
        if (error) throw error;
        appointmentId = newAppt.idcita;
      }

      // Sync Multi-Services
      await supabase.from('citaservicios').delete().eq('idcita', appointmentId);
      if (form.serviceIds.length > 0) {
        const serviceEntries = form.serviceIds.map(sid => ({
          idcita: appointmentId,
          idservicios: sid
        }));
        await supabase.from('citaservicios').insert(serviceEntries);
      }
      
      showSnack(editId ? 'Cita actualizada correctamente' : 'Cita agendada correctamente');

      const client = clients.find(c => c.idcliente === payload.idcliente);
      await insertLog({
        accion: editId ? 'UPDATE' : 'CREATE',
        entidad: 'Cita',
        descripcion: `${editId ? 'Reprogramación' : 'Nueva cita'} para ${client?.nombre || 'Paciente'} el ${form.date} a las ${form.time}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });

      // ── Sincronizar con Google Calendar (fire & forget) ──
      try {
        const specialist = specialists.find(s => s.idusuario === parseInt(form.specialistId));
        const selectedServices = services.filter(s => form.serviceIds.includes(s.idservicios));
        const serviceNames = selectedServices.map(s => s.nombre).join(', ');
        const totalPrice = selectedServices.reduce((sum, s) => sum + (s.precio || 0), 0);
        const totalDurMin = selectedServices.reduce((sum, s) => sum + (s.duracion || 0), 0);

        const attendees = [];
        if (client?.email) attendees.push(client.email);
        if (specialist?.email) attendees.push(specialist.email);

        const dateLabel = new Date(startStr).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeLabel = form.time;

        const description = [
          `📅 CITA MÉDICA — ${tenant?.name || 'NovaAgendas'}`,
          '',
          `📋 Servicios: ${serviceNames}`,
          totalDurMin ? `⏱️ Duración estimada: ${totalDurMin} min` : null,
          totalPrice ? `💰 Precio estimado: $${totalPrice.toLocaleString('es-CO')} COP` : null,
          '',
          `👤 Paciente: ${client?.nombre || ''} ${client?.apellido || ''}`,
          client?.telefono ? `📞 Teléfono: ${client.telefono}` : null,
          client?.email ? `📧 Email: ${client.email}` : null,
          client?.cedula ? `🪪 Documento: ${client.cedula}` : null,
          '',
          `👨‍⚕️ Especialista: ${specialist ? `${specialist.nombre} ${specialist.apellido}` : 'Por asignar'}`,
          specialist?.profesion ? `   Especialidad: ${specialist.profesion}` : null,
          '',
          `📆 Fecha: ${dateLabel}`,
          `🕐 Hora: ${timeLabel}`,
          '',
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `Cita gestionada por NovaAgendas`,
          `Favor llegar 10 minutos antes de la cita.`,
        ].filter(l => l !== null).join('\n');

        const calArgs = { summary: `🗓️ ${client?.nombre || 'Paciente'} ${client?.apellido || ''} — ${serviceNames}`, description, startDateTime: startStr, endDateTime: formattedEnd, attendeeEmails: attendees };

        if (editId && form.gcalEventId) {
          // Actualizar evento existente
          await updateCalendarEvent(form.gcalEventId, calArgs);
        } else if (!editId) {
          // Crear nuevo evento y guardar su ID en la cita
          const newEventId = await createCalendarEvent(calArgs);
          if (newEventId) {
            await supabase.from('cita').update({ gcal_event_id: newEventId }).eq('idcita', appointmentId);
          }
        }
      } catch (calErr) {
        console.warn('Google Calendar no sincronizado:', calErr.message);
      }

      fetchData();
      setShowModal(false);
      setEditId(null);
    } catch (err) {
      console.error("Error saving appointment:", err);
      showSnack("Error al guardar la cita: " + (err.message || "Error desconocido"), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkHours = () => {
    const conflicts = appointments.filter(appt => {
      const apptStart = timeToDec(appt.time);
      const apptEnd = apptStart + (appt.duration / 60);
      return apptStart < tempWorkHours.start || apptEnd > tempWorkHours.end;
    });

    if (conflicts.length > 0) {
      showSnack(`No se puede modificar la jornada: hay ${conflicts.length} cita(s) fuera del nuevo horario. Elimínalas o muévelas primero.`, 'error');
      return;
    }

    setWorkHours(tempWorkHours);
    setShowHoursModal(false);
    showSnack('Jornada actualizada correctamente');
  };

  const openHoursModal = () => {
    setTempWorkHours(workHours);
    setShowHoursModal(true);
  };

  const onDragStart = (e, appt) => {
    dragging.current = { id: appt.id, startDecHour: timeToDec(appt.time) };
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.45'; }, 0);
  };

  const onDragEnd = (e) => { if (e.target) e.target.style.opacity = '1'; dragging.current = null; };
  const onDragOver = (e) => e.preventDefault();

  const onDropCell = async (e, dateStr, hour) => {
    e.preventDefault();
    if (!dragging.current) return;

    const apptId = dragging.current.id;
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    // Calculate initial drop time
    let dropTime = toTimeStr(hour);
    
    // Smart Adjust: If there's a conflict, push it to the end of the conflicting appointment
    let conflict = checkConflict(dateStr, dropTime, appt.duration, appt.specialistId, apptId);
    let attempts = 0;
    while (conflict && attempts < 5) {
      dropTime = getEndTime(conflict);
      conflict = checkConflict(dateStr, dropTime, appt.duration, appt.specialistId, apptId);
      attempts++;
    }

    if (conflict) {
      const conflictClient = clients.find(c => c.idcliente === conflict.clientId);
      showSnack(`⚠️ Imposible agendar: Demasiados conflictos después de las ${dropTime}`, 'error');
      dragging.current = null;
      return;
    }

    const startStr = `${dateStr}T${dropTime}:00`;
    const end = new Date(new Date(startStr).getTime() + appt.duration * 60000);
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}T${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`;

    const { error } = await supabase.from('cita').update({
      fechahorainicio: startStr,
      fechahorafin: endStr
    }).eq('idcita', apptId);

    if (!error) {
      await insertLog({
        accion: 'UPDATE',
        entidad: 'Cita',
        descripcion: `Cita de paciente ${clients.find(c => c.idcliente === appt.clientId)?.nombre || ''} movida al ${dateStr} ${dropTime}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      fetchData();
    }
    dragging.current = null;
  };

  const apptStyle = (appt) => {
    const top = (timeToDec(appt.time) - START_H) * SLOT_H;
    const height = Math.max((appt.duration / 60) * SLOT_H, 28);

    // Exact Service Color (from first service)
    const service = appt.services?.[0] || services.find(s => s.idservicios === appt.serviceIds?.[0]);
    const baseColor = service?.color || 'var(--primary)';
    const borderColor = statusColor[appt.status] || 'rgba(255,255,255,0.4)';

    return {
      position: 'absolute', top: top + 1, left: 4, right: 4,
      minHeight: height - 2, height: height - 2,
      background: baseColor,
      borderRadius: 10, padding: '6px 9px',
      color: '#fff', fontSize: '0.82rem', cursor: 'pointer',
      boxShadow: `0 4px 12px ${baseColor}33`,
      overflow: 'hidden', zIndex: 10,
      borderLeft: `5px solid ${borderColor}`,
      transition: 'box-shadow 0.2s, transform 0.2s',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
    };
  };

  const getEndTime = (appt) => {
    const [h, m] = appt.time.split(':').map(Number);
    const endMinutes = h * 60 + m + appt.duration;
    return toTimeStr(Math.floor(endMinutes / 60), endMinutes % 60);
  };


  const DayColumn = ({ dateStr }) => {
    const dayAppts = appointments.filter(a => {
      const isCorrectDate = a.date === dateStr && a.status !== 'Cancelada';
      const isCorrectSpec = selectedSpecialistId ? String(a.specialistId) === String(selectedSpecialistId) : true;
      return isCorrectDate && isCorrectSpec;
    });
    return (
      <div style={{ position: 'relative', flex: 1, height: '100%' }}>
        {HOURS.map(h => (
          <div
            key={h}
            onDragOver={onDragOver}
            onDrop={e => onDropCell(e, dateStr, h)}
            onClick={() => openCreate(dateStr, toTimeStr(h))}
            style={{ height: SLOT_H, borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          />
        ))}
        {dayAppts.map(appt => {
          const client = clients.find(c => c.idcliente === appt.clientId);
          const serviceNames = appt.services?.map(s => s.nombre).join(', ') || 'Consulta General';
          const cardH = Math.max((appt.duration / 60) * SLOT_H, 28);
          const showService = cardH > 40;
          const showTime = cardH > 52;
          return (
            <div
              key={appt.id}
              style={apptStyle(appt)}
              draggable
              onDragStart={e => onDragStart(e, appt)}
              onDragEnd={onDragEnd}
              onClick={e => openDetail(appt, e)}
              onMouseEnter={e => { 
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredAppt({ ...appt, client, serviceNames, endTime: getEndTime(appt) });
                setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                e.currentTarget.style.transform = 'scale(1.02)'; 
                e.currentTarget.style.boxShadow = '0 6px 18px var(--primary-glow)'; 
              }}
              onMouseLeave={e => { 
                setHoveredAppt(null);
                e.currentTarget.style.transform = 'none'; 
                e.currentTarget.style.boxShadow = '0 3px 10px var(--primary-glow-sm)'; 
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', position: 'relative' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.2)', lineHeight: 1.2, paddingRight: '20px' }}>
                  {client?.nombre || 'Paciente'} {client?.apellido || ''}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); startEdit(appt); }}
                  style={{ position: 'absolute', right: '-2px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ViewDay = () => (
    <div style={{ display: 'flex', flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: 75, flexShrink: 0, position: 'relative' }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: SLOT_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
              {h === 12 ? (
                <>12:00 <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: 2, opacity: 0.8 }}>PM</span></>
              ) : h > 12 ? (
                <>{String(h - 12).padStart(2, '0')}:00 <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: 2, opacity: 0.8 }}>PM</span></>
              ) : (
                <>{String(h).padStart(2, '0')}:00 <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: 2, opacity: 0.8 }}>AM</span></>
              )}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative' }}>
          {DayColumn({ dateStr: toDateStr(pivot) })}
        </div>
      </div>
    </div>
  );

  const ViewWeek = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ width: 75, flexShrink: 0 }} />
        {weekDays.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
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
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ width: 75, flexShrink: 0 }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: SLOT_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
              {h === 12 ? (
                <>12:00 <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: 2, opacity: 0.8 }}>PM</span></>
              ) : h > 12 ? (
                <>{String(h - 12).padStart(2, '0')}:00 <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: 2, opacity: 0.8 }}>PM</span></>
              ) : (
                <>{String(h).padStart(2, '0')}:00 <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: 2, opacity: 0.8 }}>AM</span></>
              )}
            </div>
          ))}
        </div>
        {weekDays.map((d, i) => (
          <div key={i} style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative' }}>
            {DayColumn({ dateStr: toDateStr(d) })}
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
            const ds = toDateStr(day);
            const isToday = ds === todayStr;
            const dayAppts = appointments.filter(a => {
              const isCorrectDate = a.date === ds && a.status !== 'Cancelada';
              const isCorrectSpec = selectedSpecialistId ? String(a.specialistId) === String(selectedSpecialistId) : true;
              return isCorrectDate && isCorrectSpec;
            });
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
                  const serviceNames = a.services?.map(s => s.nombre).join(', ') || 'Consulta General';
                  return (
                    <div 
                      key={a.id} 
                      style={{ 
                        background: a.services?.[0]?.color || 'var(--primary)', 
                        borderRadius: 4, 
                        color: '#fff', 
                        fontSize: '0.65rem', 
                        fontWeight: 600, 
                        padding: '2px 5px', 
                        marginBottom: 2, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => { 
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredAppt({ ...a, client, serviceNames, endTime: getEndTime(a) });
                        setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredAppt(null)}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {client?.nombre || 'Paciente'} {client?.apellido || ''}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEdit(a); }}
                        style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: '#fff', opacity: 0.8 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={goNext}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>{headerTitle}</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Hours Config Button */}
            <button 
              className="btn btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
              onClick={openHoursModal}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Jornada: {workHours.start}:00 {workHours.start >= 12 ? 'PM' : 'AM'} — {workHours.end === 12 ? '12:00 PM' : workHours.end > 12 ? `${workHours.end - 12}:00 PM` : `${workHours.end}:00 AM`}
            </button>

            <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
              {[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '0.38rem 0.9rem', borderRadius: 7, border: 'none', fontFamily: 'var(--font-main)', fontSize: '0.82rem', fontWeight: view === v ? 700 : 500, background: view === v ? 'var(--surface)' : 'transparent', color: view === v ? 'var(--text)' : 'var(--text-3)', cursor: 'pointer', boxShadow: view === v ? 'var(--shadow-xs)' : 'none', transition: 'var(--transition)' }}>
                  {label}
                </button>
              ))}
            </div>

            {user.role !== 'especialista' && (
              <button 
                className="btn btn-outline" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.45rem 0.9rem', 
                  fontSize: '0.82rem', 
                  fontWeight: 700,
                  background: selectedSpecialistId ? 'var(--primary-light)' : 'var(--surface)',
                  color: selectedSpecialistId ? 'var(--primary)' : 'var(--text)',
                  borderColor: selectedSpecialistId ? 'var(--primary)' : 'var(--border-strong)'
                }}
                onClick={() => setShowFilterModal(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {selectedSpecialistId ? specialists.find(s => String(s.idusuario) === String(selectedSpecialistId))?.nombre || 'Filtrado' : 'Todos los Especialistas'}
              </button>
            )}

            <button className="btn btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }} onClick={() => openCreate()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Agendar Cita
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              <div className="skeleton skeleton-button" style={{ width: '200px', height: '2rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                <div className="skeleton" style={{ width: '75px', height: '100%' }}></div>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="skeleton" style={{ flex: 1, height: '100%', opacity: 0.7 - (i * 0.05) }}></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {view === 'day' && ViewDay()}
              {view === 'week' && ViewWeek()}
              {view === 'month' && ViewMonth()}
            </>
          )}
        </div>
      </div>

      {/* Configuration Hours Modal */}
      {showHoursModal && (
        <div className="modal-overlay" onClick={() => setShowHoursModal(false)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.65rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>Jornada Laboral</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600 }}>Define el horario de atención.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowHoursModal(false)} style={{ borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="modal-scroll-area" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Apertura</label>
                    <select 
                      className="input-field"
                      value={tempWorkHours.start} 
                      onChange={e => setTempWorkHours(prev => ({ ...prev, start: parseInt(e.target.value) }))}
                      style={{ borderRadius: '16px', height: '52px', border: '1.5px solid var(--border-strong)', fontWeight: 600 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{i}:00 AM</option>
                      ))}
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+12} value={i+12}>{i === 0 ? '12' : i}:00 PM</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Cierre</label>
                    <select 
                      className="input-field"
                      value={tempWorkHours.end} 
                      onChange={e => setTempWorkHours(prev => ({ ...prev, end: parseInt(e.target.value) }))}
                      style={{ borderRadius: '16px', height: '52px', border: '1.5px solid var(--border-strong)', fontWeight: 600 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{i}:00 AM</option>
                      ))}
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+12} value={i+12}>{i === 0 ? '12' : i}:00 PM</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(37, 99, 235, 0.1)', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '0.15rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary-deep)', fontWeight: 600, lineHeight: 1.5 }}>
                    Los cambios afectarán la visualización de la agenda. Valida que no existan citas fuera del nuevo horario.
                  </p>
                </div>
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--surface)' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', height: '52px' }} onClick={() => setShowHoursModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" style={{ flex: 2, borderRadius: '16px', height: '52px', fontWeight: 800, fontSize: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }} onClick={handleSaveWorkHours}>
                  Guardar Jornada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specialist Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.65rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>Filtrar Especialista</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600 }}>Visualiza solo las citas de un profesional.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowFilterModal(false)} style={{ borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="modal-scroll-area" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <SearchableSelect 
                  label="Seleccionar Profesional"
                  placeholder="Busca por nombre..."
                  icon="👨‍⚕️"
                  options={[
                    { value: 'all', label: '👥 Todos los Especialistas' },
                    ...specialists.map(u => ({ value: u.idusuario, label: `${u.nombre} ${u.apellido}` }))
                  ]}
                  value={selectedSpecialistId || 'all'}
                  onChange={val => {
                    setSelectedSpecialistId(val === 'all' ? null : val);
                    setShowFilterModal(false);
                  }}
                />

                <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '0.15rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 600, lineHeight: 1.5 }}>
                    Al seleccionar un profesional, la agenda solo mostrará sus compromisos asignados para evitar confusiones visuales.
                  </p>
                </div>
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--surface)' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', height: '52px' }} onClick={() => setShowFilterModal(false)}>Cerrar</button>
                {selectedSpecialistId && (
                  <button type="button" className="btn btn-primary" style={{ flex: 1, borderRadius: '16px', height: '52px', fontWeight: 800 }} onClick={() => { setSelectedSpecialistId(null); setShowFilterModal(false); }}>
                    Ver Todos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {conflictModal.show && (
        <div className="modal-overlay" style={{ zIndex: 100001 }} onClick={() => setConflictModal({ show: false, message: '', details: null })}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 440, border: '2px solid var(--danger)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, var(--danger-light) 0%, var(--surface) 100%)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--danger-deep)' }}>{conflictModal.message}</h3>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-2)', fontWeight: 600, lineHeight: 1.5 }}>
                  No es posible agendar en este momento. Ya existe una cita programada:
                </p>
              </div>

              {conflictModal.details && (
                <div style={{ width: '100%', background: 'var(--surface)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase' }}>Paciente</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>{conflictModal.details.clientName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase' }}>Horario</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '8px' }}>
                      {conflictModal.details.startTime} — {conflictModal.details.endTime}
                    </span>
                  </div>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-4)', fontWeight: 600 }}>
                Por favor, elige un horario diferente o cambia de profesional asignado.
              </p>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', height: '52px', borderRadius: '16px', background: 'var(--danger)', borderColor: 'var(--danger)', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)', fontSize: '1.1rem', fontWeight: 800 }}
                onClick={() => setConflictModal({ show: false, message: '', details: null })}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {hoveredAppt && !detailAppt && !showModal && (
        <div style={{
          position: 'fixed',
          left: mousePos.x,
          top: mousePos.y,
          transform: 'translate(-50%, -100%)',
          marginTop: -8,
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          zIndex: 99999,
          pointerEvents: 'none',
          minWidth: 260,
          color: 'var(--text)',
          animation: 'fadeInOpacity 0.15s ease-out',
        }}>
          <style>{`@keyframes fadeInOpacity { from { opacity: 0; } to { opacity: 1; } }`}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6 }}>
                {hoveredAppt.time} - {hoveredAppt.endTime}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-4)' }}>{hoveredAppt.status}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', lineHeight: 1.2 }}>
              {hoveredAppt.client?.nombre || 'Desconocido'} {hoveredAppt.client?.apellido || ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 600 }}>
              <strong style={{ color: 'var(--text-2)' }}>Servicio(s):</strong> {hoveredAppt.serviceNames}
            </div>
            {hoveredAppt.doctor && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 600 }}>
                <strong style={{ color: 'var(--text-2)' }}>Especialista:</strong> {hoveredAppt.doctor}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            {/* Professional Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '2rem 2rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '14px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{editId ? 'Gestión de Cita' : 'Nueva Cita'}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600 }}>Agenda servicios para tus pacientes.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} style={{ borderRadius: '12px', width: '38px', height: '38px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--surface)' }}>
              <div className="modal-scroll-area" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <SearchableSelect 
                  label="Paciente Responsable"
                  placeholder="Busca un paciente..."
                  icon="👤"
                  options={clients.map(c => ({ value: c.idcliente, label: `${c.nombre} ${c.apellido} (${c.cedula || 'N/A'})` }))}
                  value={form.clientId}
                  onChange={val => setForm({ ...form, clientId: val })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Selección de Servicios</label>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => setShowServiceMenu(true)}
                      style={{
                        height: '54px',
                        borderRadius: '16px',
                        justifyContent: 'space-between',
                        padding: '0 1.25rem',
                        background: form.serviceIds.length > 0 ? 'var(--primary-light)' : 'var(--surface)',
                        borderColor: form.serviceIds.length > 0 ? 'var(--primary)' : 'var(--border-strong)',
                        color: form.serviceIds.length > 0 ? 'var(--primary)' : 'var(--text-3)',
                        width: '100%',
                        borderWidth: '1.5px',
                        fontWeight: 700
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                        <span>{form.serviceIds.length > 0 ? `${form.serviceIds.length} seleccionados` : 'Elegir...'}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>

                  <SearchableSelect 
                    label="Profesional Asignado"
                    placeholder="Busca profesional..."
                    icon="👨‍⚕️"
                    options={specialists.map(u => ({ value: u.idusuario, label: `${u.nombre} ${u.apellido}` }))}
                    value={form.specialistId}
                    onChange={val => setForm({ ...form, specialistId: val })}
                  />
                </div>

                {form.serviceIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '20px', border: '1.5px dashed var(--border)' }}>
                    {form.serviceIds.map(sid => {
                      const s = services.find(sv => sv.idservicios === sid);
                      return (
                        <div key={sid} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', boxShadow: 'var(--shadow-xs)' }}>
                          {s?.nombre}
                          <span onClick={() => setForm({ ...form, serviceIds: form.serviceIds.filter(id => id !== sid) })} style={{ cursor: 'pointer', color: 'var(--danger)', fontSize: '1.25rem', lineHeight: 1 }}>×</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: '24px', padding: '1.75rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Fecha de Cita</label>
                    <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={{ borderRadius: '16px', height: '52px', border: '1.5px solid var(--border-strong)', fontWeight: 600 }} />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Hora</label>
                    <input type="time" className="input-field" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required style={{ borderRadius: '16px', height: '52px', border: '1.5px solid var(--border-strong)', fontWeight: 600 }} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--surface)' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', height: '54px' }} onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '16px', height: '54px', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 8px 24px var(--primary-light)' }} disabled={saving}>
                  {saving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="spinner" style={{ width: '1.2rem', height: '1.2rem' }}></div>
                      Procesando...
                    </div>
                  ) : (editId ? 'Guardar Cambios' : 'Agendar Cita')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, background: snackbar.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontWeight: 700, animation: 'slideInBottom 0.3s ease-out' }}>
          <style>{`
            @keyframes slideInBottom { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
          {snackbar.message}
        </div>
      )}

      {detailAppt && (() => {
        const client = clients.find(c => c.idcliente === detailAppt.clientId);
        const apptDate = detailAppt.date ? new Date(detailAppt.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
        
        return (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              {/* Premium Header */}
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)', padding: '2.5rem 2rem 2rem', color: '#fff', position: 'relative' }}>
                <button onClick={closeDetail} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ pointerEvents: 'none' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.3rem 0.8rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Expediente de Cita
                    </span>
                    <span style={{ 
                      padding: '0.3rem 0.8rem', 
                      borderRadius: '10px', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      background: detailAppt.status === 'Confirmada' ? 'rgba(16, 185, 129, 0.3)' : detailAppt.status === 'Cancelada' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      {detailAppt.status}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {client?.nombre || 'Paciente'} {client?.apellido || ''}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, fontSize: '0.85rem', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Cédula: {client?.cedula || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="modal-scroll-area" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', background: 'var(--surface)' }}>
                {/* Horizontal Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fecha Programada</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {apptDate}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bloque Horario</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {detailAppt.time} — {getEndTime(detailAppt)}
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👨‍⚕️</div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Profesional Asignado</label>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>{detailAppt.doctor}</div>
                  </div>
                </div>

                {/* Services List Card */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>Servicios Contratados</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                      {detailAppt.services?.length || 0} ITEMS
                    </span>
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {detailAppt.services?.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i === (detailAppt.services.length - 1) ? 0 : '0.75rem', borderBottom: i === (detailAppt.services.length - 1) ? 'none' : '1px dashed var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-2)' }}>{s.nombre}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 600 }}>{s.duracion} min</div>
                      </div>
                    ))}
                    {(!detailAppt.services || detailAppt.services.length === 0) && (
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-4)', textAlign: 'center', padding: '1rem' }}>No hay servicios específicos</div>
                    )}
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)' }}>DURACIÓN TOTAL</span>
                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>{detailAppt.duration} MINUTOS</span>
                  </div>
                </div>

                {/* Status Selection with SearchableSelect consistency */}
                <SearchableSelect 
                  label="Cambiar Estado de la Cita"
                  placeholder="Elige un estado..."
                  icon="🏷️"
                  options={[
                    { value: 'Confirmada', label: '✅ Confirmada' },
                    { value: 'En Espera', label: '⏳ En Espera' },
                    { value: 'Pendiente', label: '🕒 Pendiente' },
                    { value: 'Cancelada', label: '❌ Cancelada' }
                  ]}
                  value={editStatus}
                  onChange={val => setEditStatus(val)}
                />
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--surface)' }}>
                <button className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', border: '1.5px solid var(--danger)', color: 'var(--danger)', height: '52px' }} onClick={handleDeleteFromDetail}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  Eliminar
                </button>
                <button className="btn btn-primary" style={{ flex: 2, borderRadius: '16px', height: '52px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 24px var(--primary-light)' }} onClick={saveStatus}>
                  Actualizar Cita
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Service Selection Overlay */}
      {showServiceMenu && (
        <div className="modal-overlay" onClick={() => setShowServiceMenu(false)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            {/* Professional Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '2rem 2rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '14px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>Catálogo de Servicios</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600 }}>Selecciona todos los servicios para esta cita.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowServiceMenu(false)} style={{ borderRadius: '12px', width: '38px', height: '38px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            
            <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <SuggestionInput 
                  placeholder="¿Qué servicio buscas?" 
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  style={{ borderRadius: '16px', height: '52px', paddingLeft: '3rem', border: '1.5px solid var(--border-strong)', background: 'var(--surface)', fontWeight: 600 }}
                  spellCheck={true} 
                  lang="es" 
                  suggestions={[...new Set([...services.map(s => s.nombre), ...commonTerms])]} 
                />
                <svg style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>

            <div style={{ padding: '1.75rem 2rem', maxHeight: '420px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', background: 'var(--surface)' }}>
              {services.filter(s => s.nombre.toLowerCase().includes(serviceSearch.toLowerCase())).map(s => {
                const isSelected = form.serviceIds.includes(s.idservicios);
                return (
                  <div 
                    key={s.idservicios}
                    onClick={() => {
                      const newIds = isSelected 
                        ? form.serviceIds.filter(id => id !== s.idservicios)
                        : [...form.serviceIds, s.idservicios];
                      setForm({ ...form, serviceIds: newIds });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.15rem',
                      borderRadius: '20px',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 8px 16px rgba(37, 99, 235, 0.12)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isSelected && <div style={{ position: 'absolute', top: 0, right: 0, width: '32px', height: '32px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 0 12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.925rem', fontWeight: 900, color: isSelected ? 'var(--primary-deep)' : 'var(--text)', marginBottom: '0.2rem' }}>{s.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--primary)' : 'var(--text-4)', fontWeight: 700 }}>{s.duracion} min — ${parseFloat(s.precio).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '1.5rem 2rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 28px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-2)' }}>{form.serviceIds.length} SERVICIOS ELEGIDOS</span>
              </div>
              <button className="btn btn-primary" onClick={() => setShowServiceMenu(false)} style={{ borderRadius: '16px', padding: '0.75rem 2rem', fontWeight: 800, boxShadow: '0 8px 20px var(--primary-light)' }}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
