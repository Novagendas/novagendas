import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';

export default function Clients({ user }) {
  const { clients: allClients, appointments, addClient, addHistory } = useGlobalState();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch]         = useState('');
  const [form, setForm]             = useState({ doc: '', name: '', phone: '' });
  const [noteForm, setNoteForm]     = useState({ title: '', notes: '' });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm]     = useState({ doc: '', name: '', phone: '' });
  const [habeas, setHabeas]         = useState(false);

  // Especialista filter: only see assigned clients (via appointments or past clinical notes)
  const myClientIds = new Set(appointments.filter(a => a.doctor === user?.name).map(a => a.clientId));
  const clients = user?.role === 'especialista'
    ? allClients.filter(c => myClientIds.has(c.id) || c.history.some(h => h.doctor === user?.name))
    : allClients;

  // Reactive: always pick fresh from state
  const activeClient = clients.find(c => c.id === selectedId) || null;
  const filtered = clients.filter(c => search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || c.doc.includes(search));

  const handleRegister = (e) => {
    e.preventDefault();
    if (!form.doc || !form.name || !habeas) return;
    addClient(form);
    setForm({ doc: '', name: '', phone: '' });
    setHabeas(false);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.notes) return;
    addHistory(selectedId, { 
      title: noteForm.title, 
      notes: noteForm.notes, 
      doctor: user?.role === 'especialista' ? user.name : 'Administrador' 
    });
    setShowNoteModal(false);
    setNoteForm({ title: '', notes: '' });
  };

  const handleEditClient = (e) => {
    e.preventDefault();
    if (!editForm.doc || !editForm.name) return;
    updateClient(selectedId, editForm);
    setShowEditModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'flex-start' }}>

      {/* ── LEFT: Directory + Register ── */}
      <div style={{ minWidth: 350, maxWidth: 350, display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 'var(--radius)', opacity: 0.1, zIndex: 0 }} />
          <div className="card" style={{ padding: '0.85rem 1rem', background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="input-field" style={{ paddingLeft: '2.4rem', background: 'var(--bg)', fontSize: '0.875rem', border: '1px solid var(--border)' }} placeholder="Buscar paciente por nombre o documento..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.length === 0 && (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'transparent', border: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
              <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>No hay pacientes que coincidan.</p>
            </div>
          )}
          {filtered.map((p, idx) => {
            const isSelected = p.id === selectedId;
            return (
              <div
                key={p.id}
                className="animate-fade-in"
                onClick={() => setSelectedId(p.id)}
                style={{
                  animationDelay: `${idx * 40}ms`,
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                  border: `1px solid ${isSelected ? 'rgba(59,130,246,0.25)' : 'var(--border)'}`,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.12)' : 'none',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.transform = 'none'; } }}
              >
                {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--primary), var(--accent))' }} />}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                      background: isSelected ? 'var(--primary)' : 'var(--surface-3)', 
                      color: isSelected ? '#fff' : 'var(--text-2)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 800, fontSize: '1.1rem',
                      boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: isSelected ? 800 : 700, color: isSelected ? 'var(--text)' : 'var(--text-2)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.04em' }}>CC {p.doc}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: isSelected ? 'rgba(59,130,246,0.15)' : 'var(--bg)', color: isSelected ? 'var(--primary)' : 'var(--text-4)', border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}` }}>
                      {p.totalVisits} citas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Register form */}
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Nuevo Paciente</h4>
          </div>
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="input-group">
              <input className="input-field" placeholder="CC / Documento *" required value={form.doc} onChange={e => setForm({ ...form, doc: e.target.value })} style={{ background: 'var(--bg)' }} />
            </div>
            <div className="input-group">
              <input className="input-field" placeholder="Nombre Completo *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ background: 'var(--bg)' }} />
            </div>
            <div className="input-group">
              <input className="input-field" placeholder="WhatsApp (Opcional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ background: 'var(--bg)' }} />
            </div>

            <div style={{ background: habeas ? 'var(--success-light)' : 'var(--surface)', border: `1px solid ${habeas ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', transition: 'var(--transition)' }}>
              <input type="checkbox" id="habeas" checked={habeas} onChange={e => setHabeas(e.target.checked)} required style={{ marginTop: 2, accentColor: habeas ? 'var(--success)' : 'var(--text-4)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }} />
              <label htmlFor="habeas" style={{ fontSize: '0.72rem', color: habeas ? 'var(--success)' : 'var(--text-4)', fontWeight: 600, lineHeight: 1.45, cursor: 'pointer', transition: 'var(--transition)' }}>
                Autorizo el tratamiento de datos clínicos y personales (Ley 1581 Habeas Data).
              </label>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={!habeas} style={{ padding: '0.8rem', fontSize: '0.9rem', opacity: habeas ? 1 : 0.6 }}>
              Aperturar Historial Clínico
            </button>
          </form>
        </div>
      </div>

      {/* ── RIGHT: Clinical Record ── */}
      <div className="card w-full" style={{ padding: 0, overflow: 'hidden', flex: 1, height: '82vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-glass)', backdropFilter: 'blur(20px)' }}>
        {activeClient ? (
          <div key={activeClient.id} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            
            {/* Fancy Profile Banner */}
            <div style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.05) 100%)', padding: '2.5rem 2rem 2rem', borderBottom: '1px solid var(--border)' }}>
              {/* Decorative background shapes */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', opacity: 0.5, pointerEvents: 'none', transform: 'translate(30%, -30%)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1, gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ ...avatarGlowStyle(activeClient.name.charAt(0)) }}>
                    {activeClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>
                      {activeClient.name}
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.85rem', color: 'var(--text-3)', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> C.C. {activeClient.doc}</span>
                      {activeClient.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> {activeClient.phone}</span>}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {/* Edit Button */}
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditForm({ doc: activeClient.doc, name: activeClient.name, phone: activeClient.phone }); setShowEditModal(true); }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} title="Editar Paciente">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  {/* Stats Pill */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem 1.5rem', textAlign: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Asistencias</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                      <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 900, lineHeight: 1 }}>{activeClient.totalVisits}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 700 }}>citas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History section */}
            <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Evoluciones Clínicas</h3>
                </div>
                
                <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', gap: '0.5rem', borderRadius: 10, boxShadow: '0 4px 12px var(--primary-glow)' }} onClick={() => setShowNoteModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nueva Evolución
                </button>
              </div>

              {activeClient.history.length === 0 ? (
                <div className="card animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-4)', boxShadow: 'var(--shadow-sm)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-2)', fontWeight: 800, fontSize: '1.2rem' }}>Historial en blanco</h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-4)', maxWidth: 300, textAlign: 'center' }}>Este paciente aún no tiene registros clínicos. Asegúrate de registrar los procedimientos realizados.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Timeline connecting line */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }} />
                    
                    {activeClient.history.map((hist, idx) => (
                      <div
                        key={hist.id || idx}
                        className="animate-fade-in"
                        style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1, animationDelay: `${idx * 100}ms` }}
                      >
                        {/* Timeline dot */}
                        <div style={{ width: 50, display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: '1.25rem' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--surface)', border: '3px solid var(--primary)', boxShadow: '0 0 0 4px var(--bg), 0 0 12px var(--primary-glow)' }} />
                        </div>
                        
                        {/* Content Card */}
                        <div style={{ 
                          flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem',
                          boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>{hist.date}</span>
                              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{hist.title}</h4>
                            </div>
                            {hist.doctor && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                                {hist.doctor}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ background: 'var(--surface-2)', padding: '1rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--border)' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{hist.notes}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state animate-fade-in" style={{ border: 'none', height: '100%', flex: 1, background: 'transparent' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--text-4)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: '1.3rem' }}>Ningún paciente seleccionado</h3>
            <p style={{ margin: '0.5rem 0 0', maxWidth: 380, fontSize: '0.95rem', color: 'var(--text-3)', lineHeight: 1.6 }}>Elige un paciente del directorio a la izquierda para ver su ficha clínica, o registra uno nuevo usando el formulario.</p>
          </div>
        )}
      </div>

      {/* ── Note Modal (Glassmorphism) ── */}
      {showNoteModal && (
        <div className="modal-overlay animate-fade-in" onClick={e => e.target === e.currentTarget && setShowNoteModal(false)} style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 540, padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Registro Médico</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Añadir Evolución</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-3)' }}>Paciente: <strong style={{ color: 'var(--text)' }}>{activeClient?.name}</strong></p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNoteModal(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveNote} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>Procedimiento / Servicio Realizado</label>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  <input className="input-field" placeholder="Ej. Toxina Botulínica 3 Zonas..." value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} required style={{ paddingLeft: '2.5rem', background: 'var(--surface)' }} />
                </div>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>Anotaciones Clínicas Detalladas</label>
                <textarea className="input-field" rows="6" placeholder="Describe los detalles de la sesión:&#10;• Dosis y productos aplicados&#10;• Zonas tratadas&#10;• Reacciones del paciente&#10;• Indicaciones post-tratamiento dadas" value={noteForm.notes} onChange={e => setNoteForm({ ...noteForm, notes: e.target.value })} required style={{ background: 'var(--surface)', resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              
              <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--text-4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                  {user?.name?.charAt(0) || 'AD'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600 }}>Firma digital del profesional</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', fontWeight: 700 }}>{user?.role === 'especialista' ? user.name : 'Administrador'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.85rem', borderRadius: 12 }} onClick={() => setShowNoteModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.85rem', borderRadius: 12, boxShadow: '0 4px 16px var(--primary-glow)' }}>Generar Evolución Oficial</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Patient Modal ── */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in" onClick={e => e.target === e.currentTarget && setShowEditModal(false)} style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480, padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Editar Paciente</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleEditClient} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>CC / Documento</label>
                <input className="input-field" required value={editForm.doc} onChange={e => setEditForm({ ...editForm, doc: e.target.value })} style={{ background: 'var(--surface)' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>Nombre Completo</label>
                <input className="input-field" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ background: 'var(--surface)' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>WhatsApp (Opcional)</label>
                <input className="input-field" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ background: 'var(--surface)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.85rem', borderRadius: 12 }} onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.85rem', borderRadius: 12, boxShadow: '0 4px 16px var(--primary-glow)' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para generar avatares con gradiente aleatorio constante basado en la letra
function avatarGlowStyle(char) {
  const charCode = char.charCodeAt(0);
  const gradients = [
    'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
  ];
  const shadows = [
    '0 4px 16px rgba(59,130,246,0.35)',
    '0 4px 16px rgba(236,72,153,0.3)',
    '0 4px 16px rgba(16,185,129,0.3)',
    '0 4px 16px rgba(245,158,11,0.25)',
    '0 4px 16px rgba(6,182,212,0.3)',
  ];
  const idx = charCode % gradients.length;
  
  return {
    width: 80, height: 80, borderRadius: '24px', flexShrink: 0,
    background: gradients[idx], color: '#fff', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    fontSize: '2.5rem', fontWeight: 800,
    boxShadow: shadows[idx],
  };
}
