import { supabase, insertLog } from '../../Supabase/supabaseClient';
import { useState, useEffect, useRef } from 'react';
import './Payments.css';

const METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Nequi / Daviplata'];

const METHOD_ICONS = {
  'Efectivo': '💵',
  'Tarjeta': '💳',
  'Transferencia': '🏦',
  'Nequi / Daviplata': '📱',
};

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// Helper to handle potential day-shifts from UTC to Local
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  // Ensure the string is treated as UTC if it's missing the Z suffix (common with TIMESTAMP columns)
  let normalized = dateStr;
  if (!normalized.includes('Z') && !normalized.includes('+')) {
    normalized = normalized.replace(' ', 'T') + 'Z';
  }
  return new Date(normalized);
};

/* ─── Buscador de pacientes ─────────────────────────────────── */
const ClientSearchSelect = ({ clients, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = clients.filter(c =>
    `${c.nombre} ${c.apellido} ${c.cedula}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = clients.find(c => String(c.idcliente) === String(value));

  return (
    <div ref={wrapRef} className="client-search-wrapper">
      <div
        onClick={() => setIsOpen(o => !o)}
        className="client-search-trigger"
        style={{ border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--border-strong)'}`, boxShadow: isOpen ? '0 0 0 4px var(--primary-light)' : 'var(--shadow-sm)' }}
      >
        <span className="client-search-icon-text">👤</span>
        <div className="client-search-placeholder" style={{ color: selected ? 'var(--text)' : 'var(--text-5)', fontWeight: selected ? 700 : 500 }}>
          {selected ? `${selected.nombre} ${selected.apellido}` : 'Busca un paciente...'}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="3" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>

      {isOpen && (
        <div className="client-search-dropdown animate-scale-in">
          <div className="client-search-header">
            <div className="client-search-input-box">
              <input
                autoFocus
                type="text"
                placeholder="Escribe nombre o cédula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field client-search-input"
              />
              <svg className="client-search-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </div>
          <div className="client-search-results">
            {filtered.length > 0 ? filtered.map(c => (
              <div
                key={c.idcliente}
                className="client-result-item"
                onClick={() => { onChange(String(c.idcliente)); setIsOpen(false); setSearch(''); }}
                style={{
                  background: String(value) === String(c.idcliente) ? 'var(--primary-light)' : 'transparent',
                  color: String(value) === String(c.idcliente) ? 'var(--primary)' : 'var(--text-2)'
                }}
              >
                <span>{c.nombre} {c.apellido}</span>
                <span className="client-result-id">CC {c.cedula}</span>
              </div>
            )) : (
              <div className="client-no-results">
                <div className="client-no-results-emoji">🔍</div>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Payments({ user, tenant }) {
  const [payments, setPayments] = useState([]);
  const [methods, setMethods] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ clientId: '', serviceId: '', amount: '', method: 'Efectivo', note: '' });
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    // Methods
    const { data: methData } = await supabase.from('metodopago').select('*');
    setMethods(methData || []);
    if (methData?.length > 0 && !form.method) update('method', methData[0].tipo);

    // Clients
    const { data: cliData } = await supabase.from('cliente').select('*').eq('idnegocios', tenant.id);
    setClients(cliData || []);

    // Services
    const { data: svcData } = await supabase.from('servicios').select('*').eq('idnegocios', tenant.id);
    setServices(svcData || []);

    // Local Payments
    const { data: payData, error } = await supabase
      .from('pagos')
      .select('*, cliente(nombre, apellido), servicios(nombre)')
      .eq('idnegocios', tenant.id)
      .order('idpagos', { ascending: false });

    if (!error) setPayments(payData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill amount when service selected
  const handleServiceChange = (serviceId) => {
    const svc = services.find(s => s.idservicios === parseInt(serviceId));
    update('serviceId', serviceId);
    if (svc) update('amount', svc.precio);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount) return;
    setSaving(true);

    const meth = methods.find(m => m.tipo === form.method) || methods[0];

    const payload = {
      idmetodopago: meth?.idmetodopago || 1,
      idcliente: parseInt(form.clientId),
      idservicios: form.serviceId ? parseInt(form.serviceId) : null,
      monto: parseInt(form.amount),
      estado: 'Pagado',
      observacion: form.note,
      idnegocios: tenant.id,
      fecha: new Date().toISOString() // Send full ISO string to Supabase
    };

    setShowModal(false);

    const { data, error } = await supabase.from('pagos').insert([payload]).select();

    if (!error) {
      const client = clients.find(c => c.idcliente === parseInt(form.clientId));
      insertLog({
        accion: 'CREATE',
        entidad: 'Pago',
        descripcion: `Se registró pago de ${fmt(payload.monto)} de ${client?.nombre || 'Paciente'} vía ${form.method}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });

      showSnack('Pago registrado correctamente');
      fetchData();
      setForm({ clientId: '', serviceId: '', amount: '', method: methods[0]?.tipo || 'Efectivo', note: '' });
    } else {
      showSnack('Error al registrar pago', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('pagos').delete().eq('idpagos', id);
    if (!error) {
      await insertLog({
        accion: 'DELETE',
        entidad: 'Pago',
        descripcion: `Se eliminó registro de pago #${id}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      showSnack('Registro de pago eliminado');
      fetchData();
    }
    setDeleteTarget(null);
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => {
    const meth = methods.find(m => m.idmetodopago === p.idmetodopago);
    return meth?.tipo === filter;
  });

  const totalRevenue = payments.reduce((s, p) => s + Number(p.monto), 0);
  
  // Today revenue matching the user's local calendar day
  const todayRevenue = payments.filter(p => {
    const pDate = parseDate(p.fecha);
    const today = new Date();
    return pDate.toLocaleDateString('es-CO') === today.toLocaleDateString('es-CO');
  }).reduce((s, p) => s + Number(p.monto), 0);

  return (
    <div className="payments-container">

      {/* ── Header ── */}
      <div className="payments-header">
        <div className="payments-title">
          <h2>Registro de Pagos</h2>
          <p className="payments-subtitle">{payments.length} transacciones registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { fetchData(); setShowModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Registrar Pago
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="payments-summary-grid">
        {[
          {
            label: 'Ingresos Totales', value: fmt(totalRevenue), color: 'var(--success)',
            sub: 'Acumulado de todas las transacciones',
            icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
          },
          {
            label: 'Ingresos de Hoy', value: fmt(todayRevenue), color: 'var(--primary)',
            sub: 'Recaudado en el día de hoy',
            icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
          },
          {
            label: 'Transacciones', value: payments.length, color: 'var(--accent)',
            sub: 'Pagos registrados en el sistema',
            icon: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
          },
        ].map((s, i) => (
          <div key={i} className="card-stat payment-stat-card animate-fade-in" style={{ animationDelay: `${i * 65}ms`, '--stat-color': s.color, '--bubble-color-1': `${s.color}0D`, '--bubble-color-2': `${s.color}07`, '--icon-bg': `${s.color}14`, '--icon-shadow': `${s.color}07` }}>
            <div className="stat-bubble-lg" />
            <div className="stat-bubble-sm" />
            <div className="stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-subtext">{s.sub}</div>
          </div>
        ))}
      </div>

      {methods.length === 0 && !loading && (
        <div className="alert alert-warning animate-fade-in">
          <h4>Métodos de pago no configurados</h4>
          <p>Por favor póngase en contacto con soporte para la configuración de sus métodos de pago.</p>
        </div>
      )}
      <div className="payments-filter-bar">
        {['all', ...methods.map(m => m.tipo)].map(m => (
          <button key={m} onClick={() => setFilter(m)}
            className={`filter-btn ${filter === m ? 'filter-btn--active' : ''}`}
          >
            {m === 'all' ? '📊 Todos' : `${METHOD_ICONS[m] || '💰'} ${m}`}
          </button>
        ))}
      </div>

      {/* ── Payments Table ── */}
      <div className="card payments-table-card">
        {filtered.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {['Fecha', 'Paciente', 'Servicio', 'Método', 'Monto', 'Estado', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="table-loader">Cargando transacciones...</td></tr>
                ) : filtered.map(p => {
                  const meth = methods.find(m => m.idmetodopago === p.idmetodopago);
                  const client = clients.find(c => c.idcliente === p.idcliente);
                  return (
                    <tr key={p.idpagos}>
                      <td>{p.fecha ? parseDate(p.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td><span className="payment-client-name">{client?.nombre || 'Desconocido'}</span></td>
                      <td><span className="payment-service-name">{p.servicios?.nombre || '—'}</span></td>
                      <td>
                        <span className="badge badge-neutral payment-method-badge">
                          {METHOD_ICONS[meth?.tipo] || '💰'} {meth?.tipo || '—'}
                        </span>
                      </td>
                      <td><span className="payment-amount">{fmt(p.monto)}</span></td>
                      <td><span className="badge badge-success">Pagado</span></td>
                      <td className="table-actions">
                        <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(p.idpagos)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            <h4>Sin transacciones</h4>
            <p>Registra el primer pago usando el botón de arriba.</p>
          </div>
        )}
      </div>

      {/* ── Register Payment Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in payment-modal-box">
            {/* Header */}
            <div className="payment-modal-header" style={{ '--payment-modal-bg': 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}>
              <div className="payment-modal-inner-row">
                <div className="payment-modal-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <h3 className="payment-modal-title">Registrar Pago</h3>
                  {form.amount ? (
                    <div className="payment-modal-summary-pill">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                      {fmt(parseInt(form.amount))} vía {form.method}
                    </div>
                  ) : (
                    <p className="payment-modal-hint">Ingresa los detalles del ingreso.</p>
                  )}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon payment-modal-close-btn" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="payment-modal-scroll">
                <div className="input-group">
                  <label className="input-label">Paciente / Cliente</label>
                  <ClientSearchSelect clients={clients} value={form.clientId} onChange={v => update('clientId', v)} />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Servicio Prestado</label>
                    <select className="input-field" value={form.serviceId} onChange={e => handleServiceChange(e.target.value)}>
                      <option value="">Sin especificar</option>
                      {services.map(s => <option key={s.idservicios} value={s.idservicios}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Método de Pago</label>
                    <select className="input-field" value={form.method} onChange={e => update('method', e.target.value)}>
                      {methods.map(m => <option key={m.idmetodopago} value={m.tipo}>{m.tipo}</option>)}
                    </select>
                  </div>
                </div>

                <div className="payment-amount-box">
                  <label className="input-label">Monto Cobrado (COP)</label>
                  <div className="amount-input-wrapper">
                    <span className="amount-currency-symbol">$</span>
                    <input type="number" className="input-field amount-input" placeholder="0" value={form.amount} onChange={e => update('amount', e.target.value)} required min="0" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Nota u Observación (Opcional)</label>
                  <input className="input-field" placeholder="Ej. Descuento aplicado..." value={form.note} onChange={e => update('note', e.target.value)} />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline btn-flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-flex-2">Confirmar Pago</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box animate-scale-in delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-content-confirm">
              <div className="confirm-icon-wrapper danger">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              </div>
              <h3 className="confirm-title">¿Eliminar pago?</h3>
              <p className="confirm-text">Esta acción es irreversible y afectará los reportes financieros.</p>

              <div className="modal-actions">
                <button className="btn btn-outline btn-flex-1" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn btn-danger btn-flex-1" onClick={() => handleDelete(deleteTarget)}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Snackbar ── */}
      {snackbar.show && (
        <div className={`payment-snackbar payment-snackbar--${snackbar.type}`}>
          {snackbar.type === 'success' ? '✓' : '✕'} {snackbar.message}
        </div>
      )}
    </div>
  );
}
