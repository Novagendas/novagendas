import { useState, useEffect, useCallback } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import './BotConfig.css';

const ONBOARDING_URL = 'https://aulddrljywoigivxugqf.supabase.co/functions/v1/whatsapp-onboarding';
const POPUP_BASE_URL = window.location.hostname.includes('localhost')
  ? `${window.location.origin}?wa_connect=1`
  : 'https://novagendas.com?wa_connect=1';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const DEFAULT_JORNADAS = {
  manana: { habilitado: true,  inicio: '08:00', fin: '12:00' },
  tarde:  { habilitado: true,  inicio: '13:00', fin: '18:00' },
  noche:  { habilitado: false, inicio: '18:00', fin: '21:00' },
};

const JORNADAS_DEF = [
  { key: 'manana', emoji: '☀️', label: 'Mañana' },
  { key: 'tarde',  emoji: '🌤',  label: 'Tarde'  },
  { key: 'noche',  emoji: '🌙', label: 'Noche'  },
];

const JORNADA_NOMBRES = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_CONFIG = {
  dias_disponibles: [1, 2, 3, 4, 5, 6],
  jornadas: DEFAULT_JORNADAS,
  horarios_por_dia: {},
  servicios_excluidos: [],
  mostrar_precios: true,
  servicios_precios_ocultos: [],
  email_notificaciones: '',
  telefono_contacto: '',
  numero_nequi: '',
  llave_breb: '',
};

export default function BotConfig({ user, tenant }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [waConnected, setWaConnected] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);

  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  const checkWhatsAppConnection = useCallback(async () => {
    const { data } = await supabase.rpc('has_whatsapp_integration', { p_idnegocios: tenant.id });
    setWaConnected(!!data);
  }, [tenant.id]);

  const launchEmbeddedSignup = () => {
    const popup = window.open(
      POPUP_BASE_URL,
      'wa_connect',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      showSnack('El navegador bloqueó la ventana emergente. Permite popups para este sitio.', 'error');
      return;
    }

    setWaConnecting(true);

    const onMessage = async (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type !== 'WA_CONNECT_RESULT' && event.data.type !== 'WA_CONNECT_ERROR') return;

      window.removeEventListener('message', onMessage);
      clearInterval(closedCheck);

      if (event.data.type === 'WA_CONNECT_ERROR') {
        showSnack(event.data.error || 'Error al conectar WhatsApp', 'error');
        setWaConnecting(false);
        return;
      }

      const { waba_id, phone_number_id, access_token } = event.data.data;
      try {
        const res = await fetch(ONBOARDING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idnegocios: tenant.id, waba_id, phone_number_id, access_token }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? 'Error al guardar la integración');
        }
        setWaConnected(true);
        await insertLog(tenant.id, user.idusuario, 'whatsapp_integrations', 'CREATE', { waba_id, phone_number_id });
        showSnack('WhatsApp conectado correctamente');
      } catch (err) {
        showSnack(err.message, 'error');
      } finally {
        setWaConnecting(false);
      }
    };

    window.addEventListener('message', onMessage);

    const closedCheck = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedCheck);
        window.removeEventListener('message', onMessage);
        setWaConnecting(false);
      }
    }, 1000);
  };

  const disconnectWhatsApp = async () => {
    const { error } = await supabase.rpc('disconnect_whatsapp_integration', { p_idnegocios: tenant.id });
    if (error) { showSnack('Error al desconectar WhatsApp', 'error'); return; }
    setWaConnected(false);
    await insertLog(tenant.id, user.idusuario, 'whatsapp_integrations', 'DELETE', {});
    showSnack('WhatsApp desconectado');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [configResult, servicesResult] = await Promise.all([
      supabase
        .from('bot_config')
        .select('*')
        .eq('idnegocios', tenant.id)
        .maybeSingle(),
      supabase
        .from('servicios')
        .select('idservicios, nombre, precio')
        .eq('idnegocios', tenant.id)
        .is('deleted_at', null)
        .neq('idestado', 2)
        .order('nombre'),
    ]);

    if (servicesResult.data) {
      setServices(servicesResult.data);
    }

    if (configResult.data) {
      const raw = configResult.data;
      setConfig({
        dias_disponibles: raw.dias_disponibles ?? DEFAULT_CONFIG.dias_disponibles,
        jornadas: raw.jornadas ?? DEFAULT_JORNADAS,
        horarios_por_dia: raw.horarios_por_dia ?? {},
        servicios_excluidos: raw.servicios_excluidos ?? DEFAULT_CONFIG.servicios_excluidos,
        mostrar_precios: raw.mostrar_precios ?? DEFAULT_CONFIG.mostrar_precios,
        servicios_precios_ocultos: raw.servicios_precios_ocultos ?? [],
        email_notificaciones: raw.email_notificaciones ?? '',
        telefono_contacto: raw.telefono_contacto ?? '',
        numero_nequi: raw.numero_nequi ?? '',
        llave_breb: raw.llave_breb ?? '',
      });
    }

    setLoading(false);
  }, [tenant.id]);

  useEffect(() => {
    if (tenant?.id) {
      fetchData();
      checkWhatsAppConnection();
    }
  }, [tenant, fetchData, checkWhatsAppConnection]);

  const toggleDay = (dayValue) => {
    const isSelected = config.dias_disponibles.includes(dayValue);
    const updated = isSelected
      ? config.dias_disponibles.filter(d => d !== dayValue)
      : [...config.dias_disponibles, dayValue];
    setConfig(prev => ({ ...prev, dias_disponibles: updated }));
  };

  const toggleDayExpanded = (dayValue) =>
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayValue)) next.delete(dayValue);
      else next.add(dayValue);
      return next;
    });

  const getDayJornadas = (dayValue) =>
    config.horarios_por_dia[String(dayValue)] ?? DEFAULT_JORNADAS;

  const toggleDayJornada = (dayValue, jornadaKey) => {
    const dayKey = String(dayValue);
    const current = config.horarios_por_dia[dayKey] ?? DEFAULT_JORNADAS;
    setConfig(prev => ({
      ...prev,
      horarios_por_dia: {
        ...prev.horarios_por_dia,
        [dayKey]: {
          ...current,
          [jornadaKey]: {
            ...current[jornadaKey],
            habilitado: !current[jornadaKey].habilitado,
          },
        },
      },
    }));
  };

  const updateDayJornadaTime = (dayValue, jornadaKey, field, value) => {
    const dayKey = String(dayValue);
    const current = config.horarios_por_dia[dayKey] ?? DEFAULT_JORNADAS;
    setConfig(prev => ({
      ...prev,
      horarios_por_dia: {
        ...prev.horarios_por_dia,
        [dayKey]: {
          ...current,
          [jornadaKey]: {
            ...current[jornadaKey],
            [field]: value,
          },
        },
      },
    }));
  };

  const toggleServiceExclusion = (serviceId) => {
    const isExcluded = config.servicios_excluidos.includes(serviceId);
    const updated = isExcluded
      ? config.servicios_excluidos.filter(id => id !== serviceId)
      : [...config.servicios_excluidos, serviceId];
    setConfig(prev => ({ ...prev, servicios_excluidos: updated }));
  };

  const toggleServicePriceVisibility = (serviceId) => {
    const isHidden = config.servicios_precios_ocultos.includes(serviceId);
    const updated = isHidden
      ? config.servicios_precios_ocultos.filter(id => id !== serviceId)
      : [...config.servicios_precios_ocultos, serviceId];
    setConfig(prev => ({ ...prev, servicios_precios_ocultos: updated }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (config.dias_disponibles.length === 0) {
      showSnack('Selecciona al menos un día disponible', 'error');
      return;
    }

    for (const dayValue of config.dias_disponibles) {
      const dayName = DAYS.find(d => d.value === dayValue)?.label ?? String(dayValue);
      const dayJornadas = config.horarios_por_dia[String(dayValue)] ?? DEFAULT_JORNADAS;
      const activas = Object.entries(dayJornadas).filter(([, j]) => j.habilitado);
      if (activas.length === 0) {
        showSnack(`${dayName}: habilita al menos una jornada de atención`, 'error');
        return;
      }
      for (const [key, j] of activas) {
        if (j.inicio >= j.fin) {
          showSnack(`${dayName} — ${JORNADA_NOMBRES[key]}: la hora de inicio debe ser anterior a la hora de fin`, 'error');
          return;
        }
      }
    }

    if (
      config.email_notificaciones &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email_notificaciones.trim())
    ) {
      showSnack('El correo de notificaciones no tiene un formato válido', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      idnegocios: tenant.id,
      dias_disponibles: config.dias_disponibles,
      jornadas: config.jornadas,
      horarios_por_dia: config.horarios_por_dia,
      servicios_excluidos: config.servicios_excluidos,
      mostrar_precios: config.mostrar_precios,
      servicios_precios_ocultos: config.servicios_precios_ocultos,
      email_notificaciones: config.email_notificaciones?.trim() || null,
      telefono_contacto: config.telefono_contacto?.trim() || null,
      numero_nequi: config.numero_nequi?.trim() || null,
      llave_breb: config.llave_breb?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('bot_config')
      .upsert(payload, { onConflict: 'idnegocios' });

    if (error) {
      showSnack('Error al guardar configuración: ' + error.message, 'error');
      setSaving(false);
      return;
    }

    await insertLog({
      accion: 'UPDATE',
      entidad: 'Bot Config',
      descripcion: 'Se actualizó la configuración del bot de WhatsApp',
      idUsuario: user.idusuario || user.id,
      idNegocios: tenant.id,
    });

    showSnack('Configuración guardada correctamente');
    setSaving(false);
  };

  const fmt = (n) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) {
    return (
      <div className="bot-config-container">
        <div className="page-header">
          <div>
            <h2>Configuración del Bot</h2>
            <p className="bot-config-subtitle">Cargando...</p>
          </div>
        </div>
        <div className="bot-config-skeletons">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton bot-config-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bot-config-container">
      <div className="page-header">
        <div>
          <h2>Configuración del Bot</h2>
          <p className="bot-config-subtitle">
            Personaliza cómo responde el bot de WhatsApp a tus pacientes
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bot-config-form">

        {/* Días disponibles */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h3 className="bot-config-card-title">Días de atención</h3>
              <p className="bot-config-card-desc">El bot solo ofrecerá citas en los días seleccionados</p>
            </div>
          </div>
          <div className="bot-config-days-grid">
            {DAYS.map(day => {
              const isActive = config.dias_disponibles.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`bot-config-day-btn${isActive ? ' bot-config-day-btn--active' : ''}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horario de atención — por día */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="bot-config-card-title">Horario de atención</h3>
              <p className="bot-config-card-desc">Configura el horario de atención para cada día activo</p>
            </div>
          </div>

          {config.dias_disponibles.length === 0 ? (
            <p className="bot-config-empty-hint">
              Selecciona al menos un día de atención arriba para configurar horarios.
            </p>
          ) : (
            [...config.dias_disponibles]
              .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
              .map(dayValue => {
                const dayName = DAYS.find(d => d.value === dayValue)?.label ?? '';
                const dayJornadas = getDayJornadas(dayValue);
                const isExpanded = expandedDays.has(dayValue);
                return (
                  <div key={dayValue} className="bot-config-day-schedule">
                    <button
                      type="button"
                      onClick={() => toggleDayExpanded(dayValue)}
                      className="bot-config-day-schedule-header"
                    >
                      <span className="bot-config-day-schedule-name">{dayName}</span>
                      <svg
                        className={`bot-config-day-chevron${isExpanded ? ' bot-config-day-chevron--open' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="bot-config-jornadas">
                        {JORNADAS_DEF.map(({ key, emoji, label }) => {
                          const j = dayJornadas[key];
                          return (
                            <div key={key} className={`bot-config-jornada-row${!j.habilitado ? ' bot-config-jornada-row--off' : ''}`}>
                              <div className="bot-config-jornada-info">
                                <span className="bot-config-jornada-emoji">{emoji}</span>
                                <span className="bot-config-jornada-name">{label}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleDayJornada(dayValue, key)}
                                className={`bot-config-toggle${j.habilitado ? ' bot-config-toggle--on' : ''}`}
                                aria-label={`${j.habilitado ? 'Deshabilitar' : 'Habilitar'} ${label} en ${dayName}`}
                              >
                                <span className="bot-config-toggle-thumb" />
                              </button>
                              {j.habilitado && (
                                <div className="bot-config-jornada-times">
                                  <input
                                    type="time"
                                    className="input-field input-field--sm"
                                    value={j.inicio}
                                    onChange={e => updateDayJornadaTime(dayValue, key, 'inicio', e.target.value)}
                                  />
                                  <span className="bot-config-time-sep">—</span>
                                  <input
                                    type="time"
                                    className="input-field input-field--sm"
                                    value={j.fin}
                                    onChange={e => updateDayJornadaTime(dayValue, key, 'fin', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Mostrar precios */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="bot-config-toggle-header">
              <div>
                <h3 className="bot-config-card-title">Mostrar precios en catálogo</h3>
                <p className="bot-config-card-desc">
                  {config.mostrar_precios
                    ? 'Los pacientes verán el precio de cada servicio'
                    : 'Los precios estarán ocultos en el catálogo del bot'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, mostrar_precios: !prev.mostrar_precios }))}
                className={`bot-config-toggle${config.mostrar_precios ? ' bot-config-toggle--on' : ''}`}
                aria-label="Activar/desactivar precios"
              >
                <span className="bot-config-toggle-thumb" />
              </button>
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h3 className="bot-config-card-title">Servicios disponibles en el bot</h3>
              <p className="bot-config-card-desc">
                Desmarca los servicios que no quieras mostrar en el catálogo del bot
              </p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="bot-config-empty">
              <p>No hay servicios activos registrados.</p>
            </div>
          ) : (
            <ul className="bot-config-services-list">
              {services.map(svc => {
                const isExcluded = config.servicios_excluidos.includes(svc.idservicios);
                return (
                  <li key={svc.idservicios} className="bot-config-service-item">
                    <button
                      type="button"
                      onClick={() => toggleServiceExclusion(svc.idservicios)}
                      className="bot-config-checkbox"
                      aria-label={isExcluded ? `Incluir ${svc.nombre}` : `Excluir ${svc.nombre}`}
                    >
                      <span
                        className={`bot-config-checkbox-box${!isExcluded ? ' bot-config-checkbox-box--checked' : ''}`}
                      >
                        {!isExcluded && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={`bot-config-service-name${isExcluded ? ' bot-config-service-name--excluded' : ''}`}>
                        {svc.nombre}
                      </span>
                    </button>
                    {config.mostrar_precios && !isExcluded && (
                      <button
                        type="button"
                        onClick={() => toggleServicePriceVisibility(svc.idservicios)}
                        className="bot-config-price-toggle"
                        aria-label={
                          config.servicios_precios_ocultos.includes(svc.idservicios)
                            ? `Mostrar precio de ${svc.nombre}`
                            : `Ocultar precio de ${svc.nombre}`
                        }
                      >
                        <span className={`bot-config-checkbox-box${!config.servicios_precios_ocultos.includes(svc.idservicios) ? ' bot-config-checkbox-box--checked' : ''}`}>
                          {!config.servicios_precios_ocultos.includes(svc.idservicios) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="bot-config-price-toggle-label">Mostrar precio</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Notificaciones y contacto */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h3 className="bot-config-card-title">Notificaciones y contacto</h3>
              <p className="bot-config-card-desc">
                Recibe avisos cuando el bot gestione citas, y muestra un número de contacto a tus pacientes
              </p>
            </div>
          </div>
          <div className="bot-config-notif-fields">
            <div className="bot-config-field-group">
              <label className="bot-config-field-label">
                Correo de notificaciones al admin
              </label>
              <input
                type="email"
                className="input-field"
                value={config.email_notificaciones}
                onChange={e => setConfig(prev => ({ ...prev, email_notificaciones: e.target.value }))}
                placeholder="admin@miclinica.com"
              />
              <p className="bot-config-field-hint">
                Si está vacío, no se enviarán correos al crear, editar o cancelar citas por bot.
              </p>
            </div>
            <div className="bot-config-field-group">
              <label className="bot-config-field-label">
                Teléfono de contacto directo
              </label>
              <input
                type="text"
                className="input-field"
                value={config.telefono_contacto}
                onChange={e => setConfig(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="+57 310 000 0000"
              />
              <p className="bot-config-field-hint">
                Si está vacío, el bot no mostrará número de contacto en mensajes de error.
              </p>
            </div>
            <div className="bot-config-field-group">
              <label className="bot-config-field-label">
                Número NEQUI (abono)
              </label>
              <input
                type="text"
                className="input-field"
                value={config.numero_nequi}
                onChange={e => setConfig(prev => ({ ...prev, numero_nequi: e.target.value }))}
                placeholder="3XX XXX XXXX"
              />
              <p className="bot-config-field-hint">
                Si está vacío, el bot no ofrecerá la opción de abono por NEQUI.
              </p>
            </div>
            <div className="bot-config-field-group">
              <label className="bot-config-field-label">
                Llave Bre-B (abono)
              </label>
              <input
                type="text"
                className="input-field"
                value={config.llave_breb}
                onChange={e => setConfig(prev => ({ ...prev, llave_breb: e.target.value }))}
                placeholder="Ingresa tu llave Bre-B"
              />
              <p className="bot-config-field-hint">
                Si están vacíos, el bot no ofrecerá la opción de pago anticipado.
              </p>
            </div>
          </div>
        </div>

        {/* Conexión WhatsApp */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            <h3 className="bot-config-card-title">Número de WhatsApp</h3>
          </div>
          <div className="bot-config-fields">
            <div className="bot-config-field-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 500,
                  color: waConnected ? 'var(--success)' : 'var(--text-secondary)',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: waConnected ? 'var(--success)' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }} />
                  {waConnected ? 'Número conectado' : 'Sin número conectado'}
                </span>
                {!waConnected && (
                  <button type="button" className="btn btn-primary" onClick={launchEmbeddedSignup} disabled={waConnecting}>
                    {waConnecting ? (
                      <span className="bot-config-saving">
                        <span className="spinner spinner-small" />
                        Conectando...
                      </span>
                    ) : 'Conectar número de WhatsApp'}
                  </button>
                )}
              </div>
              <p className="bot-config-field-hint">
                Conecta el número de WhatsApp Business de tu negocio para activar el bot.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bot-config-footer">
          <p className="bot-config-footer-hint">
            Los cambios se aplican inmediatamente al bot de WhatsApp
          </p>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="bot-config-saving">
                <span className="spinner spinner-small" />
                Guardando...
              </span>
            ) : 'Guardar configuración'}
          </button>
        </div>
      </form>

      {snackbar.show && (
        <div className={`bot-config-snackbar${snackbar.type === 'error' ? ' bot-config-snackbar--error' : ''}`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
