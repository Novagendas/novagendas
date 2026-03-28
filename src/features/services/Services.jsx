import React, { useState } from 'react';
import { useGlobalState } from '../../context/GlobalState';

export default function Services() {
  const { services, addService, updateService, deleteService } = useGlobalState();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Inyectables', duration: 30, price: '', color: '#3b82f6' });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', category: 'Inyectables', duration: 30, price: '', color: '#3b82f6' });
    setShowModal(true);
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, category: s.category, duration: s.duration, price: s.price, color: s.color });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const payload = { ...form, price: parseInt(form.price, 10), duration: parseInt(form.duration, 10) };
    if (editId) updateService(editId, payload);
    else addService(payload);

    setShowModal(false);
    setEditId(null);
    setForm({ name: '', category: 'Inyectables', duration: 30, price: '', color: '#3b82f6' });
  };

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const catIcon  = { Inyectables: '💉', Aparatología: '🔬', Cosmetología: '✨', Valoraciones: '📋' };
  const catColor = { Inyectables: '#6366f1', Aparatología: '#0ea5e9', Cosmetología: '#ec4899', Valoraciones: '#f59e0b' };

  /* Category summary */
  const catCount = services.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Catálogo de Procedimientos</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-4)', fontWeight: 500 }}>
            {services.length} tratamiento{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar Tratamiento
        </button>
      </div>

      {/* Category pills summary */}
      {services.length > 0 && (
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {Object.entries(catCount).map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.9rem', borderRadius: 99, background: `${catColor[cat] || '#6366f1'}12`, border: `1px solid ${catColor[cat] || '#6366f1'}28`, fontSize: '0.78rem', fontWeight: 700, color: catColor[cat] || '#6366f1' }}>
              {catIcon[cat]} {cat} <span style={{ opacity: 0.6 }}>·</span> {count}
            </div>
          ))}
        </div>
      )}

      {/* Services Grid */}
      {services.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.1rem' }}>
          {services.map((s, i) => (
            <div
              key={s.id}
              className="card card-hover animate-fade-in"
              style={{ animationDelay: `${i * 55}ms`, padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}
            >
              {/* Color accent header */}
              <div style={{ background: `linear-gradient(135deg, ${s.color}22, ${s.color}08)`, borderBottom: `1px solid ${s.color}20`, padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    {catIcon[s.category] || '💊'}
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, background: `${s.color}18`, color: s.color, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {s.category}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => startEdit(s)}
                    title="Editar servicio"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', display: 'flex', transition: 'var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button
                    onClick={() => deleteService(s.id)}
                    title="Eliminar servicio"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', display: 'flex', transition: 'var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-4)'; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.1rem 1.25rem' }}>
                <h3 style={{ margin: '0 0 0.55rem', fontSize: '1.05rem', lineHeight: 1.3, color: 'var(--text)' }}>{s.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-3)', fontSize: '0.81rem', marginBottom: '1rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontWeight: 600 }}>{s.duration} minutos de sesión</span>
                </div>

                {/* Price row with color-coded dot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Valor</span>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.025em' }}>{fmt(s.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-fade-in">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <h4 style={{ color: 'var(--text-3)', fontWeight: 700, margin: 0 }}>Catálogo vacío</h4>
          <p style={{ margin: 0, color: 'var(--text-4)', fontSize: '0.875rem' }}>Registra el primer tratamiento para comenzar a agendar citas.</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Registrar Tratamiento</button>
        </div>
      )}

      {/* ── Creation Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 460 }}>

            {/* Modal Header with gradient strip */}
            <div style={{ margin: '-2.25rem -2.25rem 1.75rem', background: `linear-gradient(135deg, ${form.color}25, ${form.color}08)`, borderBottom: `1px solid ${form.color}20`, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '1.4rem 2.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-4)' }}>Configura nombre, duración y tarifa.</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="input-group">
                <label>Nombre del servicio</label>
                <input className="input-field" placeholder="Ej. Depilación Láser Axilas" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Categoría</label>
                  <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)}>
                    {['Inyectables', 'Aparatología', 'Cosmetología', 'Valoraciones'].map(c => <option key={c} value={c}>{c}</option>)}
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

              {/* Live preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius)', background: `${form.color}09`, border: `1px solid ${form.color}28`, borderLeft: `3px solid ${form.color}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${form.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>{catIcon[form.category] || '💊'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.name || 'Nombre del servicio'}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-4)', fontWeight: 600 }}>{form.duration} min · {form.category}</p>
                </div>
                {form.price && <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem', flexShrink: 0 }}>{fmt(parseInt(form.price, 10) || 0)}</span>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-outline w-full" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full">{editId ? 'Guardar Cambios' : 'Guardar Servicio'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
