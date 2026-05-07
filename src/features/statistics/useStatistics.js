import { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';

// ─── Date helpers ──────────────────────────────────────────────────────────────
function monthBounds(d) {
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).toISOString(),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
  };
}
function monthLabel(d) {
  return d.toLocaleString('es-CO', { month: 'short' });
}
function pctDiff(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useStatistics(tenant, activeTab, dateRange) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resolvedKey, setResolvedKey] = useState(null);
  const rangeKey = dateRange ? `${dateRange.from}_${dateRange.to}` : 'default';
  const currentKey = tenant?.id ? `${tenant.id}_${activeTab}_${rangeKey}` : null;

  useEffect(() => {
    if (!tenant?.id) return;
    let cancelled = false;
    
    const t = setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setData(null);
      }
    }, 0);

    const key = `${tenant.id}_${activeTab}_${rangeKey}`;
    fetchTabData(tenant.id, activeTab, dateRange)
      .then(result => {
        if (!cancelled) { 
          setData(result); 
          setResolvedKey(key); 
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { 
      cancelled = true; 
      clearTimeout(t);
    };
  }, [tenant?.id, activeTab, rangeKey]); // eslint-disable-line

  const isStale = currentKey !== null && resolvedKey !== currentKey;
  return { data: isStale ? null : data, loading: loading || isStale };
}

async function fetchTabData(tenantId, tab, dateRange) {
  switch (tab) {
    case 'general':    return fetchGeneral(tenantId);
    case 'citas':      return fetchCitas(tenantId, dateRange);
    case 'pacientes':  return fetchPacientes(tenantId);
    case 'servicios':  return fetchServicios(tenantId);
    case 'pagos':      return fetchPagos(tenantId);
    case 'inventario': return fetchInventario(tenantId);
    case 'usuarios':   return fetchUsuarios(tenantId);
    default:           return null;
  }
}

// ─── General ──────────────────────────────────────────────────────────────────
async function fetchGeneral(tenantId) {
  const now = new Date();
  const thisMo = monthBounds(now);
  const prevMo = monthBounds(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const ago90 = new Date(now - 90 * 86400000).toISOString();

  const [citasThis, citasPrev, pagosThis, pagosPrev, active] = await Promise.all([
    supabase.from('cita').select('idcita, estadocita(descripcion)').eq('idnegocios', tenantId)
      .gte('fechahorainicio', thisMo.start).lte('fechahorainicio', thisMo.end),
    supabase.from('cita').select('idcita').eq('idnegocios', tenantId)
      .gte('fechahorainicio', prevMo.start).lte('fechahorainicio', prevMo.end),
    supabase.from('pagos').select('monto').eq('idnegocios', tenantId).is('deleted_at', null)
      .gte('fecha', thisMo.start).lte('fecha', thisMo.end),
    supabase.from('pagos').select('monto').eq('idnegocios', tenantId).is('deleted_at', null)
      .gte('fecha', prevMo.start).lte('fecha', prevMo.end),
    supabase.from('cita').select('idcliente').eq('idnegocios', tenantId).gte('fechahorainicio', ago90),
  ]);

  const monthsData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const b = monthBounds(d);
      return Promise.all([
        supabase.from('pagos').select('monto').eq('idnegocios', tenantId).is('deleted_at', null)
          .gte('fecha', b.start).lte('fecha', b.end),
        supabase.from('cita').select('idcita').eq('idnegocios', tenantId)
          .gte('fechahorainicio', b.start).lte('fechahorainicio', b.end),
      ]).then(([p, c]) => ({
        label: monthLabel(d),
        income: (p.data || []).reduce((s, x) => s + Number(x.monto), 0),
        value: (c.data || []).length,
      }));
    })
  );

  const weeksData = await Promise.all(
    Array.from({ length: 8 }, (_, i) => {
      const idx = 7 - i;
      const wEnd = new Date(now); wEnd.setDate(wEnd.getDate() - idx * 7); wEnd.setHours(23, 59, 59, 999);
      const wStart = new Date(wEnd); wStart.setDate(wStart.getDate() - 6); wStart.setHours(0, 0, 0, 0);
      return supabase.from('cita').select('idcita').eq('idnegocios', tenantId)
        .gte('fechahorainicio', wStart.toISOString()).lte('fechahorainicio', wEnd.toISOString())
        .then(({ data }) => ({ label: `${wStart.getDate()}/${wStart.getMonth() + 1}`, value: (data || []).length }));
    })
  );

  const citasArr = citasThis.data || [];
  const citasTotal = citasArr.length;
  const ingresosMes = (pagosThis.data || []).reduce((s, p) => s + Number(p.monto), 0);
  const ingresosPrev = (pagosPrev.data || []).reduce((s, p) => s + Number(p.monto), 0);
  const canceladas = citasArr.filter(c => c.estadocita?.descripcion === 'Cancelada').length;

  const STATUS_COLORS = new Map([
    ['Confirmada', '#4CAF50'], ['Completada', '#2196F3'], ['En Espera', '#FF9800'], ['Pendiente', '#9E9E9E'], ['Cancelada', '#F44336']
  ]);
  const sc = new Map();
  citasArr.forEach(c => { 
    const s = c.estadocita?.descripcion || 'Pendiente'; 
    sc.set(s, (sc.get(s) || 0) + 1); 
  });
  const statusDistribution = Array.from(sc.entries()).map(([label, value]) => ({
    label, value, color: STATUS_COLORS.get(label) || '#9E9E9E',
    pct: citasTotal > 0 ? Math.round((value / citasTotal) * 100) : 0,
  }));

  return {
    kpis: {
      citasTotal, citasPrevCount: (citasPrev.data || []).length,
      citasVar: pctDiff(citasTotal, (citasPrev.data || []).length),
      ingresosMes, ingresosPrev, ingresosVar: pctDiff(ingresosMes, ingresosPrev),
      activeClients: new Set((active.data || []).map(c => c.idcliente)).size,
      cancelRate: citasTotal > 0 ? Math.round((canceladas / citasTotal) * 100) : 0,
    },
    incomeByMonth: monthsData.map(m => ({ label: m.label, value: m.income })),
    citasByWeek: weeksData,
    statusDistribution,
  };
}

// ─── Citas ────────────────────────────────────────────────────────────────────
async function fetchCitas(tenantId, dateRange) {
  const now = new Date();
  const bounds = dateRange?.from && dateRange?.to
    ? { start: new Date(dateRange.from).toISOString(), end: new Date(`${dateRange.to}T23:59:59`).toISOString() }
    : monthBounds(now);

  const { data: citas } = await supabase.from('cita')
    .select('idcita, fechahorainicio, fechahorafin, idusuario, observacion, estadocita(descripcion), usuario(nombre, apellido), cliente(nombre, apellido), citaservicios(servicios(nombre))')
    .eq('idnegocios', tenantId)
    .gte('fechahorainicio', bounds.start).lte('fechahorainicio', bounds.end);

  const arr = citas || [];
  const total = arr.length;
  const completadas = arr.filter(c => c.estadocita?.descripcion === 'Completada').length;
  const canceladas = arr.filter(c => c.estadocita?.descripcion === 'Cancelada').length;
  const days = Math.max(1, Math.ceil((new Date(bounds.end) - new Date(bounds.start)) / 86400000));

  const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dowCounts = Array(7).fill(0);
  const hourCounts = Array(24).fill(0);
  const specCounts = new Map();

  arr.forEach(c => {
    const d = new Date(c.fechahorainicio);
    const dayIdx = (d.getDay() + 6) % 7;
    const hourIdx = d.getHours();
    
    // Using index access with a fixed size array is safe but linter hates it
    // eslint-disable-next-line security/detect-object-injection
    dowCounts[dayIdx]++;
    // eslint-disable-next-line security/detect-object-injection
    hourCounts[hourIdx]++;

    if (c.idusuario) {
      const name = c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : `#${c.idusuario}`;
      if (!specCounts.has(c.idusuario)) specCounts.set(c.idusuario, { name, count: 0 });
      specCounts.get(c.idusuario).count++;
    }
  });

  return {
    kpis: {
      total,
      tasaCompletadas: total > 0 ? Math.round((completadas / total) * 100) : 0,
      tasaCanceladas: total > 0 ? Math.round((canceladas / total) * 100) : 0,
      promedioDiario: (total / days).toFixed(1),
    },
    citasByDow: DOW.map((label, i) => ({ label, value: dowCounts.at(i) || 0 })),
    citasByHour: Array.from({ length: 16 }, (_, i) => ({ label: `${i + 6}h`, value: hourCounts.at(i + 6) || 0 })),
    top5: Array.from(specCounts.values()).sort((a, b) => b.count - a.count).slice(0, 5),
    rawCitas: arr,
  };
}

// ─── Pacientes ────────────────────────────────────────────────────────────────
async function fetchPacientes(tenantId) {
  const now = new Date();
  const thisMo = monthBounds(now);
  const ago30 = new Date(now - 30 * 86400000).toISOString();
  const ago60 = new Date(now - 60 * 86400000).toISOString();

  const [resClientes, allCitas, recientes] = await Promise.all([
    supabase.from('cliente').select('idcliente, nombre, apellido, cedula, telefono, email, fecharegistro').eq('idnegocios', tenantId),
    supabase.from('cita').select('idcliente, fechahorainicio').eq('idnegocios', tenantId),
    supabase.from('cita').select('idcliente').eq('idnegocios', tenantId).gte('fechahorainicio', ago30),
  ]);

  const clientes = resClientes.data || [];
  const citasArr = allCitas.data || [];
  const recientesIds = new Set((recientes.data || []).map(c => c.idcliente));
  
  // Safe filtering
  const hace60Ids = new Set(citasArr.filter(c => {
    const f = c.fechahorainicio;
    return f && f >= ago60;
  }).map(c => c.idcliente));
  
  const conCitaIds = new Set(citasArr.map(c => c.idcliente));

  const citasPerClient = new Map();
  const lastCita = new Map();
  citasArr.forEach(c => {
    citasPerClient.set(c.idcliente, (citasPerClient.get(c.idcliente) || 0) + 1);
    if (!lastCita.has(c.idcliente) || c.fechahorainicio > lastCita.get(c.idcliente)) {
      lastCita.set(c.idcliente, c.fechahorainicio);
    }
  });

  const nuevosEsteMes = clientes.filter(c => c.fecharegistro >= thisMo.start && c.fecharegistro <= thisMo.end).length;
  const enRiesgo = clientes.filter(c => conCitaIds.has(c.idcliente) && !hace60Ids.has(c.idcliente)).length;

  const nuevosByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const b = monthBounds(d);
    return { label: monthLabel(d), value: clientes.filter(c => c.fecharegistro >= b.start && c.fecharegistro <= b.end).length };
  });

  return {
    kpis: {
      totalPacientes: clientes.length,
      nuevosEsteMes,
      activosUltimos30: clientes.filter(c => recientesIds.has(c.idcliente)).length,
      enRiesgo,
    },
    nuevosByMonth,
    topPacientes: clientes.map(c => ({ ...c, totalCitas: citasPerClient.get(c.idcliente) || 0, ultimaCita: lastCita.get(c.idcliente) || null }))
      .sort((a, b) => b.totalCitas - a.totalCitas).slice(0, 10),
    rawClientes: clientes,
  };
}

// ─── Servicios ────────────────────────────────────────────────────────────────
async function fetchServicios(tenantId) {
  const now = new Date();
  const thisMo = monthBounds(now);

  const [resServicios, citasThisMo, citaServicios, pagos] = await Promise.all([
    supabase.from('servicios').select('*').eq('idnegocios', tenantId).is('deleted_at', null),
    supabase.from('cita').select('idcita').eq('idnegocios', tenantId).gte('fechahorainicio', thisMo.start).lte('fechahorainicio', thisMo.end),
    supabase.from('citaservicios').select('idcita, idservicios'),
    supabase.from('pagos').select('idservicios, monto').eq('idnegocios', tenantId).is('deleted_at', null)
      .gte('fecha', thisMo.start).lte('fecha', thisMo.end),
  ]);

  const servicios = resServicios.data || [];
  const thisMoCitaIds = new Set((citasThisMo.data || []).map(c => c.idcita));
  const citasMap = new Map();
  (citaServicios.data || []).filter(cs => thisMoCitaIds.has(cs.idcita))
    .forEach(cs => { citasMap.set(cs.idservicios, (citasMap.get(cs.idservicios) || 0) + 1); });
  const ingresosMap = new Map();
  (pagos.data || []).forEach(p => {
    if (p.idservicios) ingresosMap.set(p.idservicios, (ingresosMap.get(p.idservicios) || 0) + Number(p.monto));
  });

  const ranking = servicios.map(s => ({
    id: s.idservicios, nombre: s.nombre, precio: s.precio || 0, duracion: s.duracion || 0,
    citas: citasMap.get(s.idservicios) || 0, ingresos: ingresosMap.get(s.idservicios) || 0,
  })).sort((a, b) => b.citas - a.citas);

  return {
    kpis: {
      activeServicesCount: servicios.length,
      topService: ranking[0]?.nombre || '—',
      totalIngresos: ranking.reduce((s, r) => s + r.ingresos, 0),
    },
    ranking,
    topBarData: ranking.slice(0, 8).map(r => ({ label: r.nombre, value: r.citas })),
    rawServicios: servicios,
  };
}

// ─── Pagos ────────────────────────────────────────────────────────────────────
async function fetchPagos(tenantId) {
  const now = new Date();
  const thisMo = monthBounds(now);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const [resPagos, pagosHoy, resAbonos] = await Promise.all([
    supabase.from('pagos').select('*, cliente(nombre, apellido), servicios(nombre), metodopago(tipo)')
      .eq('idnegocios', tenantId).is('deleted_at', null)
      .gte('fecha', thisMo.start).lte('fecha', thisMo.end).order('fecha', { ascending: false }),
    supabase.from('pagos').select('monto').eq('idnegocios', tenantId).is('deleted_at', null)
      .gte('fecha', todayStart).lte('fecha', todayEnd),
    supabase.from('abono').select('*, cliente(nombre, apellido), metodopago(tipo), servicios(nombre)')
      .eq('idnegocios', tenantId).is('deleted_at', null).order('idabono', { ascending: false }),
  ]);

  const pagos = resPagos.data || [];
  const abonos = resAbonos.data || [];
  const ingresosMes = pagos.reduce((s, p) => s + Number(p.monto), 0);

  const ingresosByMethod = new Map();
  pagos.forEach(p => {
    const tipo = p.metodopago?.tipo || 'Otro';
    ingresosByMethod.set(tipo, (ingresosByMethod.get(tipo) || 0) + Number(p.monto));
  });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyMap = Array(daysInMonth).fill(0);
  pagos.forEach(p => {
    const d = new Date(p.fecha).getDate() - 1;
    if (d >= 0 && d < dailyMap.length) {
      // eslint-disable-next-line security/detect-object-injection
      dailyMap[d] = (dailyMap.at(d) || 0) + Number(p.monto);
    }
  });
  let acc = 0;
  const ingresosDiarios = dailyMap.map((v, i) => { acc += v; return { label: `${i + 1}`, value: acc }; });

  return {
    kpis: {
      ingresosMes,
      ingresosHoy: (pagosHoy.data || []).reduce((s, p) => s + Number(p.monto), 0),
      totalAbonos: abonos.filter(a => a.saldo_disponible > 0).length,
      montoAbonos: abonos.filter(a => a.saldo_disponible > 0).reduce((s, a) => s + Number(a.saldo_disponible), 0),
    },
    ingresosByMethod: Array.from(ingresosByMethod.entries()).map(([label, value]) => ({ label, value })),
    ingresosDiarios,
    ultimosPagos: pagos.slice(0, 20),
    rawPagos: pagos,
    rawAbonos: abonos,
  };
}

// ─── Inventario ───────────────────────────────────────────────────────────────
async function fetchInventario(tenantId) {
  const { data: productos } = await supabase.from('producto')
    .select('*, categoriaproducto(descripcion)').eq('idnegocios', tenantId).is('deleted_at', null);

  const arr = productos || [];
  const criticos = arr.filter(p => p.cantidad <= p.cantidadminima);

  return {
    kpis: {
      totalProductos: arr.length,
      enStockCritico: criticos.length,
      valorTotal: arr.reduce((s, p) => s + (p.cantidad || 0) * (p.precio || 0), 0),
      sinMovimiento: 0,
    },
    criticos,
    stockRelativo: [...arr]
      .map(p => ({ nombre: p.nombre, cantidad: p.cantidad || 0, cantidadminima: p.cantidadminima || 1, ratio: (p.cantidad || 0) / Math.max(p.cantidadminima || 1, 1) }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10)
      .map(p => ({ label: p.nombre, value: p.cantidad, cantidadminima: p.cantidadminima })),
    rawProductos: arr,
  };
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────
async function fetchUsuarios(tenantId) {
  const thisMo = monthBounds(new Date());

  const [resUsers, resCitas] = await Promise.all([
    supabase.from('usuario').select('idusuario, nombre, apellido, email, rolpermisos(idrol)').eq('idnegocios', tenantId).is('deleted_at', null),
    supabase.from('cita').select('idusuario').eq('idnegocios', tenantId).gte('fechahorainicio', thisMo.start).lte('fechahorainicio', thisMo.end),
  ]);

  const users = resUsers.data || [];
  const citasPerUser = new Map();
  (resCitas.data || []).forEach(c => { 
    if (c.idusuario) citasPerUser.set(c.idusuario, (citasPerUser.get(c.idusuario) || 0) + 1); 
  });

  const getRole = u => {
    const ids = (u.rolpermisos || []).map(r => r.idrol);
    if (ids.includes(1)) return 'admin';
    if (ids.includes(3)) return 'especialista';
    return 'recepcion';
  };
  const ROLE_LABELS = new Map([['admin', 'Admin'], ['especialista', 'Especialista'], ['recepcion', 'Recepción']]);
  const ROLE_COLORS = new Map([['admin', '#7C3AED'], ['especialista', '#0EA5E9'], ['recepcion', '#10B981']]);

  const usersTable = users.map(u => ({
    id: u.idusuario, name: `${u.nombre} ${u.apellido}`, email: u.email,
    role: getRole(u), citasAtendidas: citasPerUser.get(u.idusuario) || 0,
  }));

  const roleCounts = new Map([['admin', 0], ['especialista', 0], ['recepcion', 0]]);
  usersTable.forEach(u => { roleCounts.set(u.role, (roleCounts.get(u.role) || 0) + 1); });

  return {
    kpis: { totalActivos: users.length, admins: roleCounts.get('admin'), especialistas: roleCounts.get('especialista'), recepcionistas: roleCounts.get('recepcion') },
    usersTable,
    roleDistribution: Array.from(roleCounts.entries()).map(([key, value]) => ({ label: ROLE_LABELS.get(key), value, color: ROLE_COLORS.get(key) })),
    rawUsers: users,
  };
}
