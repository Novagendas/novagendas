import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';

export default function Inventory() {
  const { inventory, addInventory, updateInventoryItem, updateStock } = useGlobalState();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Inyectables', initial: '', minStock: 5 });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, category: item.category, initial: item.stock, minStock: item.minStock });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ name: '', category: 'Inyectables', initial: '', minStock: 5 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || form.initial === '') return;
    
    if (editId) {
      updateInventoryItem(editId, { name: form.name, category: form.category, stock: parseInt(form.initial, 10), minStock: parseInt(form.minStock, 10) });
    } else {
      addInventory({ name: form.name, category: form.category, stock: parseInt(form.initial, 10), minStock: parseInt(form.minStock, 10) });
    }
    cancelEdit();
  };

  const alertas = inventory.filter(i => i.status === 'low').length;

  const stockPercent = (item) => Math.min(100, (item.stock / Math.max(item.minStock * 2, 1)) * 100);

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
            <div className="input-group">
              <label>Categoría</label>
              <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)}>
                {['Inyectables','Material Médico','Insumos Láser','Cosmetología'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary w-full">
                {editId ? 'Guardar Cambios' : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Agregar al Inventario</>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Inventario Central Soleil</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.77rem', color: 'var(--text-4)', fontWeight: 500 }}>{inventory.length} productos · {alertas} alertas activas</p>
          </div>
          <span className={`badge ${alertas > 0 ? 'badge-danger' : 'badge-success'}`}>
            {alertas > 0 ? `${alertas} Críticos` : '✓ Todo en Orden'}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {inventory.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'center' }}>Nivel de Stock</th>
                  <th style={{ textAlign: 'center' }}>Actual / Mín.</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Ajuste</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const pct = stockPercent(item);
                  const isLow = item.status === 'low';
                  const barColor = isLow ? 'var(--danger)' : pct < 60 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <tr key={item.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{item.name}</span>
                      </td>
                      <td>
                        <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>{item.category}</span>
                      </td>
                      <td style={{ minWidth: 120, padding: '1rem' }}>
                        <div style={{ background: 'var(--surface-3)', borderRadius: 99, height: 6, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.5s var(--ease), background 0.3s' }} />
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', fontWeight: 600, marginTop: 4, textAlign: 'center' }}>{Math.round(pct)}% del nivel objetivo</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: isLow ? 'var(--danger)' : 'var(--text)', lineHeight: 1 }}>{item.stock}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', display: 'block', fontWeight: 600, marginTop: 1 }}>min. {item.minStock}</span>
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
                          ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                          
                          <button
                            onClick={() => updateStock(item.id, -1)}
                            style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >−</button>
                          <button
                            onClick={() => updateStock(item.id, 1)}
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <h4 style={{ color: 'var(--text-3)', fontWeight: 700, margin: 0 }}>Sin productos</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-4)' }}>Usa el formulario izquierdo para registrar el primer insumo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
