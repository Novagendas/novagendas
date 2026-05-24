// data.js — constantes de la landing page

export const NAV_LINKS = [
  { id: 'funciones', label: 'Funciones' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'sectores', label: 'Sectores' },
];

export const SECTORES = [
  { label: '🏥 Clínicas estéticas', highlight: true },
  { label: '🧖 Spas & bienestar' },
  { label: '🦷 Consultorios' },
  { label: '✂️ Barberías & salones' },
  { label: '🧠 Psicólogos' },
  { label: '💪 Centros deportivos' },
  { label: '🐾 Veterinarias' },
  { label: '+ Más' },
];

export const FEATURES = [
  {
    iconBg: '#EEF4FF',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Agenda drag & drop',
    desc: 'Vistas día, semana y mes. Arrastra citas para moverlas. Múltiples especialistas y detección automática de conflictos de horario.',
  },
  {
    iconBg: '#DBEAFE',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Gestión de clientes',
    desc: 'Historial completo por cliente, evolución por sesión, notas privadas y datos de contacto centralizados.',
  },
  {
    iconBg: '#DCFCE7',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Control de pagos',
    desc: 'Registro de cobros por cita: monto, método de pago y abonos parciales. Consulta ingresos por período.',
  },
  {
    iconBg: '#FFEDD5',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      </svg>
    ),
    title: 'Control de inventario',
    desc: 'Seguimiento de productos e insumos. Alertas de stock bajo. Registro de consumo por sesión.',
  },
  {
    iconBg: '#F0FDF4',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="5" height="9"/>
        <rect x="9" y="7" width="5" height="14"/>
        <rect x="15" y="3" width="5" height="18"/>
      </svg>
    ),
    title: 'Estadísticas y reportes',
    desc: 'Ingresos, citas por especialista, servicios más rentables y tendencias mes a mes en tiempo real.',
  },
  {
    iconBg: '#FCE7F3',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    title: 'Roles y permisos',
    desc: 'Admin, recepcionista y especialista. Cada usuario ve solo lo que le corresponde, con trazabilidad completa.',
  },
];

export const DIFF_ITEMS = [
  'Acceso desde cualquier dispositivo con navegador',
  'Multi-tenant: cada negocio en su propio subdominio',
  'Sincronización nativa con Google Calendar',
  'Días festivos y bloqueos de agenda configurables',
  'Registro de auditoría de cada acción del equipo',
];

export const DEMO_STATS = [
  { val: '24', label: 'Citas hoy' },
  { val: '8', label: 'Especialistas' },
  { val: '312', label: 'Clientes' },
];

export const DEMO_BARS = [
  ['Servicio A', 78],
  ['Servicio B', 63],
  ['Servicio C', 45],
];

export const BENTO_WEEK = [
  { day: 'LUN', events: [{ label: '09:00 · Cita', cls: 'lp-ev-blue' }, { label: '11:30', cls: 'lp-ev-purple' }] },
  { day: 'MAR', events: [{ label: '10:00 · Cita', cls: 'lp-ev-green' }] },
  { day: 'MIÉ', events: [{ label: '09:00 · Nueva', cls: 'lp-ev-main' }, { label: '14:00', cls: 'lp-ev-orange' }] },
  { day: 'JUE', events: [{ label: '📅 GCal', cls: 'lp-ev-pink' }, { label: '11:00', cls: 'lp-ev-blue' }] },
  { day: 'VIE', events: [{ label: '09:30', cls: 'lp-ev-green' }, { label: '15:00', cls: 'lp-ev-purple' }] },
];

export const BAR_HEIGHTS = [60, 80, 45, 95, 70, 85];
