import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import './AuditLogs.css';

/* ── Badge de acción ── */
function ActionBadge({ accion }) {
  let cls = 'audit-action-badge';
  if (accion === 'CREATE') cls += ' audit-action-badge--create';
  else if (accion === 'DELETE') cls += ' audit-action-badge--delete';
  else cls += ' audit-action-badge--update';
  return <span className={cls}>{accion}</span>;
}

export default function LogsView({ tenant, user }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('logsnegocio')
      .select('*, usuario (nombre, apellido)')
      .eq('idnegocios', tenant.id)
      .order('fecha', { ascending: false });

    if (user?.role === 'especialista') {
      const myName = user.name || '';
      const first  = myName.split(' ')[0].replace('Dra.', '').replace('Dr.', '').trim();
      query = query.or(`idusuario.eq.${user.idusuario || user.id},descripcion.ilike.%${first}%`);
    }

    const { data, error } = await query;
    if (error) console.error('Error fetching logs:', error);
    else setLogs(data || []);
    setLoading(false);
  }, [tenant.id, user.idusuario, user.id, user.name, user.role]);

  useEffect(() => {
    const init = async () => {
      await fetchLogs();
    };
    init();
  }, [tenant.id, fetchLogs]);

  return (
    <div className="audit-page">
      <div className="card audit-card">

        {/* Cabecera */}
        <div className="audit-header">
          <div className="audit-header-info">
            <h2>Movimientos y Auditoría</h2>
            <p>Trazabilidad completa de acciones en el negocio</p>
          </div>
          <button className="btn btn-ghost audit-refresh-btn" onClick={fetchLogs}>
            ↻ Actualizar
          </button>
        </div>

        {/* Tabla */}
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                {['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="audit-empty-cell">
                    <div className="audit-empty-container">
                       <div className="spinner audit-spinner" />
                      <p>Cargando registros de auditoría...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="audit-empty-cell">
                    <div className="audit-empty-container">
                      <span className="audit-empty-icon">📂</span>
                      <p>No hay movimientos registrados aún.</p>
                    </div>
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.idlog}>
                  <td className="audit-date-cell">
                    {new Date(log.fecha).toLocaleString('es-CO', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <div className="audit-user-cell">
                      <div className="audit-user-avatar">
                        {log.usuario?.nombre?.charAt(0) || 'U'}
                      </div>
                      <span className="audit-user-name">
                        {log.usuario ? `${log.usuario.nombre} ${log.usuario.apellido}` : 'Usuario desconocido'}
                      </span>
                    </div>
                  </td>
                  <td><ActionBadge accion={log.accion} /></td>
                  <td className="audit-entity-cell">{log.entidad}</td>
                  <td className="audit-desc-cell">{log.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
