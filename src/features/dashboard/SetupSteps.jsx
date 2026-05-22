import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchSetupSteps,
  ensureStepsExist,
  toggleStepComplete,
} from './setupSteps.service';
import './SetupSteps.css';

/* ── Constantes ─────────────────────────────────────────── */
const STEPS_CONFIG = [
  {
    key: 'servicios',
    title: 'Servicios y Categorías',
    required: true,
    route: 'services',
    description:
      'Para el correcto funcionamiento del sistema, debes crear al menos una categoría y un servicio. Configura el nombre, precio, duración y color de cada servicio para distinguirlos fácilmente en la agenda.',
  },
  {
    key: 'agenda_google',
    title: 'Sincronizar con Google Calendar',
    required: false,
    route: 'agenda',
    description:
      'Al sincronizar con Google, cada vez que se cree una cita se creará automáticamente un evento en tu calendario de Google y se enviará una invitación al cliente como recordatorio de su cita.',
  },
  {
    key: 'pacientes',
    title: 'Registrar Pacientes',
    required: false,
    route: 'clients',
    description:
      'Crea y gestiona el historial de tus pacientes. Podrás ver sus próximas citas, evoluciones, notas clínicas y todo el historial de atenciones anteriores.',
  },
  {
    key: 'dias_bloqueados',
    title: 'Días Bloqueados',
    required: false,
    route: 'feriados',
    description:
      'Bloquea días en los que no se prestarán servicios: festivos, días de mantenimiento o simplemente días de descanso. El sistema no permitirá agendamientos en esas fechas.',
  },
  {
    key: 'pagos',
    title: 'Pagos y Abonos',
    required: false,
    route: 'payments',
    description:
      'Gestiona los cobros de tus citas y registra abonos parciales. Puedes llevar un control detallado de los pagos pendientes, parciales y completados de cada paciente.',
  },
  {
    key: 'inventario',
    title: 'Inventario de Productos',
    required: false,
    route: 'inventory',
    description:
      'Controla el stock de productos utilizados en tus tratamientos. El sistema genera alertas cuando el inventario está bajo el mínimo, y puedes descontar productos automáticamente al crear una cita.',
  },
  {
    key: 'estadisticas',
    title: 'Estadísticas del Negocio',
    required: false,
    route: 'estadisticas',
    description:
      'Analiza el desempeño de tu negocio con reportes detallados de ingresos, citas y pacientes. Puedes exportar la información en archivos Excel para análisis externos.',
  },
  {
    key: 'usuarios',
    title: 'Gestión de Usuarios',
    required: false,
    route: 'users',
    description:
      'Agrega trabajadores a tu equipo, asígnales permisos específicos según su rol y provee acceso al sistema. Controla qué puede ver y hacer cada miembro del equipo.',
  },
  {
    key: 'perfil',
    title: 'Perfil del Negocio',
    required: false,
    route: 'profile',
    description:
      'Sube una foto de perfil, actualiza tu información personal, crea las ubicaciones de tu negocio y cambia tu contraseña para mantener la seguridad de tu cuenta.',
  },
  {
    key: 'movimientos',
    title: 'Registro de Movimientos',
    required: false,
    route: 'logs',
    description:
      'Consulta el historial completo de operaciones del sistema: quién hizo qué y cuándo. Ideal para auditorías y control de cambios en el negocio.',
  },
];

const BOT_STEP = {
  key: 'bot',
  title: 'Configuración del Bot de WhatsApp',
  required: false,
  route: 'bot',
  description:
    'Personaliza tu bot de agendamiento: configura los días y horarios de atención, decide si mostrar precios en el catálogo, elige qué servicios muestran precio, activa notificaciones de contacto, configura el teléfono de contacto y los datos de pago (Nequi/Llave Breb) para recibir abonos.',
};

const SNACK_DURATION_MS = 3500;

/* ── Íconos inline ──────────────────────────────────────── */
const IconCheck = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconCircle = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const IconChevron = ({ size = 16, rotated = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`setup-chevron-icon${rotated ? ' setup-chevron-icon--open' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconAlert = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconArrowRight = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ── Step Item (acordeón) ────────────────────────────────── */
function StepItem({ step, completado, isOpen, onToggleOpen, onMark, onUnmark, onNavigate, saving }) {
  const bodyRef = useRef(null);
  const [bodyHeight, setBodyHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setBodyHeight(bodyRef.current.scrollHeight);
    }
  }, [isOpen]);

  const handleToggle = () => onToggleOpen(step.key);

  return (
    <div className={`setup-step-item${completado ? ' setup-step-item--done' : ''}`}>
      {/* Header del acordeón */}
      <button
        type="button"
        className="setup-step-header"
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <span className={`setup-step-icon${completado ? ' setup-step-icon--done' : ''}`}>
          {completado ? <IconCheck size={15} /> : <IconCircle size={15} />}
        </span>

        <span className={`setup-step-title${completado ? ' setup-step-title--done' : ''}`}>
          {step.title}
        </span>

        <span className={`setup-step-badge${step.required ? ' setup-step-badge--required' : ' setup-step-badge--optional'}`}>
          {step.required ? 'Obligatorio' : 'Opcional'}
        </span>

        <IconChevron size={16} rotated={isOpen} />
      </button>

      {/* Cuerpo colapsable */}
      <div
        className="setup-step-body-wrapper"
        style={{ maxHeight: isOpen ? `${bodyHeight}px` : '0px' }}
      >
        <div className="setup-step-body" ref={bodyRef}>
          <p className="setup-step-description">{step.description}</p>
          <div className="setup-step-actions">
            <button
              type="button"
              className="btn btn-outline setup-step-btn-configure"
              onClick={() => onNavigate(step.route)}
            >
              Configurar <IconArrowRight size={14} />
            </button>

            {completado ? (
              <button
                type="button"
                className="btn setup-step-btn-unmark"
                onClick={() => onUnmark(step.key)}
                disabled={saving === step.key}
              >
                {saving === step.key ? 'Guardando...' : 'Desmarcar'}
              </button>
            ) : (
              <button
                type="button"
                className="btn setup-step-btn-mark"
                onClick={() => onMark(step.key)}
                disabled={saving === step.key}
              >
                {saving === step.key ? (
                  'Guardando...'
                ) : (
                  <>
                    <IconCheck size={14} /> Marcar como realizado
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Snackbar interno ────────────────────────────────────── */
function Snackbar({ message, type, visible }) {
  return (
    <div className={`setup-snack${visible ? ' setup-snack--visible' : ''} setup-snack--${type}`}>
      {message}
    </div>
  );
}

/* ── SetupSteps ─────────────────────────────────────────── */
export default function SetupSteps({ tenant, hasBotEnabled, onNavigate, onPendingChange }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionOpen, setSectionOpen] = useState(true);
  const [openStepKey, setOpenStepKey] = useState(null);
  const [saving, setSaving] = useState(null);
  const [snack, setSnack] = useState({ visible: false, message: '', type: 'success' });
  const snackTimerRef = useRef(null);

  /* ── Pasos activos ── */
  const activeConfig = hasBotEnabled
    ? [...STEPS_CONFIG, BOT_STEP]
    : STEPS_CONFIG;

  const activeKeys = activeConfig.map((s) => s.key);

  /* ── Mostrar snack ── */
  const showSnack = useCallback((message, type = 'success') => {
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    setSnack({ visible: true, message, type });
    snackTimerRef.current = setTimeout(
      () => setSnack({ visible: false, message: '', type: 'success' }),
      SNACK_DURATION_MS
    );
  }, []);

  /* ── Carga inicial ── */
  useEffect(() => {
    if (!tenant?.id) return;

    const init = async () => {
      setLoading(true);
      await ensureStepsExist(tenant.id, activeKeys);
      const fetched = await fetchSetupSteps(tenant.id);

      // Normalizar: garantizar una entrada por cada key activo
      const dbMap = Object.fromEntries(fetched.map((r) => [r.paso_key, r.completado]));
      const normalized = activeKeys.map((key) => ({
        paso_key: key,
        completado: dbMap[key] ?? false,
      }));

      setSteps(normalized);
      setLoading(false);
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, hasBotEnabled]);

  /* ── Abrir por defecto el primer requerido no completado ── */
  useEffect(() => {
    if (loading || steps.length === 0) return;

    const firstPending = activeConfig.find(
      (cfg) => cfg.required && !steps.find((s) => s.paso_key === cfg.key)?.completado
    );

    if (firstPending) {
      setOpenStepKey(firstPending.key);
    }
  }, [loading]); // Solo en el primer render post-carga

  /* ── Notificar cambios de pendientes ── */
  useEffect(() => {
    if (!onPendingChange || loading) return;
    const hasPending = steps.some((s) => !s.completado);
    onPendingChange(hasPending);
  }, [steps, loading, onPendingChange]);

  /* ── Toggle acordeón de step ── */
  const handleToggleStep = useCallback((key) => {
    setOpenStepKey((prev) => (prev === key ? null : key));
  }, []);

  /* ── Marcar paso ── */
  const handleMark = useCallback(
    async (key) => {
      setSaving(key);
      const { error } = await toggleStepComplete(tenant.id, key, true);
      setSaving(null);

      if (error) {
        showSnack('No se pudo guardar el cambio. Intenta de nuevo.', 'error');
        return;
      }

      const updated = steps.map((s) =>
        s.paso_key === key ? { ...s, completado: true } : s
      );
      setSteps(updated);

      const allDone = updated.every((s) => s.completado);
      if (allDone) {
        showSnack('¡Sistema configurado completamente! 🎉', 'success');
      }
    },
    [tenant.id, steps, showSnack]
  );

  /* ── Desmarcar paso ── */
  const handleUnmark = useCallback(
    async (key) => {
      setSaving(key);
      const { error } = await toggleStepComplete(tenant.id, key, false);
      setSaving(null);

      if (error) {
        showSnack('No se pudo guardar el cambio. Intenta de nuevo.', 'error');
        return;
      }

      setSteps((prev) =>
        prev.map((s) => (s.paso_key === key ? { ...s, completado: false } : s))
      );
    },
    [tenant.id, showSnack]
  );

  /* ── Métricas del header ── */
  const completedCount = steps.filter((s) => s.completado).length;
  const totalCount = steps.length;
  const hasRequiredPending = activeConfig.some(
    (cfg) => cfg.required && !steps.find((s) => s.paso_key === cfg.key)?.completado
  );

  /* ── Construir lista combinada config + estado ── */
  const stepsWithState = activeConfig.map((cfg) => ({
    ...cfg,
    completado: steps.find((s) => s.paso_key === cfg.key)?.completado ?? false,
  }));

  if (loading) {
    return (
      <div className="setup-card setup-card--loading">
        <div className="setup-loading-row">
          <div className="skeleton setup-skeleton-icon" />
          <div className="skeleton setup-skeleton-title" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton setup-skeleton-step" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`setup-card${hasRequiredPending ? ' setup-card--warn' : ' setup-card--primary'}`}
    >
      {/* ── Header principal ── */}
      <button
        type="button"
        className="setup-section-header"
        onClick={() => setSectionOpen((v) => !v)}
        aria-expanded={sectionOpen}
      >
        <span className={`setup-section-icon${hasRequiredPending ? ' setup-section-icon--warn' : ' setup-section-icon--ok'}`}>
          <IconAlert size={18} />
        </span>

        <div className="setup-section-info">
          <span className="setup-section-title">Configuración del sistema</span>
          <span className="setup-section-subtitle">
            {completedCount} de {totalCount} pasos completados
          </span>
        </div>

        {/* Barra de progreso compacta */}
        <div className="setup-progress-track" aria-hidden="true">
          <div
            className="setup-progress-fill"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        <IconChevron size={18} rotated={sectionOpen} />
      </button>

      {/* ── Lista de pasos ── */}
      <div className={`setup-steps-list${sectionOpen ? ' setup-steps-list--open' : ''}`}>
        {stepsWithState.map((step) => (
          <StepItem
            key={step.key}
            step={step}
            completado={step.completado}
            isOpen={openStepKey === step.key}
            onToggleOpen={handleToggleStep}
            onMark={handleMark}
            onUnmark={handleUnmark}
            onNavigate={onNavigate}
            saving={saving}
          />
        ))}
      </div>

      {/* ── Snackbar interno ── */}
      <Snackbar
        message={snack.message}
        type={snack.type}
        visible={snack.visible}
      />
    </div>
  );
}
