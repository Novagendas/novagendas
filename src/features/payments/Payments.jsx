import { supabase, insertLog } from '../../Supabase/supabaseClient';
import { useState, useEffect } from 'react';
import SelectableInput from '../../components/inputs/SelectableInput';
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS } from '../../utils/constants';
import { fmt } from '../../utils/formatters';
import { parseDate } from '../../utils/dateHelpers';
import './Payments.css';

const METHOD_ICONS = PAYMENT_METHOD_ICONS;



export default function Payments({ user, tenant }) {
  const [payments, setPayments] = useState([]);
  const [abonos, setAbonos] = useState([]);
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
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailPayment, setDetailPayment] = useState(null);
  const [detailAbono, setDetailAbono] = useState(null);
  const [form, setForm] = useState({ clientId: '', serviceId: '', amount: '', method: 'Efectivo', note: '' });
  const [abonoForm, setAbonoForm] = useState({ clientId: '', monto: '', method: 'Efectivo', note: '', serviceId: '' });
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pagos');

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
      .is('deleted_at', null)
      .order('idpagos', { ascending: false });

    if (!error) setPayments(payData || []);

    // Abonos (advance payments)
    const { data: abonoData } = await supabase
      .from('abono')
      .select('*, cliente(nombre, apellido), metodopago(tipo), servicios(nombre)')
      .eq('idnegocios', tenant.id)
      .is('deleted_at', null)
      .order('idabono', { ascending: false });

    setAbonos(abonoData || []);
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
    const { error } = await supabase.from('pagos').update({ deleted_at: new Date().toISOString() }).eq('idpagos', id);
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

  const updateAbono = (k, v) => setAbonoForm(f => ({ ...f, [k]: v }));

  const handleAbonoSubmit = async (e) => {
    e.preventDefault();
    if (!abonoForm.clientId || !abonoForm.monto || Number(abonoForm.monto) <= 0) {
      showSnack('Paciente y monto son obligatorios', 'error');
      return;
    }
    setSaving(true);
    const meth = methods.find(m => m.tipo === abonoForm.method) || methods[0];
    const monto = parseFloat(abonoForm.monto);
    const { error } = await supabase.from('abono').insert([{
      idcliente: parseInt(abonoForm.clientId),
      idusuario: user.idusuario || user.id,
      idmetodopago: meth?.idmetodopago || null,
      idservicios: abonoForm.serviceId ? parseInt(abonoForm.serviceId) : null,
      monto,
      saldo_disponible: monto,
      observacion: abonoForm.note || null,
      idnegocios: tenant.id,
    }]);
    if (!error) {
      const client = clients.find(c => c.idcliente === parseInt(abonoForm.clientId));
      await insertLog({
        accion: 'CREATE',
        entidad: 'Abono',
        descripcion: `Abono de ${fmt(monto)} para ${client?.nombre || 'Paciente'} vía ${abonoForm.method}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id,
      });
      showSnack('Abono registrado correctamente');
      setAbonoForm({ clientId: '', monto: '', method: methods[0]?.tipo || 'Efectivo', note: '', serviceId: '' });
      setShowAbonoModal(false);
      fetchData();
    } else {
      showSnack('Error al registrar abono', 'error');
    }
    setSaving(false);
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
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => { fetchData(); setShowAbonoModal(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Nuevo Abono
          </button>
          <button className="btn btn-primary" onClick={() => { fetchData(); setShowModal(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Registrar Pago
          </button>
        </div>
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
      {/* ── Tab Switcher ── */}
      <div className="payments-filter-bar">
        <button
          className={`filter-btn ${activeTab === 'pagos' ? 'filter-btn--active' : ''}`}
          onClick={() => setActiveTab('pagos')}
        >💳 Pagos</button>
        <button
          className={`filter-btn ${activeTab === 'abonos' ? 'filter-btn--active' : ''}`}
          onClick={() => setActiveTab('abonos')}
        >🏦 Abonos ({abonos.filter(a => Number(a.saldo_disponible) > 0).length} con saldo)</button>
      </div>

      {activeTab === 'abonos' ? (
        <div className="card payments-table-card">
          {abonos.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Fecha', 'Paciente', 'Servicio', 'Monto', 'Saldo Disponible', 'Método'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {abonos.map(a => (
                    <tr key={a.idabono} className="payment-row-clickable" onClick={() => setDetailAbono(a)}>
                      <td>{a.fecha_abono ? new Date(a.fecha_abono).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td><span className="payment-client-name">{a.cliente?.nombre || '—'} {a.cliente?.apellido || ''}</span></td>
                      <td><span className="payment-service-name">{a.servicios?.nombre || '—'}</span></td>
                      <td><span className="payment-amount">{fmt(a.monto)}</span></td>
                      <td>
                        <span className={`badge ${Number(a.saldo_disponible) > 0 ? 'badge-success' : 'badge-neutral'}`}>
                          {fmt(a.saldo_disponible)}
                        </span>
                      </td>
                      <td>{a.metodopago?.tipo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <h4>Sin abonos registrados</h4>
              <p>Crea el primer abono con el botón "Nuevo Abono".</p>
            </div>
          )}
        </div>
      ) : (
      <>
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
                  {['Fecha', 'Paciente', 'Servicio', 'Método', 'Monto', 'Estado'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="table-loader">Cargando transacciones...</td></tr>
                ) : filtered.map(p => {
                  const meth = methods.find(m => m.idmetodopago === p.idmetodopago);
                  const client = clients.find(c => c.idcliente === p.idcliente);
                  return (
                    <tr key={p.idpagos} className="payment-row-clickable" onClick={() => setDetailPayment({ ...p, client, meth })}>
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
      </>
      )}

      {/* ── Abono Modal ── */}
      {showAbonoModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAbonoModal(false)}>
          <div className="modal-box animate-scale-in payment-modal-box">
            <div className="payment-modal-header" style={{ '--payment-modal-bg': 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)' }}>
              <div className="payment-modal-inner-row">
                <div className="payment-modal-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="payment-modal-title">Registrar Abono</h3>
                  {abonoForm.monto ? (
                    <div className="payment-modal-summary-pill">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                      {fmt(parseFloat(abonoForm.monto) || 0)} · saldo disponible
                    </div>
                  ) : (
                    <p className="payment-modal-hint">Pago anticipado para aplicar en citas.</p>
                  )}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon payment-modal-close-btn" onClick={() => setShowAbonoModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form onSubmit={handleAbonoSubmit} className="modal-form">
              <div className="payment-modal-scroll">
                <div className="input-group">
                  <label className="input-label">Paciente / Cliente</label>
                  <SelectableInput
                    label="Paciente"
                    options={clients.map(c => ({ value: c.idcliente, label: `${c.nombre} ${c.apellido}`, cedula: c.cedula }))}
                    value={abonoForm.clientId}
                    onChange={v => updateAbono('clientId', v)}
                    placeholder="Busca un paciente..."
                    icon="👤"
                    isClientSearch={true}
                  />
                </div>
                <div className="grid-2">
                  <div className="payment-amount-box">
                    <label className="input-label">Monto del Abono (COP)</label>
                    <div className="amount-input-wrapper">
                      <span className="amount-currency-symbol">$</span>
                      <input type="number" className="input-field amount-input" placeholder="0" value={abonoForm.monto} onChange={e => updateAbono('monto', e.target.value)} required min="1" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Método de Pago</label>
                    <select className="input-field" value={abonoForm.method} onChange={e => updateAbono('method', e.target.value)}>
                      {methods.map(m => <option key={m.idmetodopago} value={m.tipo}>{m.tipo}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Servicio (Opcional)</label>
                  <select className="input-field" value={abonoForm.serviceId} onChange={e => updateAbono('serviceId', e.target.value)}>
                    <option value="">— Sin servicio específico —</option>
                    {services.map(s => <option key={s.idservicios} value={s.idservicios}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Nota u Observación (Opcional)</label>
                  <input className="input-field" placeholder="Ej. Abono para paquete de sesiones..." value={abonoForm.note} onChange={e => updateAbono('note', e.target.value)} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline btn-flex-1" onClick={() => setShowAbonoModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-flex-2" disabled={saving}>
                    {saving ? 'Guardando...' : 'Registrar Abono'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <SelectableInput
                    label="Paciente"
                    options={clients.map(c => ({
                      value: c.idcliente,
                      label: `${c.nombre} ${c.apellido}`,
                      cedula: c.cedula,
                    }))}
                    value={form.clientId}
                    onChange={v => update('clientId', v)}
                    placeholder="Busca un paciente..."
                    icon="👤"
                    isClientSearch={true}
                  />
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
      {/* ── Payment Detail Modal ── */}
      {detailPayment && (
        <div className="modal-overlay" onClick={() => setDetailPayment(null)}>
          <div className="modal-box animate-scale-in payment-detail-box" onClick={e => e.stopPropagation()}>
            <div className="payment-detail-header">
              <div className="payment-detail-header-inner">
                <div className="payment-detail-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <h3 className="payment-detail-title">Detalle del Pago</h3>
                  <p className="payment-detail-subtitle">#{detailPayment.idpagos}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon payment-detail-close" onClick={() => setDetailPayment(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="payment-detail-body">
              <div className="payment-detail-amount-row">
                <span className="payment-detail-amount">{fmt(detailPayment.monto)}</span>
                <span className="badge badge-success">Pagado</span>
              </div>

              <div className="payment-detail-grid">
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Paciente</span>
                  <span className="payment-detail-value">{detailPayment.client?.nombre} {detailPayment.client?.apellido}</span>
                </div>
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Fecha</span>
                  <span className="payment-detail-value">{detailPayment.fecha ? parseDate(detailPayment.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Servicio</span>
                  <span className="payment-detail-value">{detailPayment.servicios?.nombre || '—'}</span>
                </div>
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Método de Pago</span>
                  <span className="payment-detail-value">{METHOD_ICONS[detailPayment.meth?.tipo] || '💰'} {detailPayment.meth?.tipo || '—'}</span>
                </div>
              </div>

              {detailPayment.observacion && (
                <div className="payment-detail-notes">
                  <span className="payment-detail-label">Notas / Observaciones</span>
                  <p className="payment-detail-notes-text">{detailPayment.observacion}</p>
                </div>
              )}
              {!detailPayment.observacion && (
                <div className="payment-detail-notes payment-detail-notes--empty">
                  <span className="payment-detail-label">Notas / Observaciones</span>
                  <p className="payment-detail-notes-empty">Sin notas registradas.</p>
                </div>
              )}
            </div>

            <div className="payment-detail-footer">
              <button className="btn btn-outline btn-flex-1" onClick={() => setDetailPayment(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Abono Detail Modal ── */}
      {detailAbono && (
        <div className="modal-overlay" onClick={() => setDetailAbono(null)}>
          <div className="modal-box animate-scale-in payment-detail-box" onClick={e => e.stopPropagation()}>
            <div className="payment-detail-header">
              <div className="payment-detail-header-inner">
                <div className="payment-detail-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="payment-detail-title">Detalle del Abono</h3>
                  <p className="payment-detail-subtitle">#{detailAbono.idabono}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon payment-detail-close" onClick={() => setDetailAbono(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="payment-detail-body">
              <div className="payment-detail-amount-row">
                <span className="payment-detail-amount">{fmt(detailAbono.monto)}</span>
                <span className={`badge ${Number(detailAbono.saldo_disponible) > 0 ? 'badge-success' : 'badge-neutral'}`}>
                  Saldo: {fmt(detailAbono.saldo_disponible)}
                </span>
              </div>

              <div className="payment-detail-grid">
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Paciente</span>
                  <span className="payment-detail-value">{detailAbono.cliente?.nombre} {detailAbono.cliente?.apellido}</span>
                </div>
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Fecha</span>
                  <span className="payment-detail-value">{detailAbono.fecha_abono ? new Date(detailAbono.fecha_abono).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Servicio</span>
                  <span className="payment-detail-value">{detailAbono.servicios?.nombre || '—'}</span>
                </div>
                <div className="payment-detail-field">
                  <span className="payment-detail-label">Método de Pago</span>
                  <span className="payment-detail-value">{detailAbono.metodopago?.tipo || '—'}</span>
                </div>
              </div>

              {detailAbono.observacion ? (
                <div className="payment-detail-notes">
                  <span className="payment-detail-label">Notas / Observaciones</span>
                  <p className="payment-detail-notes-text">{detailAbono.observacion}</p>
                </div>
              ) : (
                <div className="payment-detail-notes payment-detail-notes--empty">
                  <span className="payment-detail-label">Notas / Observaciones</span>
                  <p className="payment-detail-notes-empty">Sin notas registradas.</p>
                </div>
              )}
            </div>

            <div className="payment-detail-footer">
              <button className="btn btn-outline btn-flex-1" onClick={() => setDetailAbono(null)}>Cerrar</button>
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
