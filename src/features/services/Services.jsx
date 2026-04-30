import React, { useState, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';
import './Services.css';

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

  const ServiceDefaultIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
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
      .is('deleted_at', null)
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
      const { error } = await supabase.from('servicios').update({ deleted_at: new Date().toISOString() }).eq('idservicios', id);
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
    <div className="services-container">
      
      <div className="page-header services-header">
        <div className="services-title">
          <h2>Catálogo de Procedimientos</h2>
          <p className="services-subtitle">
            {services.length} servicio{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="services-actions">
          <button className="btn btn-outline services-edit-cats-btn" onClick={() => setShowCatModal(true)} disabled={loading}>
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
        <div className="services-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton service-skeleton-card" />
          ))}
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className="services-alert-no-cats animate-fade-in">
          <div className="alert-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="alert-content">
            <h4>No hay categorías configuradas</h4>
            <p>Debes crear al menos una categoría arriba en "Editar Categorías" para poder registrar servicios.</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {Object.keys(fullCatCount).length > 0 && (
            <div className="services-summary-pills">
              {Object.entries(fullCatCount).map(([cat, count]) => (
                <div 
                  key={cat} 
                  className="service-cat-pill"
                  style={{ 
                    '--cat-bg': `${catColor[cat] || '#6366f1'}12`, 
                    '--cat-border': `${catColor[cat] || '#6366f1'}28`,
                    '--cat-color': catColor[cat] || '#6366f1'
                  }}
                >
                  <span className="capitalize-text">{cat}</span> <span className="service-cat-pill-dot">·</span> {count}
                </div>
              ))}
            </div>
          )}

          {services.length > 0 ? (
            <div className="services-grid">
              {services.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => startEdit(s)}
                  className="animate-fade-in service-card"
                  style={serviceCardVars(s, i)}
                >
                  {/* ── Big Color Banner ── */}
                  <div className="service-card-banner">
                    <div className="service-card-banner-blob" />
                    
                    <div className="service-card-banner-left">
                      <div className="service-card-icon-box">
                        {catIcon[s.category] || <ServiceDefaultIcon />}
                      </div>
                      <span className="capitalize-text service-card-cat-badge">
                        {s.category}
                      </span>
                    </div>

                    <div className="service-card-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(s); }}
                        className="service-card-btn"
                        title="Editar servicio"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="service-card-btn service-card-btn--danger"
                        title="Eliminar servicio"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="service-card-content">
                    <h3 className="capitalize-text service-card-title">
                      {s.name}
                    </h3>

                    <div className="service-card-meta">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="service-card-meta-text">{s.duration} minutos de sesión</span>
                    </div>

                    {/* Price Section */}
                    <div className="service-card-price-row">
                      <div className="service-card-price-label-group">
                        <div className="service-card-price-dot" />
                        <span className="service-card-price-label">Valor</span>
                      </div>
                      <span className="service-card-price-value">{fmt(s.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : (
            <div className="empty-state animate-fade-in">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              <h4 className="empty-state-title">Catálogo vacío</h4>
              <p className="empty-state-text">Registra el primer servicio para comenzar a agendar citas.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in max-w-sm">
            {/* Header */}
            <div className="service-modal-header" style={{ '--modal-header-bg': `linear-gradient(135deg, ${form.color} 0%, ${form.color}cc 100%)` }}>
              <div className="service-modal-header-left">
                <div className="service-modal-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <h3 className="service-modal-title">{editId ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                  <p className="service-modal-subtitle">{saving ? 'Procesando cambios...' : 'Define nombre, duración y tarifa.'}</p>
                </div>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon service-modal-close-btn" onClick={() => setShowModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="service-modal-form">
              <div className="input-group">
                <label className="service-form-label">Nombre del servicio</label>
                <SuggestionInput 
                  placeholder="Ej. Depilación Láser Axilas" 
                  value={form.name} 
                  onChange={e => update('name', e.target.value)} 
                  required 
                  className="rounded-12" 
                  spellCheck={true} 
                  lang="es" 
                  suggestions={[...new Set([...services.map(s => s.name), ...commonTerms])]} 
                />
              </div>

              <div className="service-form-grid">
                <div className="input-group">
                  <label className="service-form-label">Categoría</label>
                  <select className="input-field rounded-12" value={form.category} onChange={e => update('category', e.target.value)}>
                    {uniqueOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="service-form-label">Duración</label>
                  <select className="input-field rounded-12" value={form.duration} onChange={e => update('duration', e.target.value)}>
                    {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60} hora${d / 60 > 1 ? 's' : ''}`}</option>)}
                  </select>
                </div>
              </div>

              <div className="service-price-box">
                <div className="input-group">
                  <label className="service-form-label">Precio Base (COP)</label>
                  <input type="number" className="input-field rounded-12" placeholder="Ej. 150000" value={form.price} onChange={e => update('price', e.target.value)} required min="0" />
                </div>
                <div className="input-group">
                  <label className="service-form-label">Color</label>
                  <input type="color" className="input-field service-color-input" value={form.color} onChange={e => update('color', e.target.value)} />
                </div>
              </div>

              <div className="service-modal-footer">
                <button type="button" className="btn btn-outline service-cancel-btn" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn-primary service-submit-btn" 
                  style={{ '--submit-bg': `linear-gradient(135deg, ${form.color}, ${form.color}cc)`, '--submit-shadow': `${form.color}33` }} 
                  disabled={saving}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner spinner-small"></div>
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
          <div className="modal-box animate-scale-in max-w-sm">
            {/* Header */}
            <div className="cat-modal-header">
              <div className="flex items-center gap-3">
                <div className="cat-modal-header-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                  <h3 className="cat-modal-title">Categorías</h3>
                  <p className="cat-modal-subtitle">Gestiona las familias de servicios.</p>
                </div>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon rounded-12" onClick={() => setShowCatModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            
            <div className="cat-modal-body">
              <div className="cat-list">
                {categories.map(c => (
                  <div key={c.idcategoriaservicio} className="cat-item">
                    <div className="capitalize-text cat-name">{c.descripcion}</div>
                    <div className="cat-actions">
                      <button className="btn btn-ghost btn-icon cat-btn-small" onClick={() => { setEditCatId(c.idcategoriaservicio); setCatName(c.descripcion); }} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn btn-ghost btn-icon cat-btn-small color-danger" onClick={() => handleDeleteCategory(c.idcategoriaservicio)} title="Borrar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="cat-empty">
                    <p>No hay categorías todavía.</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveCategory} className="cat-form">
                <label className="cat-form-label">
                  {editCatId ? 'Editando Categoría' : 'Añadir Nueva Categoría'}
                </label>
                <div className="cat-form-row">
                  <SuggestionInput 
                    placeholder="Ej. Depilación" 
                    value={catName} 
                    onChange={e => setCatName(e.target.value)} 
                    required 
                    className="flex-1 rounded-12" 
                    spellCheck={true} 
                    lang="es" 
                    suggestions={[...new Set([...categories.map(c => c.descripcion), ...commonTerms])]} 
                  />
                  <button type="submit" className="btn btn-primary rounded-12 px-6" disabled={saving}>
                    {editCatId ? 'Guardar' : 'Añadir'}
                  </button>
                  {editCatId && (
                    <button type="button" className="btn btn-outline rounded-12 px-3" onClick={() => { setEditCatId(null); setCatName(''); }} disabled={saving}>
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
        <div className="modal-overlay z-9999" onClick={closeAlert}>
          <div className="modal-box animate-scale-in max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="alert-modal-body">
              <div className={`alert-circle ${alertConfig.type === 'confirm' ? 'alert-circle--confirm' : 'alert-circle--alert'}`} 
                   style={{ '--primary-light-alpha': 'var(--primary-light-rgba)', '--danger-light-alpha': 'var(--danger-light-rgba)' }}>
                {alertConfig.type === 'confirm' ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                )}
              </div>
              
              <h3 className="alert-title">{alertConfig.title}</h3>
              <p className="alert-message">{alertConfig.message}</p>
              
              <div className="alert-footer">
                {alertConfig.type === 'confirm' ? (
                  <>
                    <button className="btn btn-outline flex-1 rounded-14 p-3" onClick={closeAlert}>Cancelar</button>
                    <button className="btn btn-danger alert-btn-confirm" 
                      onClick={() => {
                        closeAlert();
                        if (alertConfig.onConfirm) alertConfig.onConfirm();
                      }}
                    >
                      Sí, eliminar
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary alert-btn-full" onClick={closeAlert}>
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
        <div className={`service-snackbar ${snackbar.type === 'success' ? 'service-snackbar--success' : 'service-snackbar--error'}`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}

function serviceCardVars(s, i) {
  return {
    '--delay': `${i * 45}ms`,
    '--service-color': s.color,
    '--service-shadow-color': `${s.color}25`,
    '--service-hover-border': `${s.color}60`,
    '--service-gradient': `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
    '--service-price-border': `${s.color}18`,
    '--service-glow': `${s.color}80`,
    animationDelay: 'var(--delay)'
  };
}
