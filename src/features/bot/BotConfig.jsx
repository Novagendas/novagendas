import { useState, useEffect, useCallback } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import './BotConfig.css';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const DEFAULT_CONFIG = {
  dias_disponibles: [1, 2, 3, 4, 5, 6],
  hora_inicio: '08:00',
  hora_fin: '20:00',
  servicios_excluidos: [],
  mostrar_precios: true,
};

export default function BotConfig({ user, tenant }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
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
        hora_inicio: raw.hora_inicio?.slice(0, 5) ?? DEFAULT_CONFIG.hora_inicio,
        hora_fin: raw.hora_fin?.slice(0, 5) ?? DEFAULT_CONFIG.hora_fin,
        servicios_excluidos: raw.servicios_excluidos ?? DEFAULT_CONFIG.servicios_excluidos,
        mostrar_precios: raw.mostrar_precios ?? DEFAULT_CONFIG.mostrar_precios,
      });
    }

    setLoading(false);
  }, [tenant.id]);

  useEffect(() => {
    if (tenant?.id) fetchData();
  }, [tenant, fetchData]);

  const toggleDay = (dayValue) => {
    const isSelected = config.dias_disponibles.includes(dayValue);
    const updated = isSelected
      ? config.dias_disponibles.filter(d => d !== dayValue)
      : [...config.dias_disponibles, dayValue];
    setConfig(prev => ({ ...prev, dias_disponibles: updated }));
  };

  const toggleServiceExclusion = (serviceId) => {
    const isExcluded = config.servicios_excluidos.includes(serviceId);
    const updated = isExcluded
      ? config.servicios_excluidos.filter(id => id !== serviceId)
      : [...config.servicios_excluidos, serviceId];
    setConfig(prev => ({ ...prev, servicios_excluidos: updated }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (config.dias_disponibles.length === 0) {
      showSnack('Selecciona al menos un día disponible', 'error');
      return;
    }

    if (config.hora_inicio >= config.hora_fin) {
      showSnack('La hora de inicio debe ser anterior a la hora de fin', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      idnegocios: tenant.id,
      dias_disponibles: config.dias_disponibles,
      hora_inicio: config.hora_inicio + ':00',
      hora_fin: config.hora_fin + ':00',
      servicios_excluidos: config.servicios_excluidos,
      mostrar_precios: config.mostrar_precios,
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

        {/* Horario */}
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
              <p className="bot-config-card-desc">Rango de horas en que el bot ofrecerá turnos disponibles</p>
            </div>
          </div>
          <div className="bot-config-time-row">
            <div className="form-group">
              <label className="bot-config-label">Hora de inicio</label>
              <input
                type="time"
                className="input-field"
                value={config.hora_inicio}
                onChange={e => setConfig(prev => ({ ...prev, hora_inicio: e.target.value }))}
                required
              />
            </div>
            <div className="bot-config-time-separator">—</div>
            <div className="form-group">
              <label className="bot-config-label">Hora de fin</label>
              <input
                type="time"
                className="input-field"
                value={config.hora_fin}
                onChange={e => setConfig(prev => ({ ...prev, hora_fin: e.target.value }))}
                required
              />
            </div>
          </div>
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
                    {config.mostrar_precios && (
                      <span className="bot-config-service-price">{fmt(svc.precio)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
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
