import React, { useState } from 'react';
import { useGlobalState } from '../../context/GlobalState';

const METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Nequi / Daviplata'];

const METHOD_ICONS = {
  'Efectivo':          '💵',
  'Tarjeta':           '💳',
  'Transferencia':     '🏦',
  'Nequi / Daviplata': '📱',
};

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export default function Payments() {
  const { payments, addPayment, deletePayment, updatePayment, clients, services, appointments } = useGlobalState();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ clientId: '', serviceId: '', appointmentId: '', amount: '', method: 'Efectivo', note: '' });
  const [filter, setFilter] = useState('all');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill amount when service selected
  const handleServiceChange = (serviceId) => {
    const svc = services.find(s => s.id === parseInt(serviceId));
    update('serviceId', serviceId);
    if (svc) update('amount', svc.price);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount) return;
    addPayment({
      clientId:      parseInt(form.clientId),
      serviceId:     parseInt(form.serviceId),
      appointmentId: parseInt(form.appointmentId) || null,
      amount:        parseInt(form.amount),
      method:        form.method,
      note:          form.note,
    });
    setShowModal(false);
    setForm({ clientId: '', serviceId: '', appointmentId: '', amount: '', method: 'Efectivo', note: '' });
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.method === filter);

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const todayRevenue = payments.filter(p => p.date === new Date().toISOString().split('T')[0]).reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Registro de Pagos</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-4)', fontWeight: 500 }}>{payments.length} transacciones registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar Pago
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          {
            label: 'Ingresos Totales', value: fmt(totalRevenue), color: 'var(--success)',
            sub: 'Acumulado de todas las transacciones',
            icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
          },
          {
            label: 'Ingresos de Hoy', value: fmt(todayRevenue), color: 'var(--primary)',
            sub: 'Recaudado en el día de hoy',
            icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
          },
          {
            label: 'Transacciones', value: payments.length, color: 'var(--accent)',
            sub: 'Pagos registrados en el sistema',
            icon: <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
          },
        ].map((s, i) => (
          <div key={i} className="card-stat animate-fade-in" style={{ animationDelay: `${i * 65}ms` }}>
            {/* Decorative bubbles */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `${s.color}0D`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -10, right: 20, width: 55, height: 55, borderRadius: '50%', background: `${s.color}07`, pointerEvents: 'none' }} />
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem', boxShadow: `0 0 0 6px ${s.color}07` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.25rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.2rem' }}>{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>{s.sub}</div>
          </div>
        ))}
      </div>


      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.3rem', width: 'fit-content' }}>
        {['all', ...METHODS].map(m => (
          <button key={m} onClick={() => setFilter(m)}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: filter === m ? 'var(--surface)' : 'transparent',
              color: filter === m ? 'var(--text)' : 'var(--text-3)',
              fontWeight: filter === m ? 700 : 500, fontSize: '0.82rem',
              fontFamily: 'var(--font-main)', boxShadow: filter === m ? 'var(--shadow-xs)' : 'none',
              transition: 'var(--transition)',
            }}>{m === 'all' ? '📊 Todos' : `${METHOD_ICONS[m]} ${m}`}</button>
        ))}
      </div>

      {/* ── Payments Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
        {filtered.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                {['Fecha', 'Paciente', 'Servicio', 'Método', 'Monto', 'Estado', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const client  = clients.find(c => c.id === p.clientId);
                const service = services.find(s => s.id === p.serviceId);
                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '0.875rem' }}>
                        {new Date(p.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                          {client?.name?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{client?.name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      {service ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: service.color, flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-2)', fontSize: '0.875rem', fontWeight: 500 }}>{service.name}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                        {METHOD_ICONS[p.method]} {p.method}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--success)' }}>{fmt(p.amount)}</span>
                    </td>
                    <td>
                      <span className="badge badge-success">{p.status}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: 'var(--text-4)', display: 'flex', alignItems: 'center', transition: 'var(--transition)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-4)'; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ border: 'none', padding: '4rem' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h4 style={{ margin: 0, color: 'var(--text-3)' }}>Sin transacciones</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-4)' }}>Registra el primer pago usando el botón de arriba.</p>
          </div>
        )}
      </div>

      {/* ── Register Payment Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Registrar Pago</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-4)' }}>Ingresa los datos de la transacción.</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>Paciente</label>
                <select className="input-field" value={form.clientId} onChange={e => update('clientId', e.target.value)} required>
                  <option value="" disabled>Selecciona paciente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} (CC {c.doc})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Servicio Prestado</label>
                  <select className="input-field" value={form.serviceId} onChange={e => handleServiceChange(e.target.value)}>
                    <option value="">Sin especificar</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Método de Pago</label>
                  <select className="input-field" value={form.method} onChange={e => update('method', e.target.value)}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Monto Cobrado (COP)</label>
                <input type="number" className="input-field" placeholder="Ej. 850000" value={form.amount} onChange={e => update('amount', e.target.value)} required min="0" />
              </div>

              <div className="input-group">
                <label>Nota u Observación (Opcional)</label>
                <input className="input-field" placeholder="Ej. Descuento aplicado por cortesía..." value={form.note} onChange={e => update('note', e.target.value)} />
              </div>

              {/* Preview */}
              {form.amount && (
                <div className="alert alert-success animate-fade-in">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                  Se registrará <strong>{fmt(parseInt(form.amount))}</strong> vía <strong>{form.method}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline w-full" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary w-full">Confirmar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-box animate-scale-in" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem' }}>¿Eliminar transacción?</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem' }}>Esta acción es irreversible.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline w-full" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn btn-danger w-full" onClick={() => { deletePayment(deleteTarget); setDeleteTarget(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
