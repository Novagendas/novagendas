import React, { useState, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

export default function Clients({ user, tenant }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ doc: '', name: '', phone: '' });
  const [noteForm, setNoteForm] = useState({ title: '', notas: '' });

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editForm, setEditForm] = useState({ doc: '', name: '', phone: '' });
  const [habeas, setHabeas] = useState(false);

  // Fetch Data from Supabase
  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data: dbClients, error } = await supabase
      .from('cliente')
      .select(`
        idcliente, nombre, apellido, cedula, telefono, email,
        historialclinico(
          idhistorial, fecha, titulo, notas, especialista
        )
      `)
      .eq('idnegocios', tenant.id)
      .order('fecharegistro', { ascending: false });

    if (error) {
      console.error("Error cargando clientes:", error);
    } else if (dbClients) {
      const mapped = dbClients.map(c => ({
        id: c.idcliente,
        doc: c.cedula || '',
        name: `${c.nombre} ${c.apellido}`,
        phone: c.telefono || '',
        totalVisits: c.historialclinico ? c.historialclinico.length : 0,
        history: (c.historialclinico || []).map(h => ({
          id: h.idhistorial,
          date: new Date(h.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }),
          title: h.titulo,
          notas: h.notas,
          doctor: h.especialista
        })).sort((a, b) => b.id - a.id)
      }));
      setClients(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  // Especialista filter: Solo ver clientes a los que ha atendido
  const visibleClients = user?.role === 'especialista'
    ? clients.filter(c => c.history.some(h => h.doctor === user?.name))
    : clients;

  const activeClient = clients.find(c => c.id === selectedId) || null;
  const filtered = visibleClients.filter(c => search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || (c.doc && c.doc.includes(search)));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.doc || !form.name || !habeas) return;
    setSaving(true);

    const parts = form.name.trim().split(' ');
    const nombre = parts[0];
    const apellido = parts.slice(1).join(' ') || '.';

    const { error } = await supabase.from('cliente').insert([{
      nombre,
      apellido,
      cedula: form.doc,
      telefono: form.phone,
      idnegocios: tenant.id
    }]);

    setSaving(false);
    if (!error) {
      await insertLog({
        accion: 'CREATE',
        entidad: 'Paciente',
        descripcion: `Se registró al paciente '${form.name}'`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      setForm({ doc: '', name: '', phone: '' });
      setHabeas(false);
      setShowRegisterModal(false);
      fetchData();
    } else {
      alert("Error registrando paciente: " + error.message);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.notas || !selectedId) return;
    setSaving(true);

    const docName = user?.role === 'especialista' ? user.name : 'Administrador';

    const { error } = await supabase.from('historialclinico').insert([{
      idcliente: selectedId,
      titulo: noteForm.title,
      notas: noteForm.notas,
      especialista: docName,
      idnegocios: tenant.id
    }]);

    setSaving(false);
    if (!error) {
      await insertLog({
        accion: 'CREATE',
        entidad: 'Evolución Clínica',
        descripcion: `Se añadió una evolución para ${activeClient?.name}: '${noteForm.title}'`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      setShowNoteModal(false);
      setNoteForm({ title: '', notas: '' });
      fetchData(); // Reload history
    } else {
      alert("Error insertando evolución médica: " + error.message);
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    if (!editForm.doc || !editForm.name || !selectedId) return;
    setSaving(true);

    const parts = editForm.name.trim().split(' ');
    const nombre = parts[0];
    const apellido = parts.slice(1).join(' ') || '.';

    const { error } = await supabase.from('cliente').update({
      nombre,
      apellido,
      cedula: editForm.doc,
      telefono: editForm.phone
    }).eq('idcliente', selectedId);

    setSaving(false);
    if (!error) {
      await insertLog({
        accion: 'UPDATE',
        entidad: 'Paciente',
        descripcion: `Se actualizaron los datos de '${activeClient?.name}'`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      setShowEditModal(false);
      fetchData();
    } else {
      alert("Error actualizando paciente: " + error.message);
    }
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
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input className="input-field" style={{ paddingLeft: '2.4rem', background: 'var(--bg)', fontSize: '0.875rem', border: '1px solid var(--border)' }} placeholder="Buscar paciente por nombre o documento..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', position: 'sticky', top: 0, zIndex: 10 }} onClick={() => setShowRegisterModal(true)}>
          + Nuevo Paciente
        </button>

        {/* Patient List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--primary)' }}>
              <svg width="32" height="32" viewBox="0 0 50 50" style={{ animation: 'spinner 0.8s linear infinite' }}>
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="30 100" strokeLinecap="round" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'transparent', border: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
              <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>No hay pacientes que coincidan.</p>
            </div>
          ) : filtered.map((p, idx) => {
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
                      <p style={{ margin: 0, fontWeight: isSelected ? 800 : 700, color: isSelected ? 'var(--text)' : 'var(--text-2)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s', textTransform: 'capitalize' }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.04em' }}>CC {p.doc}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: isSelected ? 'rgba(59,130,246,0.15)' : 'var(--bg)', color: isSelected ? 'var(--primary)' : 'var(--text-4)', border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}` }}>
                      {p.totalVisits} reg.
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1, textTransform: 'capitalize' }}>
                      {activeClient.name}
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.85rem', color: 'var(--text-3)', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> C.C. {activeClient.doc}</span>
                      {activeClient.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> {activeClient.phone}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {/* Edit Button */}
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditForm({ doc: activeClient.doc, name: activeClient.name, phone: activeClient.phone }); setShowEditModal(true); }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} title="Editar Paciente">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  </button>
                  {/* Stats Pill */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem 1.5rem', textAlign: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Registros</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                      <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 900, lineHeight: 1 }}>{activeClient.totalVisits}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 700 }}>notas</span>
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Evoluciones Clínicas</h3>
                </div>

                <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', gap: '0.5rem', borderRadius: 10, boxShadow: '0 4px 12px var(--primary-glow)' }} onClick={() => setShowNoteModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Nueva Evolución
                </button>
              </div>

              {activeClient.history.length === 0 ? (
                <div className="card animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-4)', boxShadow: 'var(--shadow-sm)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
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
                              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.1rem', letterSpacing: '-0.01em', textTransform: 'capitalize' }}>{hist.title}</h4>
                            </div>
                            {hist.doctor && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                                {hist.doctor}
                              </span>
                            )}
                          </div>

                          <div style={{ background: 'var(--surface-2)', padding: '1rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--border)' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{hist.notas}</p>
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
        <div className="modal-overlay animate-fade-in" onClick={e => !saving && e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 540 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Evolución Médica</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>Paciente: <strong className="capitalize-text" style={{ color: 'var(--primary)' }}>{activeClient?.name}</strong></p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNoteModal(false)} style={{ borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveNote} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Tratamiento o Servicio</label>
                <input className="input-field capitalize-text" placeholder="Ej. Aplicación de Toxina Botulínica" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} required style={{ borderRadius: '12px' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Observaciones de la Evolución</label>
                <textarea className="input-field" rows="5" placeholder="Describe los detalles clínicos..." value={noteForm.notas} onChange={e => setNoteForm({ ...noteForm, notas: e.target.value })} required style={{ borderRadius: '16px', resize: 'none', padding: '1rem', lineHeight: 1.6 }} />
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--surface)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', fontWeight: 800, color: 'var(--primary)' }}>
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase' }}>Firma del Profesional</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{user?.role === 'especialista' ? user.name : 'Administrador de Sistema'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={() => setShowNoteModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '14px', padding: '0.8rem', fontSize: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }} disabled={saving}>
                  {saving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="spinner" style={{ width: '1.1rem', height: '1.1rem' }}></div>
                      Guardando...
                    </div>
                  ) : 'Confirmar Registro Clínico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Patient Modal ── */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in" onClick={e => !saving && e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.6rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Editar Paciente</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>Actualiza los datos de contacto del paciente.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)} style={{ borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleEditClient} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Documento de Identidad</label>
                <input className="input-field" required value={editForm.doc} onChange={e => setEditForm({ ...editForm, doc: e.target.value })} style={{ borderRadius: '12px' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Nombre Completo</label>
                <input className="input-field capitalize-text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ borderRadius: '12px' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Teléfono / WhatsApp</label>
                <input className="input-field" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ borderRadius: '12px' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={() => setShowEditModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '14px', padding: '0.8rem', fontSize: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Nuevo Paciente Modal ── */}
      {showRegisterModal && (
        <div className="modal-overlay animate-fade-in" onClick={e => !saving && e.target === e.currentTarget && setShowRegisterModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Nuevo Paciente</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>Crea una nueva ficha clínica para el sistema.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRegisterModal(false)} style={{ borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleRegister} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Documento de Identidad *</label>
                <input className="input-field" required value={form.doc} onChange={e => setForm({ ...form, doc: e.target.value })} style={{ borderRadius: '12px' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Nombre Completo *</label>
                <input className="input-field capitalize-text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ borderRadius: '12px' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Teléfono / WhatsApp</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ borderRadius: '12px' }} />
              </div>

              <div style={{ background: habeas ? 'var(--success-light)' : 'var(--bg-subtle)', border: `1px solid ${habeas ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, padding: '1.25rem', borderRadius: '16px', display: 'flex', gap: '0.85rem', alignItems: 'flex-start', transition: 'all 0.2s ease' }}>
                <input type="checkbox" id="habeas" checked={habeas} onChange={e => setHabeas(e.target.checked)} required style={{ marginTop: 4, accentColor: 'var(--success)', width: 18, height: 18, flexShrink: 0, cursor: 'pointer' }} />
                <label htmlFor="habeas" style={{ fontSize: '0.75rem', color: habeas ? 'var(--success)' : 'var(--text-3)', fontWeight: 600, lineHeight: 1.5, cursor: 'pointer' }}>
                  Autorizo el tratamiento de mis datos personales y clínicos de acuerdo a la Ley 1581 de Habeas Data y la política de privacidad.
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={() => setShowRegisterModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '14px', padding: '0.8rem', fontSize: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }} disabled={!habeas || saving}>
                  {saving ? 'Procesando...' : 'Aperturar Paciente'}
                </button>
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
  const charCode = (char || 'A').charCodeAt(0);
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
