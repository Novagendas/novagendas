import React, { useState, useRef, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import SelectableInput from '../../components/inputs/SelectableInput';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, isCalendarConnected, clearCalendarAuth, connectCalendar } from '../../services/googleCalendar';
import {
  addDays,
  startOf,
  toDateStr,
  toTimeStr,
  timeToDec,
} from '../../utils/dateHelpers';
import {
  DAY_LABELS,
  CALENDAR_CONFIG,
  STATUS_COLORS,
  APPOINTMENT_STATUSES,
} from '../../utils/constants';
import './Agenda.css';

const { SLOT_HEIGHT: SLOT_H, MIN_HOUR: START_H_MIN, MAX_HOUR: END_H_MAX } = CALENDAR_CONFIG;
const statusColor = STATUS_COLORS;

/* ─── Day view column layout (overlap detection) ─────────── */
const MAX_VISIBLE_COLS = 5;

function computeColumnLayout(appts) {
  if (!appts.length) return [];

  const withTimes = appts.map(a => {
    const [h, m] = a.time.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + Math.max(a.duration || 60, 1);
    return { ...a, startMin, endMin };
  }).sort((a, b) => a.startMin - b.startMin);

  const result = [];
  let groupId = 0;
  let i = 0;

  while (i < withTimes.length) {
    let groupEnd = withTimes[i].endMin;
    let j = i;
    while (j < withTimes.length && withTimes[j].startMin < groupEnd) {
      groupEnd = Math.max(groupEnd, withTimes[j].endMin);
      j++;
    }

    const group = withTimes.slice(i, j);
    const gStartTime = group[0].time;
    const cols = [];
    const groupItems = group.map(appt => {
      let col = cols.findIndex(end => end <= appt.startMin);
      if (col === -1) col = cols.length;
      cols[col] = appt.endMin;
      return { ...appt, col, groupId, groupStartTime: gStartTime, groupEndMin: groupEnd };
    });

    result.push(...groupItems.map(a => ({ ...a, totalCols: cols.length })));
    groupId++;
    i = j;
  }

  return result;
}

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

export default function Agenda({ user, tenant }) {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialists, setSpecialists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [clientAbonos, setClientAbonos] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
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

  /* ------ Google Calendar connection state ------ */
  const [calConnected, setCalConnected] = useState(false);
  const [showGcalDisconnectModal, setShowGcalDisconnectModal] = useState(false);
  const [showGcalConnectModal, setShowGcalConnectModal] = useState(false);

  useEffect(() => {
    isCalendarConnected(tenant.id).then(setCalConnected);
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      setCalConnected(true);
      showSnack('¡Google Calendar conectado correctamente!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('google_error')) {
      showSnack('Error al conectar Google Calendar', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCalSync = async () => {
    if (calConnected) {
      setShowGcalDisconnectModal(true);
      return;
    }
    setShowGcalConnectModal(true);
  };

  const confirmConnectGcal = () => {
    setShowGcalConnectModal(false);
    connectCalendar(tenant.id);
  };

  const confirmDisconnectGcal = async () => {
    await clearCalendarAuth(tenant.id);
    setCalConnected(false);
    setShowGcalDisconnectModal(false);
    showSnack('Desconectado de Google Calendar');
  };

  const [hoveredAppt, setHoveredAppt] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* ------ Modal state ------ */
  const [showModal, setShowModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [tempWorkHours, setTempWorkHours] = useState({ start: 6, end: 21 });
  const [editId, setEditId] = useState(null);
  const [groupPages, setGroupPages] = useState({});
  const emptyForm = () => ({
    clientId: '',
    serviceIds: [],
    specialistId: '',
    date: '',
    time: '09:00',
    gcalEventId: null,
    locationId: '',
    additionalClientIds: [],
    isGroup: false,
    productsUsed: [],
    selectedAbonoId: null,
    abonoToApply: 0,
    totalAbonoApplied: 0,
    status: 'En Espera',
  });
  const [form, setForm] = useState(emptyForm());
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

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    try {
      const { data: cliData } = await supabase.from('cliente').select('*').eq('idnegocios', tenant.id).is('deleted_at', null);
      const { data: svcData } = await supabase.from('servicios').select('*').eq('idnegocios', tenant.id).is('deleted_at', null);
      const { data: locData } = await supabase.from('ubicacion').select('*').eq('idnegocios', tenant.id).is('deleted_at', null).order('nombre');
      setLocations(locData || []);

      const { data: prodData } = await supabase.from('producto').select('*').eq('idnegocios', tenant.id).is('deleted_at', null).gt('cantidad', 0).order('nombre');
      setProducts(prodData || []);
      
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
          ),
          detallecitagrupal ( idcliente ),
          citaproducto ( idproducto, cantidad ),
          abonoaplicacion ( idabono, monto_aplicado )
        `)
        .eq('idnegocios', tenant.id)
        .is('deleted_at', null);

      if (!error && apptData) {
        const mapped = apptData.map(a => {
          const startStr = a.fechahorainicio || '';
          
          if (!startStr) return null;

          // Parse to local date object
          const startD = new Date(startStr.replace(' ', 'T'));

          const apptServices = a.citaservicios?.map(cs => cs.servicios).filter(Boolean) || [];
          const totalDuration = apptServices.reduce((sum, s) => sum + (s.duracion || 0), 0) || 30;

          const totalAbono = (a.abonoaplicacion || []).reduce((sum, x) => sum + Number(x.monto_aplicado || 0), 0);
          const totalPrice = apptServices.reduce((sum, s) => sum + Number(s.precio || 0), 0);
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
            locationId: a.idubicacion || null,
            isGroup: !!a.escitagrupal,
            additionalClientIds: (a.detallecitagrupal || []).map(d => d.idcliente).filter(Boolean),
            productsUsed: (a.citaproducto || []).map(p => ({ idproducto: p.idproducto, cantidad: Number(p.cantidad) })),
            totalAbono,
            totalPrice,
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

  useEffect(() => {
    const clear = () => setHoveredAppt(null);
    window.addEventListener('scroll', clear, true);
    return () => window.removeEventListener('scroll', clear, true);
  }, []);

  useEffect(() => {
    if (!form.clientId || !tenant?.id) { setClientAbonos([]); return; }
    supabase
      .from('abono')
      .select('*')
      .eq('idcliente', parseInt(form.clientId))
      .eq('idnegocios', tenant.id)
      .gt('saldo_disponible', 0)
      .order('idabono', { ascending: false })
      .then(({ data }) => setClientAbonos(data || []));
  }, [form.clientId, tenant?.id]);

  const openDetail = (appt, e) => { e.stopPropagation(); startEdit(appt); setHoveredAppt(null); };

  const handleDeleteAppointment = async () => {
    if (!editId) return;
    const appt = appointments.find(a => a.id === editId);
    if (!appt) return;
    try {
      const gcalEventId = appt.gcalEventId;
      const clientName = clients.find(c => c.idcliente === appt.clientId)?.nombre || 'Paciente';

      const { error } = await supabase.from('cita')
        .update({ deleted_at: new Date().toISOString() })
        .eq('idcita', editId);
      if (error) throw error;

      await insertLog({
        accion: 'DELETE',
        entidad: 'Cita',
        descripcion: `Se eliminó la cita de ${clientName}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });

      if (gcalEventId) {
        try {
          await deleteCalendarEvent(tenant.id, gcalEventId);
        } catch (calErr) {
          console.warn('No se pudo eliminar el evento de Google Calendar:', calErr.message);
        }
      }

      fetchData();
      setShowModal(false);
      setEditId(null);
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
    if (view === 'day') return pivot.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
    if (view === 'week') return `${weekDays[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`;
    if (view === 'month') return pivot.toLocaleDateString('es-CO', opts);
    return '';
  })();

  const isPastSlot = (dateStr, h) => {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(`${dateStr}T${String(h).padStart(2, '0')}:00:00`) < cutoff;
  };

  const openCreate = (date = '', time = '') => {
    if (date && time) {
      const slotTime = new Date(`${date}T${time}:00`);
      if (slotTime < new Date(Date.now() - 60 * 60 * 1000)) {
        showSnack('No se pueden agendar citas en el pasado', 'error');
        return;
      }
    }
    setEditId(null);
    setForm({
      ...emptyForm(),
      specialistId: specialists.length ? specialists[0].idusuario : '',
      date: date || todayStr,
      time: time || '09:00',
      locationId: locations.length === 1 ? String(locations[0].idubicacion) : '',
    });
    setShowModal(true);
  };

  const startEdit = (appt) => {
    setEditId(appt.id);
    setForm({
      ...emptyForm(),
      clientId: appt.clientId,
      serviceIds: appt.serviceIds || [],
      specialistId: appt.specialistId || '',
      date: appt.date,
      time: appt.time,
      gcalEventId: appt.gcalEventId || null,
      locationId: appt.locationId ? String(appt.locationId) : '',
      isGroup: !!appt.isGroup,
      additionalClientIds: appt.additionalClientIds || [],
      productsUsed: appt.productsUsed || [],
      abonoToApply: 0,
      totalAbonoApplied: appt.totalAbono || 0,
      status: appt.status || 'En Espera',
    });
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
        idservicio: form.serviceIds[0] || null,
        idusuario: form.specialistId ? parseInt(form.specialistId) : null,
        fechahorainicio: startStr,
        fechahorafin: formattedEnd,
        idestadocita: 2,
        idtipocita: 1,
        idnegocios: tenant.id,
        idubicacion: form.locationId ? parseInt(form.locationId) : null,
        escitagrupal: form.isGroup || form.additionalClientIds.length > 0,
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
      const STATUS_ID_MAP = { 'Confirmada': 1, 'En Espera': 2, 'Cancelada': 3, 'Completada': 4, 'Pendiente': 2 };

      if (editId) {
        const editPayload = { ...payload, idestadocita: STATUS_ID_MAP[form.status] || 2 };
        const { error } = await supabase.from('cita').update(editPayload).eq('idcita', editId);
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

      // Sync additional clients (group cita)
      await supabase.from('detallecitagrupal').delete().eq('idcita', appointmentId);
      if (form.additionalClientIds.length > 0) {
        const groupEntries = form.additionalClientIds.map(cid => ({
          idcita: appointmentId,
          idcliente: cid
        }));
        await supabase.from('detallecitagrupal').insert(groupEntries);
      }

      // Sync product consumption
      if (form.productsUsed.length > 0) {
        await supabase.from('citaproducto').delete().eq('idcita', appointmentId);
        const productEntries = form.productsUsed.map(u => ({
          idcita: appointmentId,
          idproducto: u.idproducto,
          cantidad: u.cantidad,
        }));
        await supabase.from('citaproducto').insert(productEntries);
        // Decrement stock (only on create, not on edit to avoid double-decrement)
        if (!editId) {
          for (const u of form.productsUsed) {
            const prod = products.find(p => p.idproducto === u.idproducto);
            if (prod) {
              const newQty = Math.max(0, Number(prod.cantidad) - u.cantidad);
              await supabase.from('producto').update({ cantidad: newQty }).eq('idproducto', u.idproducto);
            }
          }
        }
      }
      
      // ── Aplicar abono si se seleccionó (solo al crear) ──
      if (!editId && form.selectedAbonoId && form.abonoToApply > 0) {
        const abono = clientAbonos.find(a => a.idabono === form.selectedAbonoId);
        if (abono) {
          const montoAplicar = Math.min(form.abonoToApply, Number(abono.saldo_disponible));
          const saldoAnterior = Number(abono.saldo_disponible);
          const saldoNuevo = saldoAnterior - montoAplicar;
          await supabase.from('abonoaplicacion').insert({
            idabono: form.selectedAbonoId,
            idcita: appointmentId,
            monto_aplicado: montoAplicar,
          });
          await supabase.from('abono')
            .update({ saldo_disponible: saldoNuevo })
            .eq('idabono', form.selectedAbonoId);
          const client = clients.find(c => c.idcliente === parseInt(form.clientId));
          await insertLog({
            accion: 'ABONO',
            entidad: 'Abono',
            descripcion: `Cita #${appointmentId} — Abono #${form.selectedAbonoId} aplicado a ${client?.nombre || 'Paciente'} ${client?.apellido || ''}: $${montoAplicar.toLocaleString('es-CO')} descontados. Saldo anterior: $${saldoAnterior.toLocaleString('es-CO')} → Saldo restante: $${saldoNuevo.toLocaleString('es-CO')}`,
            idUsuario: user.idusuario || user.id,
            idNegocios: tenant.id,
          });
        }
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
          `📅 CITA MÉDICA — ${tenant?.name || 'Novagendas'}`,
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
          `Cita gestionada por Novagendas`,
          `Favor llegar 15 minutos antes de la cita.`,
        ].filter(l => l !== null).join('\n');

        const calArgs = { summary: `🗓️ ${client?.nombre || 'Paciente'} ${client?.apellido || ''} — ${serviceNames}`, description, startDateTime: startStr, endDateTime: formattedEnd, attendeeEmails: attendees };

        if (editId && form.gcalEventId) {
          // Actualizar evento existente
          await updateCalendarEvent(tenant.id, form.gcalEventId, calArgs);
        } else if (!editId) {
          // Crear nuevo evento y guardar su ID en la cita
          const newEventId = await createCalendarEvent(tenant.id, calArgs);
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
      showSnack(`⚠️ Imposible agendar: Demasiados conflictos después de las ${dropTime} con ${conflictClient?.nombre || 'otro paciente'}`, 'error');
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


  const DayColumn = ({ dateStr, maxCols = MAX_VISIBLE_COLS }) => {
    const rawAppts = appointments.filter(a => {
      const isCorrectDate = a.date === dateStr && a.status !== 'Cancelada';
      const isCorrectSpec = selectedSpecialistId ? String(a.specialistId) === String(selectedSpecialistId) : true;
      const isCorrectLoc = selectedLocationId ? String(a.locationId) === String(selectedLocationId) : true;
      return isCorrectDate && isCorrectSpec && isCorrectLoc;
    });

    const layoutAppts = computeColumnLayout(rawAppts);

    // Collect groups that overflow maxCols
    const overflowGroups = {};
    layoutAppts.forEach(a => {
      if (a.totalCols > maxCols) {
        const groupKey = `${dateStr}-${a.groupStartTime}-${a.groupEndMin}`;
        if (!overflowGroups[groupKey]) {
          overflowGroups[groupKey] = {
            totalCols: a.totalCols,
            groupEndMin: a.groupEndMin,
            page: groupPages[groupKey] || 0,
          };
        }
      }
    });

    const setGroupPage = (groupKey, page) => setGroupPages(prev => ({ ...prev, [groupKey]: page }));

    // Filter & assign display columns
    const displayAppts = layoutAppts.flatMap(appt => {
      if (appt.totalCols <= maxCols) {
        return [{ ...appt, displayCol: appt.col, displayTotalCols: appt.totalCols }];
      }
      const groupKey = `${dateStr}-${appt.groupStartTime}-${appt.groupEndMin}`;
      const page = groupPages[groupKey] || 0;
      const visStart = page * maxCols;
      const visEnd = visStart + maxCols;
      if (appt.col < visStart || appt.col >= visEnd) return [];
      return [{
        ...appt,
        displayCol: appt.col - visStart,
        displayTotalCols: Math.min(maxCols, appt.totalCols - visStart),
      }];
    });

    return (
      <div className="calendar-day-column">
        {HOURS.map(h => {
          const past = isPastSlot(dateStr, h);
          return (
            <div
              key={h}
              onDragOver={onDragOver}
              onDrop={e => !past && onDropCell(e, dateStr, h)}
              onClick={() => !past && openCreate(dateStr, toTimeStr(h))}
              className={`calendar-slot${past ? ' calendar-slot--past' : ''}`}
            />
          );
        })}

        {/* Overflow pagination buttons */}
        {Object.entries(overflowGroups).map(([groupKey, { totalCols, groupEndMin, page }]) => {
          const maxPage = Math.ceil(totalCols / maxCols) - 1;
          const computedTop = (groupEndMin / 60 - START_H) * SLOT_H + 4;
          const maxTop = Math.max(6, HOURS.length * SLOT_H - 32);
          const top = Math.min(maxTop, Math.max(6, computedTop));
          return (
            <div key={groupKey} className="day-col-page-nav" style={{ top }} onClick={e => e.stopPropagation()}>
              <button className="day-col-page-btn" disabled={page === 0}
                onClick={e => { e.stopPropagation(); setGroupPage(groupKey, page - 1); }}>‹</button>
              <span className="day-col-page-label">{page + 1}/{maxPage + 1}</span>
              <button className="day-col-page-btn" disabled={page === maxPage}
                onClick={e => { e.stopPropagation(); setGroupPage(groupKey, page + 1); }}>›</button>
            </div>
          );
        })}

        {displayAppts.map(appt => {
          const client = clients.find(c => c.idcliente === appt.clientId);
          const serviceNames = appt.services?.map(s => s.nombre).join(', ') || 'Consulta General';
          const colW = 1 / appt.displayTotalCols;
          const leftPct = appt.displayCol * colW * 100;
          const widthPct = colW * 100;
          const colStyle = appt.displayTotalCols > 1 ? {
            left: `calc(${leftPct}% + 2px)`,
            right: 'auto',
            width: `calc(${widthPct}% - 4px)`,
          } : {};
          return (
            <div
              key={appt.id}
              className="calendar-appt"
              style={{ ...apptStyle(appt), ...colStyle }}
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
      <DayColumn dateStr={toDateStr(pivot)} maxCols={5} />
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
          <DayColumn key={i} dateStr={toDateStr(d)} maxCols={2} />
        ))}
      </div>
    </div>
  );

  const ViewMonth = () => {
    const grid = buildMonthGrid(pivot);
    const pivotMonth = pivot.getMonth();
    return (
      <div className="calendar-view-container calendar-view-month">
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
                <div className="month-day-header-row">
                  <div className={`month-day-number ${isToday ? 'today' : ''}`}>
                    {day.getDate()}
                  </div>
                  {dayAppts.length > 0 && (
                    <span className="month-day-count">{dayAppts.length} cita{dayAppts.length > 1 ? 's' : ''}</span>
                  )}
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
                {dayAppts.length > 3 && (
                  <button
                    className="month-appt-more"
                    onClick={e => { e.stopPropagation(); setPivot(day); setView('day'); }}
                  >
                    +{dayAppts.length - 3} más
                  </button>
                )}
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

            {locations.length > 0 && (
              <select
                className={`agenda-location-filter ${selectedLocationId ? 'filter-active' : ''}`}
                value={selectedLocationId || ''}
                onChange={e => setSelectedLocationId(e.target.value || null)}
                title="Filtrar por sede"
              >
                <option value="">Todas las sedes</option>
                {locations.map(l => (
                  <option key={l.idubicacion} value={l.idubicacion}>{l.nombre}</option>
                ))}
              </select>
            )}

            {(user.role === 'admin' || user.role === 'recepcion') && (
              <button
                className={`btn btn-outline btn-gcal-sync ${calConnected ? 'gcal-connected' : ''}`}
                onClick={handleCalSync}
                title={calConnected ? 'Sincronizado con Google Calendar — clic para desconectar' : 'Conectar con Google Calendar'}
              >
                {calConnected ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="#34a853" fill="#34a85318" />
                    <polyline points="7 12.5 10.5 16 17 9" stroke="#34a853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                    <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
                    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                  </svg>
                )}
                <span>{calConnected ? 'Sincronizado' : 'Google Calendar'}</span>
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
              {view === 'day' && ViewDay()}
              {view === 'week' && ViewWeek()}
              {view === 'month' && ViewMonth()}
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
              <SelectableInput 
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

      {showGcalDisconnectModal && (
        <div className="appt-modal-overlay high-z" onClick={() => setShowGcalDisconnectModal(false)}>
          <div className="appt-modal animate-scale-in modal-gcal-disconnect" onClick={e => e.stopPropagation()}>
            <div className="conflict-modal-body">
              <div className="gcal-disconnect-icon">
                <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                  <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                  <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
                  <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                </svg>
              </div>
              <h3 className="conflict-modal-title">¿Desincronizar Google Calendar?</h3>
              <p className="conflict-modal-text">
                A partir de ahora las citas <strong>solo se guardarán en Novagendas</strong>. Las citas existentes en Google Calendar no se eliminarán, pero las nuevas no se sincronizarán hasta que vuelvas a conectar tu cuenta.
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
                  className="btn btn-danger btn-modal-action-bold"
                  onClick={confirmDisconnectGcal}
                >
                  Sí, desincronizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hoveredAppt && !showModal && (
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
                {editId && (
                  <div className="cita-status-section">
                    <label className="searchable-select-label">Estado de la Cita</label>
                    <div className="cita-status-row">
                      {APPOINTMENT_STATUSES.map(s => {
                        const icons = { 'Confirmada': '✅', 'En Espera': '⏳', 'Pendiente': '🕒', 'Cancelada': '❌', 'Completada': '🎉' };
                        return (
                          <button
                            key={s}
                            type="button"
                            data-status={s.toLowerCase().replace(' ', '-')}
                            className={`cita-status-chip${form.status === s ? ' cita-status-chip--active' : ''}`}
                            onClick={() => setForm(f => ({ ...f, status: s }))}
                          >
                            <span>{icons[s]}</span> {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editId && form.totalAbonoApplied > 0 && (
                  <div className="abono-applied-banner">
                    <span className="abono-applied-icon">💳</span>
                    <div>
                      <span className="abono-applied-label">Abono aplicado a esta cita</span>
                      <span className="abono-applied-amount">${form.totalAbonoApplied.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}

                <SelectableInput
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

                  <SelectableInput 
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

                {locations.length > 0 && (
                  <SelectableInput
                    label={`Sede${locations.length > 1 ? ' *' : ''}`}
                    placeholder="Selecciona una sede..."
                    icon="📍"
                    options={locations.map(l => ({ value: l.idubicacion, label: l.nombre }))}
                    value={form.locationId}
                    onChange={val => setForm({ ...form, locationId: val })}
                  />
                )}

                <div className="cita-toggle-row">
                  <label className="cita-toggle-checkbox">
                    <input
                      type="checkbox"
                      checked={form.isGroup}
                      onChange={e => setForm({ ...form, isGroup: e.target.checked, additionalClientIds: e.target.checked ? form.additionalClientIds : [] })}
                    />
                    <span>Cita grupal</span>
                  </label>
                  <p className="cita-toggle-hint">Marca esta opción si la cita incluye varios pacientes a la vez.</p>
                </div>

                {form.isGroup && (
                  <div className="cita-group-section">
                    <label className="searchable-select-label">Pacientes adicionales</label>
                    <SelectableInput
                      placeholder="Buscar paciente para añadir..."
                      icon="👥"
                      options={clients
                        .filter(c => c.idcliente !== Number(form.clientId) && !form.additionalClientIds.includes(c.idcliente))
                        .map(c => ({ value: c.idcliente, label: `${c.nombre} ${c.apellido} (${c.cedula || 'N/A'})` }))}
                      value=""
                      onChange={val => {
                        if (val) setForm({ ...form, additionalClientIds: [...form.additionalClientIds, Number(val)] });
                      }}
                    />
                    {form.additionalClientIds.length > 0 && (
                      <div className="service-tags-container">
                        {form.additionalClientIds.map(cid => {
                          const c = clients.find(cl => cl.idcliente === cid);
                          return (
                            <div key={cid} className="service-tag service-tag--client">
                              {c ? `${c.nombre} ${c.apellido}` : `Paciente #${cid}`}
                              <span
                                className="service-tag-remove"
                                onClick={() => setForm({ ...form, additionalClientIds: form.additionalClientIds.filter(id => id !== cid) })}
                              >×</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {clientAbonos.length > 0 && !editId && (
                  <div className="cita-group-section">
                    <div className="abono-section-header">
                      <div className="abono-section-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        Abonos disponibles
                      </div>
                      <span className="abono-badge">{clientAbonos.length} abono{clientAbonos.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="abono-list">
                      {clientAbonos.map(ab => {
                        const isSelected = form.selectedAbonoId === ab.idabono;
                        const totalSvc = services.filter(s => form.serviceIds.includes(s.idservicios)).reduce((sum, s) => sum + Number(s.precio || 0), 0);
                        return (
                          <div
                            key={ab.idabono}
                            className={`abono-item ${isSelected ? 'abono-item--selected' : ''}`}
                            onClick={() => {
                              setForm(f => ({
                                ...f,
                                selectedAbonoId: isSelected ? null : ab.idabono,
                                abonoToApply: isSelected ? 0 : Math.min(Number(ab.saldo_disponible), totalSvc || Number(ab.saldo_disponible)),
                              }));
                            }}
                          >
                            <div className="abono-item-icon">
                              {isSelected
                                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                              }
                            </div>
                            <div className="abono-item-info">
                              <span className="abono-item-id">Abono #{ab.idabono}</span>
                              <span className="abono-item-note">
                                {ab.fecha_abono ? new Date(ab.fecha_abono).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                                {ab.observacion ? ` · ${ab.observacion}` : ''}
                              </span>
                            </div>
                            <div className="abono-item-saldo">
                              <span className="abono-item-saldo-label">Saldo</span>
                              <strong>${Number(ab.saldo_disponible).toLocaleString('es-CO')}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {form.selectedAbonoId && (() => {
                      const selectedAbono = clientAbonos.find(a => a.idabono === form.selectedAbonoId);
                      const totalSvc = services.filter(s => form.serviceIds.includes(s.idservicios)).reduce((sum, s) => sum + Number(s.precio || 0), 0);
                      const saldoDisp = Number(selectedAbono?.saldo_disponible || 0);
                      const restante = totalSvc - form.abonoToApply;
                      return (
                        <div className="abono-amount-card">
                          <div className="abono-amount-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                            Monto a descontar
                          </div>
                          <div className="abono-amount-row">
                            <div className="abono-amount-input-wrapper">
                              <span className="abono-amount-prefix">$</span>
                              <input
                                type="number"
                                className="input-field input-rounded-lg abono-amount-input"
                                min="1"
                                max={saldoDisp}
                                value={form.abonoToApply}
                                onChange={e => setForm(f => ({ ...f, abonoToApply: Math.min(saldoDisp, Math.max(0, Number(e.target.value))) }))}
                              />
                            </div>
                            <span className="abono-desc-text">de ${saldoDisp.toLocaleString('es-CO')} disponibles</span>
                          </div>
                          {totalSvc > 0 && (
                            <div className="abono-summary-bar">
                              <span className="abono-summary-label">
                                Total servicios: <strong>${totalSvc.toLocaleString('es-CO')}</strong>
                              </span>
                              <span className="abono-summary-value">
                                {restante <= 0 ? '✓ Cubierto por abono' : `Resta: $${restante.toLocaleString('es-CO')}`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {products.length > 0 && (
                  <div className="cita-group-section">
                    <label className="searchable-select-label">Productos utilizados (opcional)</label>
                    <div className="appt-modal-row">
                      <select
                        className="input-field"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      >
                        <option value="">Selecciona un producto...</option>
                        {products
                          .filter(p => !form.productsUsed.find(u => u.idproducto === p.idproducto))
                          .map(p => (
                            <option key={p.idproducto} value={p.idproducto}>
                              {p.nombre} (stock: {p.cantidad})
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        className="input-field"
                        style={{ width: 80, flexShrink: 0 }}
                        min="1"
                        value={productQty}
                        onChange={e => setProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Cant."
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ flexShrink: 0 }}
                        onClick={() => {
                          if (!productSearch) return;
                          const prod = products.find(p => p.idproducto === parseInt(productSearch));
                          if (!prod) return;
                          if (productQty > prod.cantidad) {
                            showSnack(`Stock insuficiente (disponible: ${prod.cantidad})`, 'error');
                            return;
                          }
                          setForm({ ...form, productsUsed: [...form.productsUsed, { idproducto: prod.idproducto, cantidad: productQty }] });
                          setProductSearch('');
                          setProductQty(1);
                        }}
                      >+ Agregar</button>
                    </div>
                    {form.productsUsed.length > 0 && (
                      <div className="service-tags-container">
                        {form.productsUsed.map(u => {
                          const prod = products.find(p => p.idproducto === u.idproducto);
                          return (
                            <div key={u.idproducto} className="service-tag">
                              {prod?.nombre || `Producto #${u.idproducto}`} × {u.cantidad}
                              <span
                                className="service-tag-remove"
                                onClick={() => setForm({ ...form, productsUsed: form.productsUsed.filter(x => x.idproducto !== u.idproducto) })}
                              >×</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="appt-modal-footer">
                {editId && (
                  <button type="button" className="btn btn-outline btn-danger-outline" onClick={handleDeleteAppointment} disabled={saving || form.status === 'Completada'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Eliminar
                  </button>
                )}
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
      <div className={`snackbar ${snackbar.show ? 'visible' : ''} snackbar--${snackbar.type || 'success'}`}>
        <div className="snackbar-icon">
          {snackbar.type === 'error' ? '✕' : snackbar.type === 'warning' ? '⚠' : '✓'}
        </div>
        {snackbar.message}
      </div>

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
