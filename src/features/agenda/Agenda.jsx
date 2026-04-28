import React, { useState, useRef, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../services/googleCalendar';
import './Agenda.css';

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
    <div className="input-group searchable-select-wrapper" ref={wrapperRef}>
      <label className="searchable-select-label">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
      >
        <span className="searchable-select-icon">{icon}</span>
        <div className={`searchable-select-text ${selectedOpt ? 'selected' : 'placeholder'}`}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="3" className={`searchable-select-arrow ${isOpen ? 'open' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
      </div>

      {isOpen && (
        <div className="animate-scale-in searchable-select-dropdown">
          <div className="searchable-select-search-container">
            <div className="searchable-select-search-wrapper">
                <SuggestionInput 
                  autoFocus
                  placeholder="Escribe para buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="searchable-select-search-input"
                  spellCheck={true} 
                  lang="es" 
                  suggestions={[...new Set([...options.map(o => o.label), ...commonTerms])]} 
                />
              <svg className="searchable-select-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
          <div className="searchable-select-options">
            {filtered.length > 0 ? filtered.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                className={`searchable-select-option ${String(value) === String(opt.value) ? 'selected' : ''}`}
              >
                {opt.label}
                {String(value) === String(opt.value) && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            )) : (
              <div className="searchable-select-no-results">
                <span>🔍</span>
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
      top: top + 1,
      minHeight: height - 2,
      height: height - 2,
      background: `linear-gradient(135deg, ${baseColor}ee, ${baseColor}cc)`,
      boxShadow: `0 8px 20px ${baseColor}22`,
      borderLeft: `6px solid ${borderColor}`,
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
      <div className="calendar-day-column">
        {HOURS.map(h => (
          <div
            key={h}
            onDragOver={onDragOver}
            onDrop={e => onDropCell(e, dateStr, h)}
            onClick={() => openCreate(dateStr, toTimeStr(h))}
            className="calendar-slot"
          />
        ))}
        {dayAppts.map(appt => {
          const client = clients.find(c => c.idcliente === appt.clientId);
          const serviceNames = appt.services?.map(s => s.nombre).join(', ') || 'Consulta General';
          return (
            <div
              key={appt.id}
              className="calendar-appt"
              style={apptStyle(appt)}
              draggable
              onDragStart={e => onDragStart(e, appt)}
              onDragEnd={onDragEnd}
              onClick={e => openDetail(appt, e)}
              onMouseEnter={e => { 
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredAppt({ ...appt, client, serviceNames, endTime: getEndTime(appt) });
                setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setHoveredAppt(null)}
            >
              <div className="calendar-appt-content">
                <div className="calendar-appt-title">
                  {client?.nombre || 'Paciente'} {client?.apellido || ''}
                </div>
                <button 
                  className="calendar-appt-edit-btn"
                  onClick={(e) => { e.stopPropagation(); startEdit(appt); }}
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
    <div className="calendar-view-container">
      <div className="calendar-time-gutter">
        {HOURS.map(h => (
          <div key={h} className="calendar-time-label">
            {h === 12 ? (
              <>12:00 <span className="calendar-time-ampm">PM</span></>
            ) : h > 12 ? (
              <>{String(h - 12).padStart(2, '0')}:00 <span className="calendar-time-ampm">PM</span></>
            ) : (
              <>{String(h).padStart(2, '0')}:00 <span className="calendar-time-ampm">AM</span></>
            )}
          </div>
        ))}
      </div>
      <DayColumn dateStr={toDateStr(pivot)} />
    </div>
  );

  const ViewWeek = () => (
    <div className="calendar-view-container calendar-view-week">
      <div className="week-view-header">
        <div className="week-gutter-spacer" />
        {weekDays.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
          return (
            <div key={i} className="week-header-cell" onClick={() => { setPivot(d); setView('day'); }}>
              <div className="week-day-name">{DAY_LABELS[i]}</div>
              <div className={`week-day-number ${isToday ? 'today' : ''}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="week-body">
        <div className="calendar-time-gutter">
          {HOURS.map(h => (
            <div key={h} className="calendar-time-label">
              {h === 12 ? (
                <>12:00 <span className="calendar-time-ampm">PM</span></>
              ) : h > 12 ? (
                <>{String(h - 12).padStart(2, '0')}:00 <span className="calendar-time-ampm">PM</span></>
              ) : (
                <>{String(h).padStart(2, '0')}:00 <span className="calendar-time-ampm">AM</span></>
              )}
            </div>
          ))}
        </div>
        {weekDays.map((d, i) => (
          <DayColumn key={i} dateStr={toDateStr(d)} />
        ))}
      </div>
    </div>
  );

  const ViewMonth = () => {
    const grid = buildMonthGrid(pivot);
    const pivotMonth = pivot.getMonth();
    return (
      <div className="calendar-view-container" style={{ flexDirection: 'column', overflow: 'hidden' }}>
        <div className="month-view-grid-header">
          {DAY_LABELS.map(d => (
            <div key={d} className="month-day-header">{d}</div>
          ))}
        </div>
        <div className="month-days-container">
          {grid.map((day, idx) => {
            if (!day) return <div key={idx} className="month-day-cell other-month" />;
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
                className={`month-day-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
              >
                <div className={`month-day-number ${isToday ? 'today' : ''}`}>
                  {day.getDate()}
                </div>
                {dayAppts.slice(0, 3).map(a => {
                  const client = clients.find(c => c.idcliente === a.clientId);
                  const serviceNames = a.services?.map(s => s.nombre).join(', ') || 'Consulta General';
                  const apptColor = a.services?.[0]?.color || 'var(--primary)';
                  return (
                    <div 
                      key={a.id} 
                      className="month-appt"
                      style={{ background: apptColor }}
                      onMouseEnter={e => { 
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredAppt({ ...a, client, serviceNames, endTime: getEndTime(a) });
                        setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredAppt(null)}
                    >
                      <span className="month-appt-text">
                        {client?.nombre || 'Paciente'} {client?.apellido || ''}
                      </span>
                      <button 
                        className="month-appt-edit"
                        onClick={(e) => { e.stopPropagation(); startEdit(a); }}
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
    <div className="agenda-page">
      <div className="agenda-main-content">
        <div className="agenda-header-card">
          <div className="agenda-topbar-section">
            <button className="btn btn-outline btn-today" onClick={goToday}>Hoy</button>
            <div className="btn-group">
              <button className="btn btn-icon" onClick={goPrev}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="btn btn-icon" onClick={goNext}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <h2 className="agenda-header-title">{headerTitle}</h2>
          </div>

          <div className="agenda-topbar-section">
            <button className="btn btn-outline btn-hours-config" onClick={openHoursModal}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Jornada: {workHours.start}:00 {workHours.start >= 12 ? 'PM' : 'AM'} — {workHours.end === 12 ? '12:00 PM' : workHours.end > 12 ? `${workHours.end - 12}:00 PM` : `${workHours.end}:00 AM`}
            </button>

            <div className="view-selector">
              {[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([v, label]) => (
                <button 
                  key={v} 
                  onClick={() => setView(v)} 
                  className={`view-selector-btn ${view === v ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {user.role !== 'especialista' && (
              <button 
                className={`btn btn-outline btn-filter-specialist ${selectedSpecialistId ? 'filter-active' : ''}`}
                onClick={() => setShowFilterModal(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {selectedSpecialistId ? specialists.find(s => String(s.idusuario) === String(selectedSpecialistId))?.nombre || 'Filtrado' : 'Todos los Especialistas'}
              </button>
            )}

            <button className="btn btn-primary btn-add-appt" onClick={() => openCreate()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Agendar Cita
            </button>
          </div>
        </div>

        <div className="calendar-grid-wrapper">
          {loading ? (
            <div className="skeleton-view-container">
              <div className="skeleton skeleton-button skeleton-btn-wrapper"></div>
              <div className="layout-flex-gap-1">
                <div className="skeleton skeleton-time-col"></div>
                <div className="layout-flex-gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="skeleton skeleton-day-col" style={{ opacity: 0.7 - (i * 0.05) }}></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="calendar-grid">
              {view === 'day' && <ViewDay />}
              {view === 'week' && <ViewWeek />}
              {view === 'month' && <ViewMonth />}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Hours Modal */}
      {showHoursModal && (
        <div className="appt-modal-overlay" onClick={() => setShowHoursModal(false)}>
          <div className="appt-modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="appt-modal-header">
              <div className="agenda-topbar-section">
                <div className="modal-icon-wrapper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <h3 className="modal-title-main">Jornada Laboral</h3>
                  <p className="modal-subtitle">Define el horario de atención.</p>
                </div>
              </div>
              <button className="appt-modal-close" onClick={() => setShowHoursModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="appt-modal-form">
              <div className="appt-modal-row">
                <div className="input-group">
                  <label className="searchable-select-label">Apertura</label>
                  <select 
                    className="input-field config-modal-select"
                    value={tempWorkHours.start} 
                    onChange={e => setTempWorkHours(prev => ({ ...prev, start: parseInt(e.target.value) }))}
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
                  <label className="searchable-select-label">Cierre</label>
                  <select 
                    className="input-field config-modal-select"
                    value={tempWorkHours.end} 
                    onChange={e => setTempWorkHours(prev => ({ ...prev, end: parseInt(e.target.value) }))}
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

              <div className="modal-info-box">
                <div className="modal-info-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <p className="modal-info-text primary">
                  Los cambios afectarán la visualización de la agenda. Valida que no existan citas fuera del nuevo horario.
                </p>
              </div>

              <div className="appt-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowHoursModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveWorkHours}>
                  Guardar Jornada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specialist Filter Modal */}
      {showFilterModal && (
        <div className="appt-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="appt-modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="appt-modal-header">
              <div className="agenda-topbar-section">
                <div className="modal-icon-wrapper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h3 className="modal-title-main">Filtrar Especialista</h3>
                  <p className="modal-subtitle">Visualiza solo las citas de un profesional.</p>
                </div>
              </div>
              <button className="appt-modal-close" onClick={() => setShowFilterModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="appt-modal-form">
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

              <div className="modal-info-box">
                <div className="margin-top-xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <p className="modal-info-text">
                  Al seleccionar un profesional, la agenda solo mostrará sus compromisos asignados para evitar confusiones visuales.
                </p>
              </div>

              <div className="appt-modal-footer">
                <button type="button" className="btn btn-outline btn-modal-action" onClick={() => setShowFilterModal(false)}>Cerrar</button>
                {selectedSpecialistId && (
                  <button type="button" className="btn btn-primary btn-modal-action-bold" onClick={() => { setSelectedSpecialistId(null); setShowFilterModal(false); }}>
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
        <div className="appt-modal-overlay high-z" onClick={() => setConflictModal({ show: false, message: '', details: null })}>
          <div className="appt-modal animate-scale-in modal-conflict" onClick={e => e.stopPropagation()}>
            <div className="conflict-modal-body">
              <div className="conflict-modal-icon">
                ⚠️
              </div>
              <div>
                <h3 className="conflict-modal-title">{conflictModal.message}</h3>
                <p className="conflict-modal-text">
                  No es posible agendar en este momento. Ya existe una cita programada:
                </p>
              </div>

              {conflictModal.details && (
                <div className="conflict-modal-card">
                  <div className="conflict-modal-row">
                    <span className="conflict-modal-label">Paciente</span>
                    <span className="conflict-modal-value">{conflictModal.details.clientName}</span>
                  </div>
                  <div className="conflict-modal-row">
                    <span className="conflict-modal-label">Horario</span>
                    <span className="conflict-modal-time">
                      {conflictModal.details.startTime} — {conflictModal.details.endTime}
                    </span>
                  </div>
                </div>
              )}

              <p className="conflict-modal-footer-text">
                Por favor, elige un horario diferente o cambia de profesional asignado.
              </p>

              <button 
                className="btn btn-primary btn-conflict-confirm" 
                onClick={() => setConflictModal({ show: false, message: '', details: null })}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {hoveredAppt && !detailAppt && !showModal && (
        <div 
          className="agenda-tooltip"
          style={{
            left: mousePos.x,
            top: mousePos.y
          }}
        >
          <div className="agenda-tooltip-header">
            <span className="agenda-tooltip-time">
              {hoveredAppt.time} - {hoveredAppt.endTime}
            </span>
            <span className="agenda-tooltip-status">{hoveredAppt.status}</span>
          </div>
          <div className="agenda-tooltip-name">
            {hoveredAppt.client?.nombre || 'Desconocido'} {hoveredAppt.client?.apellido || ''}
          </div>
          <div className="agenda-tooltip-info">
            <strong className="text-color-2">Servicio(s):</strong> {hoveredAppt.serviceNames}
          </div>
          {hoveredAppt.doctor && (
            <div className="agenda-tooltip-info">
              <strong className="text-color-2">Especialista:</strong> {hoveredAppt.doctor}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="appt-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="appt-modal modal-appointment-form">
            <div className="appt-modal-header">
              <div className="agenda-topbar-section">
                <div className="modal-icon-wrapper padded-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <h3 className="modal-title-main font-lg">{editId ? 'Gestión de Cita' : 'Nueva Cita'}</h3>
                  <p className="modal-subtitle">Agenda servicios para tus pacientes.</p>
                </div>
              </div>
              <button className="appt-modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="appt-modal-form">
              <div className="modal-scroll-area gap-md">
                <SearchableSelect 
                  label="Paciente Responsable"
                  placeholder="Busca un paciente..."
                  icon="👤"
                  options={clients.map(c => ({ value: c.idcliente, label: `${c.nombre} ${c.apellido} (${c.cedula || 'N/A'})` }))}
                  value={form.clientId}
                  onChange={val => setForm({ ...form, clientId: val })}
                />

                <div className="appt-modal-row">
                  <div className="input-group">
                    <label className="searchable-select-label">Selección de Servicios</label>
                    <button 
                      type="button" 
                      className={`btn btn-outline service-selection-trigger ${form.serviceIds.length > 0 ? 'active' : 'inactive'}`}
                      onClick={() => setShowServiceMenu(true)}
                    >
                      <div className="agenda-topbar-section">
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
                  <div className="service-tags-container">
                    {form.serviceIds.map(sid => {
                      const s = services.find(sv => sv.idservicios === sid);
                      return (
                        <div key={sid} className="service-tag">
                          {s?.nombre}
                          <span className="service-tag-remove" onClick={() => setForm({ ...form, serviceIds: form.serviceIds.filter(id => id !== sid) })}>×</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="appt-modal-info-grid">
                  <div className="input-group">
                    <label className="searchable-select-label">Fecha de Cita</label>
                    <input type="date" className="input-field input-rounded-lg" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="searchable-select-label">Hora</label>
                    <input type="time" className="input-field input-rounded-lg" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="appt-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <div className="agenda-topbar-section centered">
                      <div className="spinner-sm spinner"></div>
                      Procesando...
                    </div>
                  ) : (editId ? 'Guardar Cambios' : 'Agendar Cita')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Snackbar */}
      <div className={`snackbar ${snackbar.show ? 'visible' : ''}`}>
        <div className="snackbar-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        {snackbar.msg}
      </div>

      {detailAppt && (() => {
        const client = clients.find(c => c.idcliente === detailAppt.clientId);
        const apptDate = detailAppt.date ? new Date(detailAppt.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
        
        return (
          <div className="appt-modal-overlay" onClick={closeDetail}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              {/* Premium Header */}
              <div className="appt-details-header">
                <button className="appt-details-close" onClick={closeDetail}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                
                <div className="appt-details-header-content">
                  <div className="agenda-topbar-section">
                    <span className="appt-details-tag">
                      Expediente de Cita
                    </span>
                    <span className={`status-badge ${detailAppt.status.toLowerCase().replace(' ', '-')}`}>
                      {detailAppt.status}
                    </span>
                  </div>
                  <h2 className="appt-details-title">
                    {client?.nombre || 'Paciente'} {client?.apellido || ''}
                  </h2>
                  <div className="appt-details-subtitle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Cédula: {client?.cedula || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="modal-scroll-area padded-lg gap-md">
                {/* Horizontal Info Grid */}
                <div className="appt-details-grid">
                  <div className="input-group">
                    <label className="appt-details-label">Fecha Programada</label>
                    <div className="appt-details-value">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {apptDate}
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="appt-details-label">Bloque Horario</label>
                    <div className="appt-details-value">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {detailAppt.time} — {getEndTime(detailAppt)}
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="appt-details-pro-card">
                  <div className="appt-details-pro-icon">👨‍⚕️</div>
                  <div className="appt-details-pro-info">
                    <label className="appt-details-label">Profesional Asignado</label>
                    <div className="appt-details-pro-name">{detailAppt.doctor}</div>
                  </div>
                </div>

                {/* Services List Card */}
                <div className="appt-details-services-container">
                  <div className="appt-details-services-header">
                    <span className="modal-subtitle">Servicios Contratados</span>
                    <span className="service-selection-info">
                      {detailAppt.services?.length || 0} ITEMS
                    </span>
                  </div>
                  <div className="appt-details-services-list">
                    {detailAppt.services?.map((s, i) => (
                      <div key={i} className="appt-details-service-item">
                        <div className="appt-details-service-name">{s.nombre}</div>
                        <div className="appt-details-service-duration">{s.duracion} min</div>
                      </div>
                    ))}
                    {(!detailAppt.services || detailAppt.services.length === 0) && (
                      <div className="modal-subtitle centered padded">No hay servicios específicos</div>
                    )}
                  </div>
                  <div className="appt-details-services-footer">
                    <span className="appt-details-service-name">DURACIÓN TOTAL</span>
                    <span className="appt-details-service-duration font-lg primary">{detailAppt.duration} MINUTOS</span>
                  </div>
                </div>

                {/* Status Selection */}
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

              <div className="appt-modal-footer padded-lg no-border">
                <button className="btn btn-outline btn-danger-outline" onClick={handleDeleteFromDetail}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  Eliminar
                </button>
                <button className="btn btn-primary" onClick={saveStatus}>
                  Actualizar Cita
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Service Selection Overlay */}
      {showServiceMenu && (
        <div className="appt-modal-overlay" onClick={() => setShowServiceMenu(false)}>
          <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
            <div className="service-menu-header">
              <div className="agenda-topbar-section">
                <div className="modal-icon-wrapper padded-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                </div>
                <div>
                  <h3 className="modal-title-main font-lg">Catálogo de Servicios</h3>
                  <p className="modal-subtitle">Selecciona todos los servicios para esta cita.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowServiceMenu(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            
            <div className="service-menu-search-container">
              <div className="service-menu-search-wrapper">
                <SuggestionInput 
                  placeholder="¿Qué servicio buscas?" 
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  className="suggestion-search-input"
                  spellCheck={true} 
                  lang="es" 
                  suggestions={[...new Set([...services.map(s => s.nombre), ...commonTerms])]} 
                />
                <svg className="service-menu-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>

            <div className="service-menu-content">
              {services.filter(s => s.nombre.toLowerCase().includes(serviceSearch.toLowerCase())).map(s => {
                const isSelected = form.serviceIds.includes(s.idservicios);
                return (
                  <div 
                    key={s.idservicios}
                    className={`service-selection-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      const newIds = isSelected 
                        ? form.serviceIds.filter(id => id !== s.idservicios)
                        : [...form.serviceIds, s.idservicios];
                      setForm({ ...form, serviceIds: newIds });
                    }}
                  >
                    {isSelected && (
                      <div className="service-selection-check">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    <div className="service-card-info">
                      <div className="service-card-name">{s.nombre}</div>
                      <div className="service-card-meta">{s.duracion} min — ${parseFloat(s.precio).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="service-menu-footer">
              <div className="appt-details-footer-info">
                <div className="appt-details-footer-dot"></div>
                <span>{form.serviceIds.length} SERVICIOS ELEGIDOS</span>
              </div>
              <button className="btn btn-primary btn-primary-lg" onClick={() => setShowServiceMenu(false)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
