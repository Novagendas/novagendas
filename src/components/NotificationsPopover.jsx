import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../Supabase/supabaseClient';

export default function NotificationsPopover({ user, tenant }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const [readLogs, setReadLogs] = useState(() => {
    const saved = localStorage.getItem(`read_logs_${user.idusuario || user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showAllModal, setShowAllModal] = useState(false);

  const fetchLogs = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    
    let query = supabase
      .from('logsnegocio')
      .select('*, usuario(nombre, apellido)')
      .eq('idnegocios', tenant.id)
      .order('fecha', { ascending: false });

    if (user.role === 'especialista') {
      const myName = user.name || '';
      const first = myName.split(' ')[0].replace('Dra.', '').replace('Dr.', '').trim();
      // Buscamos logs donde el especialista sea el autor O sea mencionado en la descripción
      query = query.or(`idusuario.eq.${user.idusuario || user.id},descripcion.ilike.%${first}%`);
    }

    const { data } = await query.limit(100);
    
    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  const markAsRead = (id) => {
    const newRead = [...readLogs, id];
    setReadLogs(newRead);
    localStorage.setItem(`read_logs_${user.idusuario || user.id}`, JSON.stringify(newRead));
  };

  const unreadLogs = logs.filter(l => !readLogs.includes(l.idlog));
  const hasUnread = unreadLogs.length > 0;

  // Handle click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button 
        className="btn-ghost"
        onClick={() => setOpen(!open)}
        title="Notificaciones"
        style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', background: open ? 'var(--surface-overlay)' : 'transparent', transition: 'var(--transition)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {hasUnread && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--surface)', animation: 'pulse 2s infinite' }} />}
      </button>

      {open && (
        <div className="card animate-fade-up" style={{ 
          position: 'absolute', top: '100%', right: -10, marginTop: '0.5rem', width: 340, 
          padding: 0, overflow: 'hidden', zIndex: 1000, boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{ background: 'var(--surface-2)', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Notificaciones</h4>
            <button 
              onClick={() => { 
                const allIds = logs.map(l => l.idlog);
                setReadLogs(allIds); 
                localStorage.setItem(`read_logs_${user.idusuario || user.id}`, JSON.stringify(allIds)); 
              }} 
              style={{ border: '1px solid var(--primary)', background: 'var(--primary-light)', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-light)'}
            >
              MARCAR TODO LEÍDO
            </button>
          </div>
          
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-4)' }}>Cargando actividad...</div>
            ) : unreadLogs.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-4)', fontWeight: 600 }}>¡Estás al día!</p>
              </div>
            ) : unreadLogs.map(log => (
              <div key={log.idlog} className="notif-item" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'var(--surface)', position: 'relative' }}>
                <div style={{ 
                  width: 32, height: 32, flexShrink: 0, borderRadius: 8, 
                  background: log.accion === 'CREATE' ? 'var(--success-light)' : log.accion === 'DELETE' ? 'var(--danger-light)' : 'var(--primary-light)',
                  color: log.accion === 'CREATE' ? 'var(--success)' : log.accion === 'DELETE' ? 'var(--danger)' : 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800
                }}>
                   {log.accion === 'CREATE' ? 'C' : log.accion === 'DELETE' ? 'D' : 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.4, fontWeight: 500 }}>{log.descripcion}</p>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-4)', fontWeight: 600 }}>{new Date(log.fecha).toLocaleString('es-CO', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                </div>
                <button 
                  onClick={() => markAsRead(log.idlog)}
                  className="btn-read"
                  title="Marcar como leída"
                  style={{ border: 'none', background: 'var(--bg-subtle)', color: 'var(--text-4)', width: 24, height: 24, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface-2)', padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 700 }} onClick={() => fetchLogs()}>Refrescar</button>
            <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }} onClick={() => setShowAllModal(true)}>Ver historial completo</button>
          </div>
        </div>
      )}

      {/* Modal Historial Completo */}
      {showAllModal && (
        <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={() => setShowAllModal(false)}>
          <div className="modal-box" style={{ maxWidth: 800, width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
             <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Historial de Notificaciones</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAllModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
             </div>
             <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Acción</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.idlog}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{new Date(log.fecha).toLocaleString()}</td>
                        <td><span className={`badge ${log.accion === 'CREATE' ? 'badge-success' : 'badge-primary'}`}>{log.accion}</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{log.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
