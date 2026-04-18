import { supabase, insertLog } from '../../Supabase/supabaseClient';
import { useState, useEffect } from 'react';

export default function Inventory({ user, tenant }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', initial: '', minStock: 5, price: '', description: '' });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  // Category management
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState(null);

  const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'alert', onConfirm: null });
  const showAlert = (title, message) => setAlertConfig({ show: true, title, message, type: 'alert', onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setAlertConfig({ show: true, title, message, type: 'confirm', onConfirm });
  const closeAlert = () => setAlertConfig({ ...alertConfig, show: false });

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data: catData } = await supabase.from('categoriaproducto').select('*').eq('idnegocios', tenant.id);
    setCategories(catData || []);
    const { data: prodData, error } = await supabase.from('producto').select('*').eq('idnegocios', tenant.id);
    if (!error) setProducts(prodData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    if (categories.length === 0) {
      showAlert('No hay categorías', 'Debes crear al menos una categoría de producto antes de agregar insumos.');
      return;
    }
    setEditId(null);
    setForm({ name: '', category: categories[0].descripcion, initial: '', minStock: 5, price: '', description: '' });
    setShowModal(true);
  };

  const ensureCategory = (name) => {
    const cat = categories.find(c => c.descripcion === name);
    return cat?.idcategoriaproducto;
  };

  // ----- CATEGORY CRUD -----
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSaving(true);
    if (editCatId) {
      const { error } = await supabase.from('categoriaproducto').update({ descripcion: catName }).eq('idcategoriaproducto', editCatId);
      if (!error) {
        setCategories(prev => prev.map(c => c.idcategoriaproducto === editCatId ? { ...c, descripcion: catName } : c));
        showSnack('Categoría actualizada');
      }
    } else {
      const { data, error } = await supabase.from('categoriaproducto').insert([{ descripcion: catName, idnegocios: tenant.id }]).select();
      if (!error && data) {
        setCategories(prev => [...prev, data[0]]);
        showSnack('Categoría creada');
      }
    }
    setCatName('');
    setEditCatId(null);
    setSaving(false);
  };

  const handleDeleteCategory = async (id) => {
    showConfirm('Eliminar Categoría', '¿Eliminar esta categoría? Esto no se puede deshacer si tiene productos.', async () => {
      setSaving(true);
      const { error } = await supabase.from('categoriaproducto').delete().eq('idcategoriaproducto', id);
      if (!error) {
        setCategories(prev => prev.filter(c => c.idcategoriaproducto !== id));
        showSnack('Categoría eliminada');
      } else {
        showAlert('Error', 'No se puede eliminar la categoría porque tiene productos asociados.');
      }
      setSaving(false);
    });
  };

  const startEdit = (item) => {
    const catName = categories.find(c => c.idcategoriaproducto === item.idcategoriaproducto)?.descripcion || '';
    setEditId(item.idproducto);
    setForm({
      name: item.nombre,
      category: catName,
      initial: item.cantidad,
      minStock: item.cantidadminima,
      price: item.precio || '',
      description: item.descripcion || ''
    });
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.initial === '') return;
    setSaving(true);
    const catId = ensureCategory(form.category);
    if (!catId) {
      showAlert('Error', 'Selecciona una categoría válida.');
      setSaving(false);
      return;
    }
    const payload = {
      nombre: form.name,
      cantidad: parseInt(form.initial, 10),
      cantidadminima: parseInt(form.minStock, 10),
      idcategoriaproducto: catId,
      idnegocios: tenant.id,
      precio: parseFloat(form.price) || 0,
      descripcion: form.description
    };
    if (editId) {
      const { error } = await supabase.from('producto').update(payload).eq('idproducto', editId);
      if (!error) {
        showSnack('Producto actualizado con éxito');
        fetchData();
        setShowModal(false);
      }
    } else {
      const { error } = await supabase.from('producto').insert([payload]);
      if (!error) {
        showSnack('Producto creado con éxito');
        fetchData();
        setShowModal(false);
      }
    }
    setSaving(false);
  };

  const handleUpdateStock = async (item, delta) => {
    const newStock = Math.max(0, item.cantidad + delta);
    const { error } = await supabase.from('producto').update({ cantidad: newStock }).eq('idproducto', item.idproducto);
    if (!error) {
      setProducts(prev => prev.map(p => p.idproducto === item.idproducto ? { ...p, cantidad: newStock } : p));
    }
  };

  const handleDeleteProduct = async (id) => {
    showConfirm('Eliminar Producto', '¿Seguro que deseas eliminar este producto permanentemente?', async () => {
      setSaving(true);
      const { error } = await supabase.from('producto').delete().eq('idproducto', id);
      if (!error) {
        showSnack('Producto eliminado', 'error');
        fetchData();
        setShowModal(false);
      } else {
        showAlert('Error al eliminar', 'No se pudo eliminar el producto.');
      }
      setSaving(false);
    });
  };

  const alertas = products.filter(i => i.cantidad <= i.cantidadminima).length;
  const stockPercent = (item) => Math.min(100, (item.cantidad / Math.max(item.cantidadminima * 2, 1)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Inventario de Insumos</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-4)', fontWeight: 500 }}>
            {products.length} productos registrados · {alertas} con stock bajo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowCatModal(true)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
             <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
             Categorías
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
             Nuevo Insumo
          </button>
        </div>
      </div>

      {/* ── Main Inventory Table ── */}
      <div className="card w-full" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '65vh' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-2)' }}>Existencias actuales</span>
          <span className={`badge ${alertas > 0 ? 'badge-danger' : 'badge-success'}`}>
             {alertas > 0 ? `${alertas} Alertas Críticas` : '✓ Stock Saludable'}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>Cargando almacén...</div>
          ) : products.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Valor Unitario</th>
                  <th style={{ textAlign: 'center' }}>Nivel de Stock</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const pct = stockPercent(item);
                  const isLow = item.cantidad <= item.cantidadminima;
                  const barColor = isLow ? 'var(--danger)' : pct < 60 ? 'var(--warning)' : 'var(--success)';
                  const catName = categories.find(c => c.idcategoriaproducto === item.idcategoriaproducto)?.descripcion || 'General';
                  return (
                    <tr key={item.idproducto}>
                      <td><span style={{ fontWeight: 700, color: 'var(--text)' }}>{item.nombre}</span></td>
                      <td><span className="badge badge-neutral">{catName}</span></td>
                      <td><span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.precio || 0)}</span></td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ background: 'var(--surface-3)', borderRadius: 99, height: 6, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.5s var(--ease)' }} />
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 700, marginTop: 5, textAlign: 'center' }}>{Math.round(pct)}% del stock objetivo</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: isLow ? 'var(--danger)' : 'var(--text)' }}>{item.cantidad}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 600 }}>mín: {item.cantidadminima}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button onClick={() => startEdit(item)} className="btn btn-ghost btn-icon" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                          <div style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />
                          <button onClick={() => handleUpdateStock(item, -1)} className="btn btn-secondary btn-icon" style={{ padding: 0, width: 28, height: 28 }}>-</button>
                          <button onClick={() => handleUpdateStock(item, 1)} className="btn btn-primary btn-icon" style={{ padding: 0, width: 28, height: 28 }}>+</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ border: 'none', padding: '4rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              <h4 style={{ margin: 0, color: 'var(--text-3)' }}>No hay insumos</h4>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Agrega productos para comenzar el control de stock.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Register/Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && cancelEdit()}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{editId ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{saving ? 'Guardando existencias...' : 'Gestiona los datos técnicos del producto.'}</p>
                </div>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon" onClick={cancelEdit} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface)' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Nombre del Producto</label>
                <input className="input-field" placeholder="Ej. Agujas 30G" value={form.name} onChange={e => update('name', e.target.value)} required style={{ borderRadius: '12px' }} />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Categoría de Almacén</label>
                <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)} required style={{ borderRadius: '12px' }}>
                  {categories.map(c => <option key={c.idcategoriaproducto} value={c.descripcion}>{c.descripcion}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Existencias</label>
                  <input type="number" className="input-field" value={form.initial} onChange={e => update('initial', e.target.value)} required min="0" style={{ borderRadius: '12px' }} />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Stock Mínimo</label>
                  <input type="number" className="input-field" value={form.minStock} onChange={e => update('minStock', e.target.value)} required min="1" style={{ borderRadius: '12px' }} />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Costo Unitario de Compra (COP)</label>
                <input type="number" className="input-field" placeholder="0" value={form.price} onChange={e => update('price', e.target.value)} style={{ borderRadius: '12px' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={cancelEdit} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '14px', padding: '0.8rem', fontSize: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }} disabled={saving}>
                  {saving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="spinner" style={{ width: '1.1rem', height: '1.1rem' }}></div>
                      Guardando...
                    </div>
                  ) : 'Confirmar Cambios'}
                </button>
              </div>

              {editId && (
                <button type="button" onClick={() => handleDeleteProduct(editId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.25rem', alignSelf: 'center', opacity: 0.7 }}>
                  Eliminar permanentemente del inventario
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Category Management Modal ── */}
      {showCatModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && setShowCatModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 460 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem', borderRadius: '14px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Categorías</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Familias de insumos.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCatModal(false)} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 300, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {categories.map(c => (
                  <div key={c.idcategoriaproducto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{c.descripcion}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setEditCatId(c.idcategoriaproducto); setCatName(c.descripcion); }} className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, padding: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDeleteCategory(c.idcategoriaproducto)} className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, padding: 0, color: 'var(--danger)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveCategory} style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>
                  {editCatId ? 'Editando Categoría' : 'Añadir Nueva Categoría'}
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input className="input-field" placeholder="Nombre..." value={catName} onChange={e => setCatName(e.target.value)} required style={{ flex: 1, borderRadius: '12px' }} />
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: '12px', padding: '0 1.5rem' }}>
                    {editCatId ? 'Guardar' : 'Añadir'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Alert / Confirm Modal (Unified Style) ── */}
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
                        const onConfirm = alertConfig.onConfirm;
                        closeAlert();
                        if (onConfirm) onConfirm();
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

      {/* ── Snackbar ── */}
      {snackbar.show && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 10000, background: snackbar.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontWeight: 700, animation: 'slideIn 0.3s ease-out' }}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
