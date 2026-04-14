import React, { useState, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

export default function Services({ user, tenant }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  
  // Custom Alert/Confirm Modal
  const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'alert', onConfirm: null });
  
  // Category management state
  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState(null);

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', duration: 30, price: '', color: '#3b82f6' });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  const catIcon = { Inyectables: '💉', Aparatología: '🔬', Cosmetología: '✨', Valoraciones: '📋' };
  const catColor = { Inyectables: '#6366f1', Aparatología: '#0ea5e9', Cosmetología: '#ec4899', Valoraciones: '#f59e0b' };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    if (tenant?.id) {
      fetchData();
    }
  }, [tenant]);

  // -- Custom Modal Helpers --
  const showAlert = (title, message) => setAlertConfig({ show: true, title, message, type: 'alert', onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setAlertConfig({ show: true, title, message, type: 'confirm', onConfirm });
  const closeAlert = () => setAlertConfig({ ...alertConfig, show: false });

  const fetchData = async () => {
    setLoading(true);

    const { data: catData } = await supabase
      .from('categoriaservicio')
      .select('idcategoriaservicio, descripcion')
      .eq('idnegocios', tenant.id)
      .order('idcategoriaservicio');

    if (catData) setCategories(catData);

    const { data: srvData } = await supabase
      .from('servicios')
      .select(`
        idservicios, nombre, descripcion, precio, duracion, color, imagen,
        idcategoriaservicio, categoriaservicio(descripcion)
      `)
      .eq('idnegocios', tenant.id)
      .order('idservicios');

    if (srvData) {
      const mapped = srvData.map(s => ({
        id: s.idservicios,
        name: s.nombre,
        description: s.descripcion || '',
        price: parseFloat(s.precio),
        duration: s.duracion,
        color: s.color || '#3b82f6',
        category: s.categoriaservicio?.descripcion || 'General',
        categoryId: s.idcategoriaservicio
      }));
      setServices(mapped);
    }
    setLoading(false);
  };

  const openCreate = () => {
    if (categories.length === 0) {
      showAlert('No hay categorías', 'Debes crear al menos una categoría de servicio antes de agregar tratamientos.');
      return;
    }
    setEditId(null);
    setForm({ name: '', category: categories[0].descripcion, duration: 30, price: '', color: '#3b82f6' });
    setShowModal(true);
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, category: s.category, duration: s.duration, price: s.price, color: s.color });
    setShowModal(true);
  };

  const getCategoryId = (catName) => {
    const exist = categories.find(c => c.descripcion === catName);
    return exist?.idcategoriaservicio || null;
  };

  // ----- CATEGORY CRUD ACTIONS -----
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSaving(true);

    if (editCatId) {
      // Editar
      const { error } = await supabase.from('categoriaservicio').update({ descripcion: catName }).eq('idcategoriaservicio', editCatId);
      if (!error) {
        await insertLog({
          accion: 'UPDATE',
          entidad: 'Categoría Servicio',
          descripcion: `Se actualizó la categoría '${catName}'`,
          idUsuario: user.idusuario || user.id,
          idNegocios: tenant.id
        });
        setCategories(prev => prev.map(c => c.idcategoriaservicio === editCatId ? { ...c, descripcion: catName } : c));
        if (oldCat?.descripcion) setServices(prev => prev.map(s => s.category === oldCat.descripcion ? { ...s, category: catName } : s));
        showSnack('Categoría editada');
        setCategories(prev => prev.map(c => c.idcategoriaservicio === editCatId ? { ...c, descripcion: catName } : c));
      } else showAlert('Fallo en la Edición', "Error al editar categoría: " + error.message);
    } else {
      // Crear
      const { data, error } = await supabase.from('categoriaservicio').insert([{ descripcion: catName, idnegocios: tenant.id }]).select();
      if (!error && data) {
        showSnack('Categoría creada');
        setCategories(prev => [...prev, data[0]]);
      }
      else showAlert('Fallo en la Creación', "Error al crear categoría: " + error.message);
    }

    setCatName('');
    setEditCatId(null);
    setSaving(false);
  };

  const handleDeleteCategory = (id) => {
    showConfirm('Eliminar Categoría', '¿Eliminar esta categoría permanentemente?', async () => {
      setSaving(true);
      const { error } = await supabase.from('categoriaservicio').delete().eq('idcategoriaservicio', id);
      if (!error) {
        showSnack('Categoría eliminada');
        setCategories(prev => prev.filter(c => c.idcategoriaservicio !== id));
      }
      else showAlert('Eliminación Rechazada', 'No se puede eliminar la categoría porque hay servicios asociados a ella.');
      setSaving(false);
    });
  };
  // ---------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);

    const catId = getCategoryId(form.category);
    if (!catId) {
      showAlert('Error de Categoría', 'Por favor selecciona una categoría válida.');
      setSaving(false);
      return;
    }

    const payload = {
      nombre: form.name,
      idcategoriaservicio: catId,
      duracion: parseInt(form.duration, 10),
      precio: parseFloat(form.price),
      color: form.color,
      idnegocios: tenant.id,
      idestado: 1
    };

    if (editId) {
      const { error } = await supabase.from('servicios').update(payload).eq('idservicios', editId);
      if (error) showAlert('Fallo de Edición', "Error actualizando: " + error.message);
      else {
        showSnack('Servicio actualizado');
        fetchData();
      }
    } else {
      const { error } = await supabase.from('servicios').insert([payload]);
      if (error) showAlert('Fallo de Creación', "Error insertando: " + error.message);
      else {
        showSnack('Servicio creado');
        fetchData();
      }
    }

    setShowModal(false);
    setEditId(null);
    setSaving(false);
    fetchData(); 
  };

  const handleDelete = (id, e) => {
    e.stopPropagation(); 
    showConfirm('Eliminar Servicio', '¿Seguro que deseas eliminar este tratamiento permanentemente?', async () => {
      setLoading(true);
      const { error } = await supabase.from('servicios').delete().eq('idservicios', id);
      if (error) showAlert('Eliminación Rechazada', "Este servicio probablemente está siendo usado en Citas activas.\nError: " + error.message);
      else {
        showSnack('Servicio eliminado', 'error');
        fetchData();
      }
    });
  };

  // Calcular cuentas para mostrar pill de resumen
  const catCount = services.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {});
  
  // Garantizar que TODAS las categorías de la BD se listen (incluso con cuenta en 0)
  const fullCatCount = { ...catCount };
  categories.forEach(c => {
    if (fullCatCount[c.descripcion] === undefined) fullCatCount[c.descripcion] = 0;
  });

  const uniqueOptions = Array.from(new Set([...categories.map(c => c.descripcion), 'Inyectables', 'Aparatología', 'Cosmetología', 'Valoraciones']));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        @keyframes spinner { 100% { transform: rotate(360deg); } }
        .capitalize-text { text-transform: capitalize; }
      `}</style>
      
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Catálogo de Procedimientos</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-4)', fontWeight: 500 }}>
            {services.length} tratamiento{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowCatModal(true)} disabled={loading} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            Editar Categorías
          </button>
          <button className="btn btn-primary" onClick={openCreate} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Registrar Tratamiento
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--primary)' }}>
          <svg width="40" height="40" viewBox="0 0 50 50" style={{ animation: 'spinner 0.8s linear infinite' }}>
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray="30 100" strokeLinecap="round" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="var(--border)" strokeWidth="4.5" style={{ opacity: 0.3 }} />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', marginTop: '1rem', color: 'var(--text-4)' }}>Sincronizando...</span>
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className="alert alert-danger animate-fade-in" style={{ borderRadius: 'var(--radius)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center', background: '#fef2f2', border: '1px solid #fee2e2' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.95rem' }}>No hay categorías configuradas</h4>
            <p style={{ margin: '0.1rem 0 0', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 500 }}>Debes crear al menos una categoría arriba en "Editar Categorías" para poder registrar tratamientos.</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {Object.keys(fullCatCount).length > 0 && (
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {Object.entries(fullCatCount).map(([cat, count]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.9rem', borderRadius: 99, background: `${catColor[cat] || '#6366f1'}12`, border: `1px solid ${catColor[cat] || '#6366f1'}28`, fontSize: '0.78rem', fontWeight: 700, color: catColor[cat] || '#6366f1' }}>
                  {catIcon[cat] || '💎'} <span className="capitalize-text">{cat}</span> <span style={{ opacity: 0.6 }}>·</span> {count}
                </div>
              ))}
            </div>
          )}

          {services.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
              {services.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => startEdit(s)}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${i * 45}ms`,
                    padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderLeft: `5px solid ${s.color}`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.005)';
                    e.currentTarget.style.boxShadow = `0 16px 40px -8px ${s.color}25, var(--shadow-lg)`;
                    e.currentTarget.style.borderColor = `${s.color}60`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.borderLeftColor = s.color;
                  }}
                >
                  {/* ── Big Color Banner ── */}
                  <div style={{
                    background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                    padding: '1.1rem 1.35rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Decorative blob */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1.5px solid rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', flexShrink: 0, color: '#fff',
                      }}>
                        {catIcon[s.category] || '💎'}
                      </div>
                      <span className="capitalize-text" style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '0.3rem 0.9rem', borderRadius: 99,
                        background: 'rgba(255,255,255,0.22)', color: '#fff',
                        fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em',
                        backdropFilter: 'blur(4px)',
                      }}>
                        {s.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', position: 'relative', zIndex: 1 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(s); }}
                        title="Editar servicio"
                        style={{
                          background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                          color: '#fff', padding: '0.4rem', borderRadius: 10,
                          display: 'flex', transition: 'var(--transition)', zIndex: 2
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        title="Eliminar servicio"
                        style={{
                          background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                          color: '#fff', padding: '0.4rem', borderRadius: 10,
                          display: 'flex', transition: 'var(--transition)', zIndex: 2
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: '1.25rem 1.35rem 1.35rem' }}>
                    <h3 className="capitalize-text" style={{
                      margin: '0 0 0.65rem', fontSize: '1.15rem', lineHeight: 1.3,
                      color: 'var(--text)', fontWeight: 800, letterSpacing: '-0.01em'
                    }}>
                      {s.name}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-3)', fontSize: '0.88rem', marginBottom: '1.15rem' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span style={{ fontWeight: 600 }}>{s.duration} minutos de sesión</span>
                    </div>

                    {/* Price Section */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: '1rem', borderTop: `2px solid ${s.color}18`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: s.color, boxShadow: `0 0 10px ${s.color}80`
                        }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor</span>
                      </div>
                      <span style={{
                        fontSize: '1.65rem', fontWeight: 900, color: 'var(--text)',
                        letterSpacing: '-0.03em'
                      }}>{fmt(s.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : (
            <div className="empty-state animate-fade-in">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              <h4 style={{ color: 'var(--text-3)', fontWeight: 700, margin: 0 }}>Catálogo vacío</h4>
              <p style={{ margin: 0, color: 'var(--text-4)', fontSize: '0.875rem' }}>Registra el primer tratamiento para comenzar a agendar citas.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 460, opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto' }}>
            <div style={{ margin: '-2.25rem -2.25rem 1.75rem', background: `linear-gradient(135deg, ${form.color}25, ${form.color}08)`, borderBottom: `1px solid ${form.color}20`, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '1.4rem 2.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-4)' }}>{saving ? 'Guardando...' : 'Configura nombre, duración y tarifa.'}</p>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="input-group">
                <label>Nombre del servicio</label>
                <input className="input-field capitalize-text" placeholder="Ej. Depilación Láser Axilas" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Categoría</label>
                  <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)}>
                    {uniqueOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Duración</label>
                  <select className="input-field" value={form.duration} onChange={e => update('duration', e.target.value)}>
                    {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60} hora${d / 60 > 1 ? 's' : ''}`}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Precio Base (COP)</label>
                  <input type="number" className="input-field" placeholder="Ej. 150000" value={form.price} onChange={e => update('price', e.target.value)} required min="0" />
                </div>
                <div className="input-group" style={{ width: 76 }}>
                  <label>Color</label>
                  <input type="color" className="input-field" style={{ padding: '0.2rem', height: 44, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} value={form.color} onChange={e => update('color', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-outline w-full" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? 'Procesando...' : (editId ? 'Guardar Cambios' : 'Guardar Servicio')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && setShowCatModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 440, opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Gestión de Categorías</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-4)' }}>Añade, edita o elimina familias de procedimientos.</p>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCatModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            
            <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
              {categories.map(c => (
                <div key={c.idcategoriaservicio} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div className="capitalize-text" style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.descripcion}</div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => { setEditCatId(c.idcategoriaservicio); setCatName(c.descripcion); }} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '0.2rem' }}>✏️</button>
                    <button onClick={() => handleDeleteCategory(c.idcategoriaservicio)} title="Borrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-4)', textAlign: 'center', padding: '1rem' }}>No has creado categorías todavía.</div>}
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{editCatId ? 'Editando Categoría' : 'Nueva Categoría'}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field capitalize-text" placeholder="Ej. Depilación" value={catName} onChange={e => setCatName(e.target.value)} required style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary" disabled={saving}>{editCatId ? 'Guardar' : 'Añadir'}</button>
                {editCatId && <button type="button" className="btn btn-outline" onClick={() => { setEditCatId(null); setCatName(''); }} disabled={saving}>X</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Alert / Confirm Modal ── */}
      {alertConfig.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 360, padding: '2rem', textAlign: 'center' }}>
            {alertConfig.type === 'confirm' ? (
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '50%', marginBottom: '1rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
            )}
            
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{alertConfig.title}</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.4 }}>{alertConfig.message}</p>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {alertConfig.type === 'confirm' && (
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeAlert}>Cancelar</button>
              )}
              <button 
                className={alertConfig.type === 'confirm' ? 'btn' : 'btn btn-primary'} 
                style={alertConfig.type === 'confirm' ? { flex: 1, background: 'var(--danger)', color: '#fff' } : { width: '100%' }} 
                onClick={() => {
                  closeAlert();
                  if (alertConfig.onConfirm) alertConfig.onConfirm();
                }}
              >
                {alertConfig.type === 'confirm' ? 'Eliminar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
