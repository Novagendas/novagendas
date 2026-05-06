import React, { useState, useEffect, useCallback } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';
import './Clients.css';

export default function Clients({ user, tenant }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ doc: '', name: '', email: '', phone: '' });
  const [noteForm, setNoteForm] = useState({ title: '', notas: '' });
  const [emailError, setEmailError] = useState('');

  const isValidEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Snackbar
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editForm, setEditForm] = useState({ doc: '', name: '', email: '', phone: '' });
  const [habeas, setHabeas] = useState(false);

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
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
      .is('deleted_at', null)
      .order('fecharegistro', { ascending: false });

    if (error) {
      console.error("Error cargando clientes:", error);
    } else if (dbClients) {
      const mapped = dbClients.map(c => {
        const history = (c.historialclinico || []).map(h => ({
          id: h.idhistorial,
          date: new Date(h.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }),
          title: h.titulo,
          notas: h.notas,
          doctor: h.especialista,
          rawDate: h.fecha
        })).sort((a, b) => b.id - a.id);

        return {
          id: c.idcliente,
          doc: c.cedula || '',
          name: `${c.nombre} ${c.apellido}`,
          email: c.email || '',
          phone: c.telefono || '',
          totalVisits: history.length,
          lastVisit: history.length > 0 ? history[0].date : 'Nuevo',
          history
        };
      });
      setClients(mapped);
    }
    setLoading(false);
  }, [tenant.id]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [tenant, fetchData]);

  const [assignedClientIds, setAssignedClientIds] = useState([]);

  useEffect(() => {
    if (user?.role === 'especialista' && tenant?.id) {
      const fetchAssigned = async () => {
        const { data } = await supabase.from('cita').select('idcliente').eq('idusuario', user.idusuario || user.id);
        if (data) setAssignedClientIds([...new Set(data.map(d => d.idcliente))]);
      };
      fetchAssigned();
    }
  }, [user, tenant]);

  const [proxCita, setProxCita] = useState(null);
  const [proxCitaLoad, setProxCitaLoad] = useState(false);

  useEffect(() => {
    if (!selectedId || !tenant?.id) { setProxCita(null); return; }
    setProxCitaLoad(true);
    supabase
      .from('cita')
      .select(`idcita, fechahorainicio, estadocita(descripcion), citaservicios(servicios(nombre))`)
      .eq('idnegocios', tenant.id)
      .eq('idcliente', selectedId)
      .gte('fechahorainicio', new Date().toISOString())
      .is('deleted_at', null)
      .order('fechahorainicio', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setProxCita(data || null); setProxCitaLoad(false); });
  }, [selectedId, tenant?.id]);

  // Especialista filter: Solo ver clientes asignados en citas o con historial previo
  const visibleClients = user?.role === 'especialista'
    ? clients.filter(c => assignedClientIds.includes(c.id) || c.history.some(h => h.doctor === user?.name))
    : clients;

  const activeClient = clients.find(c => c.id === selectedId) || null;
  const filtered = visibleClients.filter(c => 
    search === '' || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.doc && c.doc.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) {
      setEmailError('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (!form.doc || !form.name || !form.phone || !habeas) return;
    setSaving(true);

    const parts = form.name.trim().split(' ');
    const nombre = parts[0];
    const apellido = parts.slice(1).join(' ') || '.';

    const { error } = await supabase.from('cliente').insert([{
      nombre,
      apellido,
      cedula: form.doc,
      email: form.email,
      telefono: form.phone,
      idnegocios: tenant.id
    }]);

    if (!error) {
      setForm({ doc: '', name: '', email: '', phone: '' });
      setHabeas(false);
      setShowRegisterModal(false);
      setSaving(false);

      insertLog({
        accion: 'CREATE',
        entidad: 'Paciente',
        descripcion: `Se registró al paciente '${form.name}'`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      showSnack('Paciente registrado correctamente');
      fetchData();
    } else {
      setSaving(false);
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

    if (!error) {
      setShowNoteModal(false);
      setNoteForm({ title: '', notas: '' });
      setSaving(false);

      insertLog({
        accion: 'CREATE',
        entidad: 'Evolución Clínica',
        descripcion: `Se añadió una evolución para ${activeClient?.name}: '${noteForm.title}'`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      showSnack('Evolución clínica guardada');
      fetchData(); // Reload history
    } else {
      setSaving(false);
      alert("Error insertando evolución médica: " + error.message);
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    if (!isValidEmail(editForm.email)) {
      setEmailError('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (!editForm.doc || !editForm.name || !editForm.phone || !selectedId) return;
    setSaving(true);

    const parts = editForm.name.trim().split(' ');
    const nombre = parts[0];
    const apellido = parts.slice(1).join(' ') || '.';

    const { error } = await supabase.from('cliente').update({
      nombre,
      apellido,
      cedula: editForm.doc,
      email: editForm.email,
      telefono: editForm.phone
    }).eq('idcliente', selectedId);

    if (!error) {
      setShowEditModal(false);
      setSaving(false);

      insertLog({
        accion: 'UPDATE',
        entidad: 'Paciente',
        descripcion: `Se actualizaron los datos de '${activeClient?.name}'`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      showSnack('Datos actualizados correctamente');
      fetchData();
    } else {
      setSaving(false);
      alert("Error actualizando paciente: " + error.message);
    }
  };

  return (
    <div className="animate-fade-in clients-container">

      {/* ── LEFT: Directory + Register ── */}
      <div className={`clients-directory${selectedId ? '' : ' clients-directory--expanded'}`}>
        {/* Search */}
        <div className="clients-search-card-wrapper">
          <div className="clients-search-card">
            <div className="clients-search-input-wrapper">
              <svg className="clients-search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input className="input-field clients-search-input-field" placeholder="Buscar paciente por nombre o documento..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {user?.role !== 'especialista' && (
          <button className="btn btn-primary clients-add-btn" onClick={() => setShowRegisterModal(true)}>
            + Nuevo Paciente
          </button>
        )}

        {/* Patient List */}
        <div className="clients-list">
          {loading ? (
            <div className="client-directory-loading">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton client-skeleton-item" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="animate-fade-in client-directory-empty">
              <span className="client-directory-empty-icon">📭</span>
              <p className="client-directory-empty-text">No hay pacientes que coincidan.</p>
            </div>
          ) : filtered.map((p, idx) => {
            const isSelected = p.id === selectedId;
            return (
              <div
                key={p.id}
                className={`animate-fade-in client-item ${isSelected ? 'client-item--selected' : ''}`}
                onClick={() => setSelectedId(p.id)}
                style={{ '--delay': `${idx * 40}ms`, animationDelay: 'var(--delay)' }}
              >
                {isSelected && <div className="client-item-indicator" />}

                <div className="client-item-content">
                  <div className="client-item-left">
                    <div className="client-item-avatar">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-item-info">
                      <p className="client-item-name">{p.name}</p>
                      <div className="client-item-sub">
                        <span className="client-item-doc">ID: {p.doc}</span>
                        <span className="client-item-dot">•</span>
                        <span className="client-item-visit">{p.lastVisit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="client-item-right">
                    <div className="client-item-badge">
                      {p.totalVisits} {p.totalVisits === 1 ? 'Nota' : 'Notas'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Clinical Record ── */}
      <div className="card client-record-card">
        {activeClient ? (
          <div key={activeClient.id} className="animate-fade-in client-record-content">

            {/* Fancy Profile Banner */}
            <div className="client-banner">
              {/* Decorative background shapes */}
              <div className="client-banner-shapes" />

              <div className="client-banner-inner">
                <div className="client-banner-left">
                  <div 
                    className="avatar-glow-base avatar-glow--lg"
                    style={avatarGlowVars(activeClient.name.charAt(0))}
                  >
                    {activeClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="client-banner-info">
                    <h2>{activeClient.name}</h2>
                    <div className="client-tags">
                      <div className="client-tags-row">
                        <span className="client-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> C.C. {activeClient.doc}</span>
                        {activeClient.phone && <span className="client-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> {activeClient.phone}</span>}
                      </div>
                      {(activeClient.email || user?.role !== 'especialista') && (
                        <div className="client-tags-row client-tags-row--email">
                          {activeClient.email && <span className="client-tag client-tag--email"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> {activeClient.email}</span>}
                          {user?.role !== 'especialista' && (
                            <button className="btn btn-ghost btn-icon client-edit-btn" onClick={() => { setEditForm({ doc: activeClient.doc, name: activeClient.name, email: activeClient.email, phone: activeClient.phone }); setShowEditModal(true); }} title="Editar Paciente">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="client-banner-actions">
                  {/* Stats Pill */}
                  <div className="client-record-stats">
                    <p className="client-record-stats-label">Registros</p>
                    <div className="client-record-stats-value-group">
                      <h3 className="client-record-stats-number">{activeClient.totalVisits}</h3>
                      <span className="client-record-stats-unit">notas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Próxima Cita */}
            {proxCitaLoad ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', color: 'var(--text-4)', fontSize: '0.82rem' }}>
                <span className="spinner-mini" style={{ width: 12, height: 12 }} /> Cargando próxima cita...
              </div>
            ) : proxCita ? (() => {
              const fecha = new Date(proxCita.fechahorainicio);
              const serviciosNombres = proxCita.citaservicios?.map(cs => cs.servicios?.nombre).filter(Boolean).join(', ') || '—';
              const estadoDesc = proxCita.estadocita?.descripcion || 'Pendiente';
              const estadoColor = estadoDesc === 'Completada' ? '#16a34a' : estadoDesc === 'Cancelada' ? '#dc2626' : '#2563eb';
              return (
                <div style={{ margin: '0.5rem 1.25rem', padding: '0.7rem 1rem', background: 'var(--primary-light)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary)' }}>Próxima cita: </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                      {fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · {fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-4)', marginLeft: '0.4rem' }}>{serviciosNombres}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, background: `${estadoColor}18`, color: estadoColor, padding: '2px 8px', borderRadius: 99, border: `1px solid ${estadoColor}25`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {estadoDesc}
                  </span>
                </div>
              );
            })() : null}

            {/* History section */}
            <div className="clinical-history-section">
              <div className="clinical-history-header">
                <div className="clinical-history-title">
                  <div className="clinical-history-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  </div>
                  <h3>Evoluciones</h3>
                </div>

                <button className="btn btn-primary new-evolution-btn" onClick={() => setShowNoteModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Nueva Evolución
                </button>
              </div>

              {activeClient.history.length === 0 ? (
                <div className="card animate-fade-in history-empty-state">
                  <div className="history-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  <h4>Historial en blanco</h4>
                  <p>Este paciente aún no tiene registros clínicos. Asegúrate de registrar los procedimientos realizados.</p>
                </div>
              ) : (
                <div className="timeline-wrapper">
                  {/* Timeline connecting line */}
                  <div className="timeline-container">
                    <div className="timeline-line" />

                    {activeClient.history.map((hist, idx) => (
                      <div
                        key={hist.id || idx}
                        className="animate-fade-in timeline-item"
                        style={{ '--delay': `${idx * 100}ms`, animationDelay: 'var(--delay)' }}
                      >
                        {/* Timeline dot */}
                        <div className="timeline-dot-container">
                          <div className="timeline-dot" />
                        </div>

                        {/* Content Card */}
                        <div className="timeline-card">
                          <div className="timeline-card-header">
                            <div>
                              <span className="timeline-date">{hist.date}</span>
                              <h4 className="timeline-title">{hist.title}</h4>
                            </div>
                            {hist.doctor && (
                              <span className="doctor-badge">
                                <div className="doctor-badge-dot" />
                                {hist.doctor}
                              </span>
                            )}
                          </div>

                          <div className="timeline-notes-box">
                            <p className="timeline-notes">{hist.notas}</p>
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
          <div className="empty-state animate-fade-in client-selection-empty">
            <div className="client-selection-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3>Ningún paciente seleccionado</h3>
            <p>Elige un paciente del directorio a la izquierda para ver su ficha clínica, o registra uno nuevo usando el formulario.</p>
          </div>
        )}
      </div>

      {/* ── Note Modal ── */}
      {showNoteModal && (
        <div className="modal-overlay animate-fade-in" onClick={e => !saving && e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="modal-content animate-scale-in max-w-md">
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <div className="client-modal-icon-box client-modal-icon-box--primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </div>
                <div className="client-modal-title-group">
                  <h3>Nueva Evolución Clínica</h3>
                  <p className="client-modal-subtitle">Registrando en la ficha de {activeClient.name}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowNoteModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveNote} className="client-modal-form">
              <div className="input-group">
                <label>Servicio Realizado</label>
                <SuggestionInput 
                  placeholder="Ej. Aplicación de Toxina Botulínica" 
                  value={noteForm.title} 
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} 
                  required 
                  suggestions={commonTerms} 
                />
              </div>
              <div className="input-group">
                <label>Observaciones de la Evolución</label>
                <textarea className="input-field" rows="5" placeholder="Describe los detalles clínicos..." value={noteForm.notas} onChange={e => setNoteForm({ ...noteForm, notas: e.target.value })} required spellCheck="true" lang="es" />
              </div>

              <div className="client-signature-box">
                <div className="client-signature-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div>
                  <p className="client-signature-label">Firma del Especialista</p>
                  <p className="client-signature-name">{user?.name || 'Doctor/a'}</p>
                </div>
              </div>

              <div className="client-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowNoteModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Firmar y Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Patient Modal ── */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in" onClick={e => !saving && e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content animate-scale-in max-w-md">
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <div className="client-modal-icon-box client-modal-icon-box--accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="client-modal-title-group">
                  <h3>Editar Paciente</h3>
                  <p className="client-modal-subtitle">Actualizando información general</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleEditClient} noValidate className="client-modal-form">
              <div className="input-group">
                <label>Documento de Identidad</label>
                <input className="input-field" required value={editForm.doc} onChange={e => setEditForm({ ...editForm, doc: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Nombre Completo</label>
                <input className="input-field capitalize-text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} spellCheck="true" lang="es" />
              </div>
              <div className="client-form-grid">
                <div className="input-group">
                  <label>Teléfono / WhatsApp *</label>
                  <input className="input-field" required value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className={emailError ? 'label-error' : ''}>Correo Electrónico</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      className={`input-field ${emailError ? 'input-error' : ''}`}
                      value={editForm.email} 
                      onChange={e => { 
                        setEditForm({ ...editForm, email: e.target.value }); 
                        if (emailError) setEmailError('');
                      }} 
                    />
                    {emailError && (
                      <div className="animate-fade-in error-message-small">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {emailError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="client-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
          <div className="modal-content animate-scale-in max-w-md">
            <div className="client-modal-header">
              <div className="client-modal-header-info">
                <div className="client-modal-icon-box client-modal-icon-box--primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <div className="client-modal-title-group">
                  <h3>Nuevo Paciente</h3>
                  <p className="client-modal-subtitle">Apertura de ficha clínica general</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowRegisterModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleRegisterClient} noValidate className="client-modal-form">
              <div className="input-group">
                <label className="label-caps">Documento de Identidad *</label>
                <input className="input-field rounded-xl" required value={form.doc} onChange={e => setForm({ ...form, doc: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="label-caps">Nombre Completo *</label>
                <input className="input-field capitalize-text rounded-xl" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} spellCheck="true" lang="es" />
              </div>
              <div className="client-form-grid">
                <div className="input-group">
                  <label className="label-caps">Teléfono / WhatsApp *</label>
                  <input className="input-field rounded-xl" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className={`label-caps ${emailError ? 'label-error' : ''}`}>Correo Electrónico</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      className={`input-field rounded-xl ${emailError ? 'input-error' : ''}`}
                      value={form.email} 
                      onChange={e => { 
                        setForm({ ...form, email: e.target.value }); 
                        if (emailError) setEmailError('');
                      }} 
                    />
                    {emailError && (
                      <div className="animate-fade-in error-message-small">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {emailError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`client-habeas-box ${habeas ? 'client-habeas-box--checked' : ''}`}>
                <input type="checkbox" id="habeas" checked={habeas} onChange={e => setHabeas(e.target.checked)} required className="client-habeas-checkbox" />
                <label htmlFor="habeas" className="client-habeas-label">
                  Autorizo el tratamiento de mis datos personales y clínicos de acuerdo a la Ley 1581 de Habeas Data y la política de privacidad.
                </label>
              </div>

              <div className="client-modal-footer">
                <button type="button" className="btn btn-secondary btn-large flex-1 rounded-xl" onClick={() => setShowRegisterModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-large flex-2 rounded-xl register-submit-btn" disabled={!habeas || saving}>
                  {saving ? 'Procesando...' : 'Aperturar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Snackbar */}
      {snackbar.show && (
        <div className={`client-snackbar ${snackbar.type === 'success' ? 'client-snackbar--success' : 'client-snackbar--error'}`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}

function avatarGlowVars(char) {
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
    // Acceso seguro: usamos .at() para acceder al array sin riesgo de inyección
    '--glow-bg': gradients.at(idx),
    '--glow-shadow': shadows.at(idx),
  };
}
