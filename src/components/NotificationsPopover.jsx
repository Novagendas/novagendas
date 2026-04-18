import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../Supabase/supabaseClient';

export default function NotificationsPopover({ user, tenant }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchLogs = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('logsnegocio')
      .select('*, usuario(nombre, apellido)')
      .eq('idnegocios', tenant.id)
      .order('fecha', { ascending: false })
      .limit(30);
    
    if (data) {
      if (user.role === 'especialista') {
        const myName = user.name.split(' ')[0]; // We filter simplistic by first name if present in description
        setLogs(data.filter(l => l.descripcion.includes(myName) || l.idusuario === user.id || l.descripcion.includes(user.name)));
      } else {
        setLogs(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

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
        <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--surface)' }} />
      </button>

      {open && (
        <div className="card animate-fade-up" style={{ 
          position: 'absolute', top: '100%', right: -10, marginTop: '0.5rem', width: 340, 
          padding: 0, overflow: 'hidden', zIndex: 1000, boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{ background: 'var(--surface-2)', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Notificaciones</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 600, background: 'var(--border)', padding: '2px 8px', borderRadius: 10 }}>{user.role}</span>
          </div>
          
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-4)' }}>Cargando actividad...</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-4)' }}>No hay notificaciones recientes.</div>
            ) : logs.map(log => (
              <div key={log.idlog} style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'var(--surface)' }}>
                <div style={{ 
                  width: 32, height: 32, flexShrink: 0, borderRadius: 8, 
                  background: log.accion === 'CREATE' ? 'var(--success-light)' : log.accion === 'DELETE' ? 'var(--danger-light)' : 'var(--primary-light)',
                  color: log.accion === 'CREATE' ? 'var(--success)' : log.accion === 'DELETE' ? 'var(--danger)' : 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800
                }}>
                   {log.accion === 'CREATE' ? 'C' : log.accion === 'DELETE' ? 'D' : 'U'}
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.3 }}>{log.descripcion}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 600 }}>{new Date(log.fecha).toLocaleString('es-CO', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface-2)', padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <button className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => fetchLogs()}>Refrescar</button>
          </div>
        </div>
      )}
    </div>
  );
}
