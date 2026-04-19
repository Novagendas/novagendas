import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';

export default function LogsView({ tenant, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('logsnegocio')
      .select(`
        *,
        usuario (nombre, apellido)
      `)
      .eq('idnegocios', tenant.id)
      .order('fecha', { ascending: false });

    if (user?.role === 'especialista') {
      const myName = user.name || '';
      const first = myName.split(' ')[0].replace('Dra.', '').replace('Dr.', '').trim();
      query = query.or(`idusuario.eq.${user.idusuario || user.id},descripcion.ilike.%${first}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [tenant.id]);

  return (
    <div className="animate-fade-in" style={{ padding: '0.5rem' }}>
      <div className="card" style={{ padding: 0, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-overlay)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Movimientos y Auditoría</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-3)' }}>Trazabilidad completa de acciones en el negocio</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchLogs} style={{ padding: '0.6rem 1rem' }}>
             ↻ Actualizar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                {['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción'].map(h => (
                  <th key={h} style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-4)' }}>Cargando registros...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-4)' }}>No hay movimientos registrados.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.idlog} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-glass)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                        {log.usuario?.nombre?.charAt(0) || 'U'}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.usuario ? `${log.usuario.nombre} ${log.usuario.apellido}` : 'Usuario desconocido'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                      background: log.accion === 'CREATE' ? 'var(--success-light)' : log.accion === 'DELETE' ? 'var(--danger-light)' : 'var(--primary-light)',
                      color: log.accion === 'CREATE' ? 'var(--success)' : log.accion === 'DELETE' ? 'var(--danger)' : 'var(--primary)',
                      border: `1px solid ${log.accion === 'CREATE' ? 'rgba(16,185,129,0.2)' : log.accion === 'DELETE' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`
                    }}>
                      {log.accion}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)' }}>{log.entidad}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-3)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
