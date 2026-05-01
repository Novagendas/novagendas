import { supabase } from '../../Supabase/supabaseClient';
import { useState, useEffect, useMemo, useCallback } from 'react';
import SuggestionInput from '../../components/SuggestionInput';
import { commonTerms } from '../../components/SuggestionDatalist';
import './Inventory.css';

export default function Inventory({ tenant }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', initial: '', minStock: 5, price: '', description: '', lote: '' });

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

  // Filtros y búsqueda
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('recent');
  const [dateField, setDateField] = useState('fechacreacion');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'alert', onConfirm: null });
  const showAlert = (title, message) => setAlertConfig({ show: true, title, message, type: 'alert', onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setAlertConfig({ show: true, title, message, type: 'confirm', onConfirm });
  const closeAlert = () => setAlertConfig({ ...alertConfig, show: false });

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data: catData } = await supabase.from('categoriaproducto').select('*').eq('idnegocios', tenant.id);
    setCategories(catData || []);
    const { data: prodData, error } = await supabase.from('producto').select('*').eq('idnegocios', tenant.id).is('deleted_at', null);
    if (!error) setProducts(prodData || []);
    setLoading(false);
  }, [tenant.id]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [tenant, fetchData]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    if (categories.length === 0) {
      showAlert('No hay categorías', 'Debes crear al menos una categoría de producto antes de agregar insumos.');
      return;
    }
    setEditId(null);
    setForm({ name: '', category: categories[0].descripcion, initial: '', minStock: 5, price: '', description: '', lote: '' });
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
      description: item.descripcion || '',
      lote: item.lote || ''
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
      descripcion: form.description,
      lote: form.lote || null
    };
    setShowModal(false);
    
    if (editId) {
      supabase.from('producto').update(payload).eq('idproducto', editId).then(({ error }) => {
        if (!error) {
          showSnack('Producto actualizado con éxito');
          fetchData();
        }
      });
    } else {
      supabase.from('producto').insert([payload]).then(({ error }) => {
        if (!error) {
          showSnack('Producto creado con éxito');
          fetchData();
        }
      });
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
      const { error } = await supabase.from('producto').update({ deleted_at: new Date().toISOString() }).eq('idproducto', id);
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

  const filteredProducts = useMemo(() => {
    // Acceso seguro: usamos función extractor con switch en lugar de corchetes dinámicos
    const CAMPOS_FECHA_PERMITIDOS = ['fechacreacion', 'fechaactualizacion'];
    const campoFechaSeguro = CAMPOS_FECHA_PERMITIDOS.includes(dateField) ? dateField : 'fechacreacion';
    const getFechaProducto = (p) => {
      if (campoFechaSeguro === 'fechaactualizacion') return p.fechaactualizacion;
      return p.fechacreacion;
    };

    let list = products;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        [p.nombre, p.descripcion, p.lote]
          .some(v => (v || '').toString().toLowerCase().includes(q))
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      // Acceso seguro: usamos la función extractor que evita corchetes dinámicos
      list = list.filter(p => getFechaProducto(p) && new Date(getFechaProducto(p)).getTime() >= from);
    }
    if (dateTo) {
      // Incluir todo el día final
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      // Acceso seguro: usamos la función extractor que evita corchetes dinámicos
      list = list.filter(p => getFechaProducto(p) && new Date(getFechaProducto(p)).getTime() <= to);
    }
    const sorted = [...list];
    switch (orderBy) {
      case 'recent':
        sorted.sort((a, b) =>
          new Date(b.fechacreacion || 0).getTime() - new Date(a.fechacreacion || 0).getTime()
          || (b.idproducto || 0) - (a.idproducto || 0)
        );
        break;
      case 'oldest':
        sorted.sort((a, b) =>
          new Date(a.fechacreacion || 0).getTime() - new Date(b.fechacreacion || 0).getTime()
          || (a.idproducto || 0) - (b.idproducto || 0)
        );
        break;
      case 'updated':
        sorted.sort((a, b) =>
          new Date(b.fechaactualizacion || b.fechacreacion || 0).getTime()
          - new Date(a.fechaactualizacion || a.fechacreacion || 0).getTime()
        );
        break;
      case 'name':
        sorted.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
        break;
      default:
    }
    return sorted;
  }, [products, search, orderBy, dateField, dateFrom, dateTo]);

  const stockPercent = (item) => Math.min(100, (item.cantidad / Math.max(item.cantidadminima * 2, 1)) * 100);

  return (
    <div className="inventory-container">
      
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="inventory-header-title">Inventario</h2>
          <p className="inventory-header-subtitle">
            {products.length} productos registrados · {alertas} con stock bajo
          </p>
        </div>
        <div className="inventory-actions">
          <button className="btn btn-outline btn-inventory-category" onClick={() => setShowCatModal(true)}>
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
      <div className="card w-full inventory-table-card">
        <div className="inventory-table-header inventory-table-header--with-filters">
          <div className="inventory-table-header-info">
            <span className="inventory-table-header-title">Existencias actuales</span>
            <span className={`badge ${alertas > 0 ? 'badge-danger' : 'badge-success'}`}>
              {alertas > 0 ? `${alertas} Alertas Críticas` : '✓ Stock Saludable'}
            </span>
          </div>

          <div className="inventory-table-filters">
            <div className="inventory-search-wrap">
              <svg className="inventory-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="inventory-search-input"
                placeholder="Buscar por nombre, lote o descripción"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="inventory-search-clear" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">×</button>
              )}
            </div>

            <select
              className="inventory-filter-select"
              value={orderBy}
              onChange={e => setOrderBy(e.target.value)}
              title="Ordenar por"
            >
              <option value="recent">Más recientes</option>
              <option value="updated">Editados recientemente</option>
              <option value="oldest">Más antiguos</option>
              <option value="name">Nombre A–Z</option>
            </select>

            <button
              type="button"
              className={`inventory-filter-btn ${showDateFilter ? 'inventory-filter-btn--active' : ''}`}
              onClick={() => setShowDateFilter(v => !v)}
              title="Filtrar por fechas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Fechas
              {(dateFrom || dateTo) && <span className="inventory-filter-dot" />}
            </button>
          </div>
        </div>

        {showDateFilter && (
          <div className="inventory-date-filter-row">
            <select
              className="inventory-filter-select"
              value={dateField}
              onChange={e => setDateField(e.target.value)}
            >
              <option value="fechacreacion">Por creación</option>
              <option value="fechaactualizacion">Por edición</option>
            </select>
            <label className="inventory-date-input">
              Desde
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </label>
            <label className="inventory-date-input">
              Hasta
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </label>
            {(dateFrom || dateTo) && (
              <button type="button" className="inventory-filter-clear-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                Limpiar
              </button>
            )}
          </div>
        )}

        <div>
          {loading ? (
            <div className="padded-xl">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '1rem', opacity: 1 - (i * 0.15) }} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="table-scroll-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Categoría</th>
                  <th>Valor Unitario</th>
                  <th className="text-center">Nivel de Stock</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item) => {
                  const pct = stockPercent(item);
                  const isLow = item.cantidad <= item.cantidadminima;
                  const barColor = isLow ? 'var(--danger)' : pct < 60 ? 'var(--warning)' : 'var(--success)';
                  const catName = categories.find(c => c.idcategoriaproducto === item.idcategoriaproducto)?.descripcion || 'General';
                  return (
                    <tr key={item.idproducto}>
                      <td><span className="font-bold text-main">{item.nombre}</span></td>
                      <td>{item.lote ? <span className="badge badge-neutral">{item.lote}</span> : <span style={{ color: 'var(--text-5)', fontSize: '0.78rem' }}>—</span>}</td>
                      <td><span className="badge badge-neutral">{catName}</span></td>
                      <td><span className="font-semibold">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.precio || 0)}</span></td>
                      <td className="stock-level-container">
                        <div className="stock-bar-bg">
                          <div className="stock-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <div className="stock-bar-label">{Math.round(pct)}% del stock objetivo</div>
                      </td>
                      <td>
                        <div className="quantity-display">
                          <span className="quantity-main" style={{ color: isLow ? 'var(--danger)' : 'var(--text)' }}>{item.cantidad}</span>
                          <span className="quantity-min">mín: {item.cantidadminima}</span>
                        </div>
                      </td>
                      <td>
                        <div className="inventory-row-actions">
                          <button onClick={() => startEdit(item)} className="btn btn-ghost btn-icon" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                          <div className="inventory-action-separator" />
                          <button onClick={() => handleUpdateStock(item, -1)} className="btn btn-secondary btn-icon btn-stock-adjust">-</button>
                          <button onClick={() => handleUpdateStock(item, 1)} className="btn btn-primary btn-icon btn-stock-adjust">+</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="empty-state no-border padded-xl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              <h4 className="empty-state-title">No hay insumos</h4>
              <p className="empty-state-text">Agrega productos para comenzar el control de stock.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Register/Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && cancelEdit()}>
          <div className="modal-box animate-scale-in modal-sm">
            {/* Header */}
            <div className="inventory-modal-header">
              <div className="inventory-modal-header-content">
                <div className="inventory-modal-icon glass">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                </div>
                <div>
                  <h3 className="inventory-modal-title">{editId ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                  <p className="inventory-modal-subtitle">{saving ? 'Guardando existencias...' : 'Gestiona los datos técnicos del producto.'}</p>
                </div>
              </div>
              {!saving && (
                <button className="btn btn-ghost btn-icon btn-modal-close-glass" onClick={cancelEdit}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="input-group">
                <label className="inventory-input-label">Nombre del Producto</label>
                <SuggestionInput 
                  placeholder="Ej. Agujas 30G" 
                  value={form.name} 
                  onChange={e => update('name', e.target.value)} 
                  required 
                  className="input-rounded" 
                  spellCheck={true} 
                  lang="es" 
                  suggestions={commonTerms} 
                />
              </div>

              <div className="input-group">
                <label className="inventory-input-label">Categoría de Almacén</label>
                <select className="input-field input-rounded" value={form.category} onChange={e => update('category', e.target.value)} required>
                  {categories.map(c => <option key={c.idcategoriaproducto} value={c.descripcion}>{c.descripcion}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="inventory-input-label">Lote (opcional)</label>
                <input type="text" className="input-field input-rounded" placeholder="Ej. L-2024-01" value={form.lote} onChange={e => update('lote', e.target.value)} />
              </div>

              <div className="inventory-grid-inputs">
                <div className="input-group">
                  <label className="inventory-input-label">Existencias</label>
                  <input type="number" className="input-field input-rounded" value={form.initial} onChange={e => update('initial', e.target.value)} required min="0" />
                </div>
                <div className="input-group">
                  <label className="inventory-input-label">Stock Mínimo</label>
                  <input type="number" className="input-field input-rounded" value={form.minStock} onChange={e => update('minStock', e.target.value)} required min="1" />
                </div>
              </div>

              <div className="input-group">
                <label className="inventory-input-label">Costo Unitario de Compra (COP)</label>
                <input type="number" className="input-field input-rounded" placeholder="0" value={form.price} onChange={e => update('price', e.target.value)} />
              </div>

              <div className="inventory-form-footer">
                <button type="button" className="btn btn-outline flex-1 rounded-lg padded" onClick={cancelEdit} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-form-confirm" disabled={saving}>
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner-sm spinner"></div>
                      Guardando...
                    </div>
                  ) : 'Confirmar Cambios'}
                </button>
              </div>

              {editId && (
                <button type="button" onClick={() => handleDeleteProduct(editId)} className="btn-delete-link">
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
          <div className="modal-box animate-scale-in modal-sm">
            {/* Header */}
            <div className="inventory-modal-header secondary">
              <div className="inventory-modal-header-content">
                <div className="inventory-modal-icon glass">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                  <h3 className="inventory-modal-title">Categorías</h3>
                  <p className="inventory-modal-subtitle">Familias de insumos.</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-modal-close-glass" onClick={() => setShowCatModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="inventory-form gap-lg">
              <div className="category-list">
                {categories.map(c => (
                  <div key={c.idcategoriaproducto} className="category-item">
                    <span className="category-name">{c.descripcion}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditCatId(c.idcategoriaproducto); setCatName(c.descripcion); }} className="btn btn-ghost btn-icon padded-none size-32">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDeleteCategory(c.idcategoriaproducto)} className="btn btn-ghost btn-icon padded-none size-32 text-danger">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveCategory} className="category-new-form">
                <label className="inventory-input-label font-black">
                  {editCatId ? 'Editando Categoría' : 'Añadir Nueva Categoría'}
                </label>
                <div className="flex gap-3">
                  <SuggestionInput 
                    placeholder="Nombre..." 
                    value={catName} 
                    onChange={e => setCatName(e.target.value)} 
                    required 
                    className="flex-1 input-rounded" 
                    spellCheck={true} 
                    lang="es" 
                    suggestions={commonTerms.filter(t => products.map(p => p.nombre).includes(t) === false)} 
                  />
                  <button type="submit" className="btn btn-primary rounded-lg px-6" disabled={saving}>
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
        <div className="modal-overlay high-z" onClick={closeAlert}>
          <div className="modal-box animate-scale-in modal-xs" onClick={e => e.stopPropagation()}>
            <div className="padded-xl centered">
              <div className={`alert-icon-wrapper ${alertConfig.type === 'confirm' ? 'confirm' : 'alert'}`}>
                {alertConfig.type === 'confirm' ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                )}
              </div>
              
              <h3 className="alert-title">{alertConfig.title}</h3>
              <p className="alert-message">{alertConfig.message}</p>
              
              <div className="flex gap-4 centered">
                {alertConfig.type === 'confirm' ? (
                  <>
                    <button className="btn btn-outline flex-1 rounded-lg padded" onClick={closeAlert}>Cancelar</button>
                    <button className="btn btn-danger flex-1 rounded-lg padded shadow-danger" 
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
                  <button className="btn btn-primary w-full rounded-lg padded shadow-primary" onClick={closeAlert}>
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
        <div className={`inventory-snackbar ${snackbar.type}`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
