import { supabase, insertLog } from '../../Supabase/supabaseClient';
import { useState, useEffect } from 'react';

export default function Inventory({ user, tenant }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState(null);
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

  const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '' });
  const showAlert = (title, message) => setAlertConfig({ show: true, title, message });
  const closeAlert = () => setAlertConfig({ ...alertConfig, show: false });

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    // Get Categories
    const { data: catData } = await supabase.from('categoriaproducto').select('*').eq('idnegocios', tenant.id);
    setCategories(catData || []);

    // Get Products
    const { data: prodData, error } = await supabase
      .from('producto')
      .select('*')
      .eq('idnegocios', tenant.id);

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
    setForm({ name: '', category: categories[0].descripcion, initial: '', minStock: 5 });
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
      }
    } else {
      const { data, error } = await supabase.from('categoriaproducto').insert([{ descripcion: catName, idnegocios: tenant.id }]).select();
      if (!error && data) {
        setCategories(prev => [...prev, data[0]]);
      }
    }
    setCatName('');
    setEditCatId(null);
    setSaving(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    setSaving(true);
    const { error } = await supabase.from('categoriaproducto').delete().eq('idcategoriaproducto', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.idcategoriaproducto !== id));
    } else {
      showAlert('Error', 'No se puede eliminar la categoría porque tiene productos asociados.');
    }
    setSaving(false);
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
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ name: '', category: categories.length ? categories[0].descripcion : '', initial: '', minStock: 5, price: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.initial === '') return;
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
      }
    } else {
      const { error } = await supabase.from('producto').insert([payload]);
      if (!error) {
        showSnack('Producto creado con éxito');
        fetchData();
      }
    }
    setSaving(false);
    cancelEdit();
  };

  const handleUpdateStock = async (item, delta) => {
    const newStock = Math.max(0, item.cantidad + delta);
    const { error } = await supabase.from('producto').update({ cantidad: newStock }).eq('idproducto', item.idproducto);
    if (!error) {
      setProducts(prev => prev.map(p => p.idproducto === item.idproducto ? { ...p, cantidad: newStock } : p));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
    setSaving(true);
    const { error } = await supabase.from('producto').delete().eq('idproducto', id);
    if (!error) {
      showSnack('Producto eliminado', 'error');
      fetchData();
    } else {
      showAlert('Error al eliminar', 'No se pudo eliminar el producto. ' + error.message);
    }
    setSaving(false);
  };

  const alertas = products.filter(i => i.cantidad <= i.cantidadminima).length;
  const stockPercent = (item) => Math.min(100, (item.cantidad / Math.max(item.cantidadminima * 2, 1)) * 100);

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'flex-start' }}>

      {/* ── LEFT: Register Form ── */}
      <div style={{ minWidth: 340, maxWidth: 340 }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editId ? 'Editar Insumo' : 'Registrar Insumo'}</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 500 }}>{editId ? 'Modifica los datos del producto.' : 'Añade productos al almacén central.'}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="input-group">
              <label>Nombre del Producto</label>
              <input className="input-field" placeholder="Ej: Agujas 30G..." value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>

            {categories.length === 0 ? (
              <div style={{ padding: '1rem', background: 'var(--danger-light)', borderRadius: 'var(--radius)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: '0.5rem' }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>⚠️ No hay categorías creadas.</p>
                <button type="button" onClick={() => setShowCatModal(true)} className="btn btn-primary w-full" style={{ padding: '0.4rem', fontSize: '0.75rem' }}>Crear Categoría</button>
              </div>
            ) : (
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.2rem' }}>
                  <label style={{ margin: 0 }}>Categoría</label>
                  <button type="button" onClick={() => setShowCatModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Gestionar Categorías</button>
                </div>
                <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)} required>
                  <option value="" disabled>Selecciona categoría...</option>
                  {categories.map(c => <option key={c.idcategoriaproducto} value={c.descripcion}>{c.descripcion}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Stock Inicial</label>
                <input type="number" className="input-field" placeholder="0" value={form.initial} onChange={e => update('initial', e.target.value)} min="0" required />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Stock Mínimo</label>
                <input type="number" className="input-field" placeholder="5" value={form.minStock} onChange={e => update('minStock', e.target.value)} min="1" required />
              </div>
            </div>

            <div className="input-group">
              <label>Costo (COP)</label>
              <input type="number" className="input-field" placeholder="0" value={form.price} onChange={e => update('price', e.target.value)} min="0" />
            </div>

            <div className="input-group">
              <label>Descripción / Detalles</label>
              <textarea className="input-field" placeholder="Opcional..." rows="2" value={form.description} onChange={e => update('description', e.target.value)} style={{ resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary w-full">
                {editId ? 'Guardar Cambios' : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Agregar al Inventario</>
                )}
              </button>
              {editId && (
                <button type="button" className="btn btn-outline w-full" onClick={cancelEdit}>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Alerts panel */}
        {alertas > 0 && (
          <div className="animate-fade-in" style={{ marginTop: '1rem', background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,0.22)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <h4 style={{ margin: 0, color: 'var(--danger)', fontSize: '0.95rem' }}>{alertas} Alerta{alertas > 1 ? 's' : ''} Crítica{alertas > 1 ? 's' : ''}</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0, lineHeight: 1.5 }}>
              {alertas} insumo{alertas > 1 ? 's' : ''} por debajo del stock de seguridad. Coordina reabastecimiento urgente.
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Inventory Table ── */}
      <div className="card w-full" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Inventario · {tenant?.name || 'Central'}</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.77rem', color: 'var(--text-4)', fontWeight: 500 }}>{products.length} productos · {alertas} alertas activas</p>
          </div>
          <span className={`badge ${alertas > 0 ? 'badge-danger' : 'badge-success'}`}>
            {alertas > 0 ? `${alertas} Críticos` : '✓ Todo en Orden'}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)' }}>Cargando almacén...</div>
          ) : products.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th style={{ textAlign: 'center' }}>Nivel de Stock</th>
                  <th style={{ textAlign: 'center' }}>Actual / Mín.</th>
                  <th style={{ textAlign: 'center' }}>Ajuste</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const pct = stockPercent(item);
                  const isLow = item.cantidad <= item.cantidadminima;
                  const barColor = isLow ? 'var(--danger)' : pct < 60 ? 'var(--warning)' : 'var(--success)';
                  const catName = categories.find(c => c.idcategoriaproducto === item.idcategoriaproducto)?.descripcion || '—';
                  return (
                    <tr key={item.idproducto}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{item.nombre}</span>
                      </td>
                      <td>
                        <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>{catName}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.precio || 0)}</span>
                      </td>
                      <td style={{ minWidth: 120, padding: '1rem' }}>
                        <div style={{ background: 'var(--surface-3)', borderRadius: 99, height: 6, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.5s var(--ease), background 0.3s' }} />
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', fontWeight: 600, marginTop: 4, textAlign: 'center' }}>{Math.round(pct)}% del nivel objetivo</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: isLow ? 'var(--danger)' : 'var(--text)', lineHeight: 1 }}>{item.cantidad}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', display: 'block', fontWeight: 600, marginTop: 1 }}>min. {item.cantidadminima}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>{isLow ? 'CRÍTICO' : 'ÓPTIMO'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', padding: '0 0.5rem' }}>
                          <button
                            onClick={() => startEdit(item)}
                            title="Editar Insumo"
                            style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--surface-3)', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
                          ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>

                          <button
                            onClick={() => handleDeleteProduct(item.idproducto)}
                            title="Eliminar Producto"
                            style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                          ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg></button>

                          <button
                            onClick={() => handleUpdateStock(item, -1)}
                            style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                          >−</button>
                          <button
                            onClick={() => handleUpdateStock(item, 1)}
                            style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'none'; }}
                          >+</button>
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
              <h4 style={{ color: 'var(--text-3)', fontWeight: 700, margin: 0 }}>Sin productos</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-4)' }}>Usa el formulario izquierdo para registrar el primer insumo.</p>
            </div>
          )}
        </div>
      </div>
      {/* ── Category Modal ── */}
      {showCatModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCatModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Gestionar Categorías</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCatModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input className="input-field" placeholder="Nueva categoría..." value={catName} onChange={e => setCatName(e.target.value)} required />
              <button type="submit" className="btn btn-primary" disabled={saving}>{editCatId ? 'Guardar' : 'Agregar'}</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
              {categories.map(c => (
                <div key={c.idcategoriaproducto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 600 }}>{c.descripcion}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { setEditCatId(c.idcategoriaproducto); setCatName(c.descripcion); }} className="btn btn-ghost btn-icon" style={{ padding: '0.2rem' }}>✏️</button>
                    <button onClick={() => handleDeleteCategory(c.idcategoriaproducto)} className="btn btn-ghost btn-icon" style={{ padding: '0.2rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Modal ── */}
      {alertConfig.show && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 350, textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{alertConfig.title}</h3>
            <p style={{ color: 'var(--text-3)', marginBottom: '1.5rem' }}>{alertConfig.message}</p>
            <button className="btn btn-primary w-full" onClick={closeAlert}>Entendido</button>
          </div>
        </div>
      )}

      {/* ── Snackbar ── */}
      {snackbar.show && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 10000, background: snackbar.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', transform: 'translateY(0)', animation: 'slideIn 0.3s ease-out' }}>
          <style>{`
            @keyframes slideIn { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
          {snackbar.type === 'success' ? '✓' : '✕'} {snackbar.message}
        </div>
      )}
    </div>
  );
}
