import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../Supabase/supabaseClient';
import './NotificationsPopover.css';

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
      query = query.or(`idusuario.eq.${user.idusuario || user.id},descripcion.ilike.%${first}%`);
    }

    const { data } = await query.limit(100);
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchLogs();
  }, [open]);

  const markAsRead = (id) => {
    const newRead = [...readLogs, id];
    setReadLogs(newRead);
    localStorage.setItem(`read_logs_${user.idusuario || user.id}`, JSON.stringify(newRead));
  };

  const unreadLogs = logs.filter(l => !readLogs.includes(l.idlog));
  const hasUnread = unreadLogs.length > 0;

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="notif-container" ref={containerRef}>
      <button 
        className={`notif-btn ${open ? 'notif-btn--open' : ''}`}
        onClick={() => setOpen(!open)}
        title="Notificaciones"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {hasUnread && <div className="notif-badge" />}
      </button>

      {open && (
        <div className="notif-popover animate-fade-up">
          <div className="notif-header">
            <h4>Notificaciones</h4>
            <button 
              className="notif-mark-read"
              onClick={() => { 
                const allIds = logs.map(l => l.idlog);
                setReadLogs(allIds); 
                localStorage.setItem(`read_logs_${user.idusuario || user.id}`, JSON.stringify(allIds)); 
              }} 
            >
              MARCAR TODO LEÍDO
            </button>
          </div>
          
          <div className="notif-scroll">
            {loading ? (
              <div className="notif-loading">Cargando actividad...</div>
            ) : unreadLogs.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">✨</span>
                <p>¡Estás al día!</p>
              </div>
            ) : unreadLogs.map(log => (
              <div key={log.idlog} className="notif-item">
                <div className={`notif-icon notif-icon--${log.accion.toLowerCase()}`}>
                   {log.accion === 'CREATE' ? 'C' : log.accion === 'DELETE' ? 'D' : 'U'}
                </div>
                <div className="notif-content">
                  <p className="notif-desc">{log.descripcion}</p>
                  <p className="notif-date">
                    {new Date(log.fecha).toLocaleString('es-CO', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <button 
                  onClick={() => markAsRead(log.idlog)}
                  className="notif-action-btn"
                  title="Marcar como leída"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="notif-footer">
            <button className="btn-ghost" onClick={() => fetchLogs()}>Refrescar</button>
            <button className="btn-ghost text-primary" onClick={() => setShowAllModal(true)}>Ver historial completo</button>
          </div>
        </div>
      )}

      {/* Modal Historial Completo */}
      {showAllModal && (
        <div className="modal-overlay notif-history-overlay" onClick={() => setShowAllModal(false)}>
          <div className="modal-box notif-history-modal" onClick={e => e.stopPropagation()}>
             <div className="notif-modal-header">
                <h3>Historial de Notificaciones</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAllModal(false)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
             </div>
             <div className="notif-history-content">
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
                        <td className="notif-table-date">{new Date(log.fecha).toLocaleString()}</td>
                        <td><span className={`badge ${log.accion === 'CREATE' ? 'badge-success' : 'badge-primary'}`}>{log.accion}</span></td>
                        <td className="notif-table-desc">{log.descripcion}</td>
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
