/**
 * utils/constants.js
 * Constantes globales de la aplicación
 */

/* Routes Meta - Información sobre rutas */
export const ROUTE_META = {
  dashboard: { label: 'Vista General', emoji: '📊' },
  agenda: { label: 'Agenda de Citas', emoji: '📅' },
  clients: { label: 'Pacientes', emoji: '👥' },
  services: { label: 'Catálogo de Servicios', emoji: '💉' },
  payments: { label: 'Registro de Pagos', emoji: '💳' },
  inventory: { label: 'Inventario', emoji: '📦' },
  users: { label: 'Gestión de Usuarios', emoji: '🔑' },
  audit: { label: 'Registro de Auditoría', emoji: '📜' },
};

/* Payment Methods */
export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'Nequi / Daviplata',
];

export const PAYMENT_METHOD_ICONS = {
  'Efectivo': '💵',
  'Tarjeta': '💳',
  'Transferencia': '🏦',
  'Nequi / Daviplata': '📱',
};

/* Appointment Status */
export const APPOINTMENT_STATUSES = [
  'Confirmada',
  'En Espera',
  'Pendiente',
  'Cancelada',
  'Completada',
];

export const STATUS_COLORS = {
  'Confirmada': 'var(--success)',
  'En Espera': 'var(--warning)',
  'Pendiente': 'var(--text-3)',
  'Cancelada': 'var(--danger)',
  'Completada': 'var(--primary)',
};

/* Calendar */
export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/* Calendar Config */
export const CALENDAR_CONFIG = {
  SLOT_HEIGHT: 72, // px por hora
  MIN_HOUR: 6, // Hora de inicio mínima
  MAX_HOUR: 21, // Hora de cierre máxima
  DEFAULT_VIEW: 'week', // 'day' | 'week' | 'month'
  DEFAULT_DURATION: 30, // minutos
};

/* User Roles */
export const USER_ROLES = {
  admin: { label: 'Administrador', level: 3, permissions: ['*'] },
  especialista: { label: 'Especialista', level: 2, permissions: ['agenda', 'clients', 'profile'] },
  recepcion: { label: 'Recepción', level: 1, permissions: ['agenda', 'clients'] },
};

/* Local Storage Keys */
export const STORAGE_KEYS = {
  user: 'novagendas_user',
  theme: 'novagendas_theme',
  route: 'novagendas_route',
  calendarAuth: 'novagendas_google_calendar_auth',
  tenant: 'novagendas_tenant',
};

/* Validation Rules */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-\(\)\+]+$/,
  CEDULA_REGEX: /^\d{6,10}$/,
  PASSWORD_MIN_LENGTH: 6,
};

/* Timeouts */
export const TIMEOUTS = {
  SNACKBAR: 3000,
  DEBOUNCE: 300,
  SEARCH_DEBOUNCE: 500,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas en ms
};

/* API Response Messages */
export const API_MESSAGES = {
  SUCCESS: {
    CREATE: 'Registro creado exitosamente',
    UPDATE: 'Registro actualizado exitosamente',
    DELETE: 'Registro eliminado exitosamente',
    SAVE: 'Cambios guardados exitosamente',
  },
  ERROR: {
    GENERIC: 'Error inesperado, intenta de nuevo',
    NETWORK: 'Error de conexión, verifica tu internet',
    UNAUTHORIZED: 'No tienes permisos para esta acción',
    NOT_FOUND: 'El registro no fue encontrado',
    VALIDATION: 'Por favor verifica los datos',
  },
};

/* Limits */
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTE_LENGTH: 1000,
  ITEMS_PER_PAGE: 25,
};

/* Features Flags */
export const FEATURES = {
  GOOGLE_CALENDAR_SYNC: true,
  ADVANCE_PAYMENTS: true,
  MULTI_LOCATION: true,
  INVENTORY_TRACKING: true,
  AUDIT_LOGS: true,
};
