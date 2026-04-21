import React, { useState, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';

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
      showAlert('No hay categorías', 'Debes crear al menos una categoría de servicio antes de agregar servicios.');
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
      const oldCat = categories.find(c => c.idcategoriaservicio === editCatId);
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

    setShowModal(false);
    setEditId(null);
    setSaving(false);
    
    if (editId) {
      supabase.from('servicios').update(payload).eq('idservicios', editId).then(({ error }) => {
        if (error) showAlert('Fallo de Edición', "Error actualizando: " + error.message);
        else {
          showSnack('Servicio actualizado');
          fetchData();
        }
      });
    } else {
      supabase.from('servicios').insert([payload]).then(({ error }) => {
        if (error) showAlert('Fallo de Creación', "Error insertando: " + error.message);
        else {
          showSnack('Servicio creado');
          fetchData();
        }
      });
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation(); 
    showConfirm('Eliminar Servicio', '¿Seguro que deseas eliminar este servicio permanentemente?', async () => {
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
            {services.length} servicio{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowCatModal(true)} disabled={loading} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            Editar Categorías
          </button>
          <button className="btn btn-primary" onClick={openCreate} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Registrar Servicio
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className="alert alert-danger animate-fade-in" style={{ borderRadius: 'var(--radius)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center', background: '#fef2f2', border: '1px solid #fee2e2' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.95rem' }}>No hay categorías configuradas</h4>
            <p style={{ margin: '0.1rem 0 0', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 500 }}>Debes crear al menos una categoría arriba en "Editar Categorías" para poder registrar servicios.</p>
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
              <p style={{ margin: 0, color: 'var(--text-4)', fontSize: '0.875rem' }}>Registra el primer servicio para comenzar a agendar citas.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${form.color} 0%, ${form.color}cc 100%)`, padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{editId ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{saving ? 'Procesando cambios...' : 'Define nombre, duración y tarifa.'}</p>
                </div>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Nombre del servicio</label>
                <SuggestionInput 
                  placeholder="Ej. Depilación Láser Axilas" 
                  value={form.name} 
                  onChange={e => update('name', e.target.value)} 
                  required 
                  style={{ borderRadius: '12px' }} 
                  spellCheck={true} 
                  lang="es" 
                  suggestions={[...new Set([...services.map(s => s.name), ...commonTerms])]} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Categoría</label>
                  <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)} style={{ borderRadius: '12px' }}>
                    {uniqueOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Duración</label>
                  <select className="input-field" value={form.duration} onChange={e => update('duration', e.target.value)} style={{ borderRadius: '12px' }}>
                    {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60} hora${d / 60 > 1 ? 's' : ''}`}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '1.25rem', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Precio Base (COP)</label>
                  <input type="number" className="input-field" placeholder="Ej. 150000" value={form.price} onChange={e => update('price', e.target.value)} required min="0" style={{ borderRadius: '12px' }} />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Color</label>
                  <input type="color" className="input-field" style={{ padding: '0.2rem', height: 46, cursor: 'pointer', borderRadius: '12px' }} value={form.color} onChange={e => update('color', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '14px', padding: '0.8rem', fontSize: '1rem', background: `linear-gradient(135deg, ${form.color}, ${form.color}cc)`, boxShadow: `0 8px 24px ${form.color}33` }} disabled={saving}>
                  {saving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="spinner" style={{ width: '1.1rem', height: '1.1rem' }}></div>
                      Guardando...
                    </div>
                  ) : (editId ? 'Guardar Cambios' : 'Registrar Servicio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && setShowCatModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 460 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Categorías</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>Gestiona las familias de servicios.</p>
                </div>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCatModal(false)} style={{ borderRadius: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface)' }}>
              <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                {categories.map(c => (
                  <div key={c.idcategoriaservicio} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)', transition: 'all 0.2s ease' }}>
                    <div className="capitalize-text" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{c.descripcion}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => { setEditCatId(c.idcategoriaservicio); setCatName(c.descripcion); }} title="Editar" style={{ width: 32, height: 32, padding: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDeleteCategory(c.idcategoriaservicio)} title="Borrar" style={{ width: 32, height: 32, padding: 0, color: 'var(--danger)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-4)', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>No hay categorías todavía.</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveCategory} style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>
                  {editCatId ? 'Editando Categoría' : 'Añadir Nueva Categoría'}
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <SuggestionInput 
                    placeholder="Ej. Depilación" 
                    value={catName} 
                    onChange={e => setCatName(e.target.value)} 
                    required 
                    style={{ flex: 1, borderRadius: '12px' }} 
                    spellCheck={true} 
                    lang="es" 
                    suggestions={[...new Set([...categories.map(c => c.descripcion), ...commonTerms])]} 
                  />
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: '12px', padding: '0 1.5rem' }}>
                    {editCatId ? 'Guardar' : 'Añadir'}
                  </button>
                  {editCatId && (
                    <button type="button" className="btn btn-outline" onClick={() => { setEditCatId(null); setCatName(''); }} disabled={saving} style={{ borderRadius: '12px', padding: '0 0.75rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Alert / Confirm Modal ── */}
      {alertConfig.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={closeAlert}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ 
                background: alertConfig.type === 'confirm' ? 'var(--danger-light)' : 'var(--primary-light)', 
                color: alertConfig.type === 'confirm' ? 'var(--danger)' : 'var(--primary)', 
                width: '72px', height: '72px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 1.5rem',
                boxShadow: `0 0 0 8px ${alertConfig.type === 'confirm' ? 'var(--danger-light)' : 'var(--primary-light)'}80`
              }}>
                {alertConfig.type === 'confirm' ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                )}
              </div>
              
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{alertConfig.title}</h3>
              <p style={{ margin: '0 0 2rem', fontSize: '1rem', color: 'var(--text-4)', lineHeight: 1.5, fontWeight: 500 }}>{alertConfig.message}</p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {alertConfig.type === 'confirm' ? (
                  <>
                    <button className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={closeAlert}>Cancelar</button>
                    <button className="btn btn-danger" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem', background: 'var(--danger)', boxShadow: '0 8px 20px var(--danger-light)' }} 
                      onClick={() => {
                        closeAlert();
                        if (alertConfig.onConfirm) alertConfig.onConfirm();
                      }}
                    >
                      Sí, eliminar
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', borderRadius: '14px', padding: '0.8rem', boxShadow: '0 8px 24px var(--primary-light)' }} onClick={closeAlert}>
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, background: snackbar.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontWeight: 700, animation: 'slideInBottom 0.3s ease-out' }}>
          <style>{`
            @keyframes slideInBottom { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
