import { supabase, insertLog } from '../../Supabase/supabaseClient';
import { useState, useEffect, useRef } from 'react';

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
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{
          background: 'var(--surface)', border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center',
          gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 4px var(--primary-light)' : 'var(--shadow-sm)'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>👤</span>
        <div style={{ flex: 1, color: selected ? 'var(--text)' : 'var(--text-5)', fontWeight: selected ? 700 : 500, fontSize: '0.92rem' }}>
          {selected ? `${selected.nombre} ${selected.apellido}` : 'Busca un paciente...'}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="3" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>

      {isOpen && (
        <div className="animate-scale-in" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '16px', marginTop: '0.5rem', boxShadow: 'var(--shadow-xl)',
          zIndex: 3000, overflow: 'hidden'
        }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <input
                autoFocus
                type="text"
                placeholder="Escribe nombre o cédula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field"
                style={{ padding: '0.55rem 1rem 0.55rem 2.25rem', fontSize: '0.87rem', borderRadius: '10px', border: '1.5px solid var(--border-strong)' }}
              />
              <svg style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {filtered.length > 0 ? filtered.map(c => (
              <div
                key={c.idcliente}
                onClick={() => { onChange(String(c.idcliente)); setIsOpen(false); setSearch(''); }}
                style={{
                  padding: '0.8rem 1.1rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                  background: String(value) === String(c.idcliente) ? 'var(--primary-light)' : 'transparent',
                  color: String(value) === String(c.idcliente) ? 'var(--primary)' : 'var(--text-2)',
                  transition: 'all 0.15s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                onMouseEnter={e => { if (String(value) !== String(c.idcliente)) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={e => { if (String(value) !== String(c.idcliente)) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{c.nombre} {c.apellido}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>CC {c.cedula}</span>
              </div>
            )) : (
              <div style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.87rem' }}>
                <div style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>🔍</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Registro de Pagos</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-4)', fontWeight: 500 }}>{payments.length} transacciones registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { fetchData(); setShowModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Registrar Pago
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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

      {methods.length === 0 && !loading && (
        <div className="alert alert-warning animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Métodos de pago no configurados</h4>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Por favor póngase en contacto con soporte para la configuración de sus métodos de pago.</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.3rem', width: 'fit-content' }}>
        {['all', ...methods.map(m => m.tipo)].map(m => (
          <button key={m} onClick={() => setFilter(m)}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: filter === m ? 'var(--surface)' : 'transparent',
              color: filter === m ? 'var(--text)' : 'var(--text-3)',
              fontWeight: filter === m ? 700 : 500, fontSize: '0.82rem',
              fontFamily: 'var(--font-main)', boxShadow: filter === m ? 'var(--shadow-xs)' : 'none',
              transition: 'var(--transition)',
            }}>{m === 'all' ? '📊 Todos' : `${METHOD_ICONS[m] || '💰'} ${m}`}</button>
        ))}
      </div>

      {/* ── Payments Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '4rem' }}>
        {filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Fecha', 'Paciente', 'Servicio', 'Método', 'Monto', 'Estado', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)' }}>Cargando transacciones...</td></tr>
                ) : filtered.map(p => {
                  const meth = methods.find(m => m.idmetodopago === p.idmetodopago);
                  const client = clients.find(c => c.idcliente === p.idcliente);
                  return (
                    <tr key={p.idpagos}>
                      <td>{p.fecha ? parseDate(p.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td><span style={{ fontWeight: 800 }}>{client?.nombre || 'Desconocido'}</span></td>
                      <td><span style={{ color: 'var(--text-4)', fontSize: '0.82rem' }}>{p.servicios?.nombre || '—'}</span></td>
                      <td>
                        <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content' }}>
                          {METHOD_ICONS[meth?.tipo] || '💰'} {meth?.tipo || '—'}
                        </span>
                      </td>
                      <td><span style={{ fontWeight: 800, color: 'var(--success)' }}>{fmt(p.monto)}</span></td>
                      <td><span className="badge badge-success">Pagado</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(p.idpagos)} style={{ color: 'var(--text-4)' }}>
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
          <div className="empty-state" style={{ border: 'none', padding: '4rem' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            <h4 style={{ margin: 0, color: 'var(--text-3)' }}>Sin transacciones</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-4)' }}>Registra el primer pago usando el botón de arriba.</p>
          </div>
        )}
      </div>

      {/* ── Register Payment Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Registrar Pago</h3>
                  {form.amount ? (
                    <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#fff', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                      {fmt(parseInt(form.amount))} vía {form.method}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Ingresa los detalles del ingreso.</p>
                  )}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div className="modal-scroll-area" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', fontWeight: 700 }}>Paciente / Cliente</label>
                  <ClientSearchSelect clients={clients} value={form.clientId} onChange={v => update('clientId', v)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', fontWeight: 700 }}>Servicio Prestado</label>
                    <select className="input-field" value={form.serviceId} onChange={e => handleServiceChange(e.target.value)} style={{ borderRadius: '12px' }}>
                      <option value="">Sin especificar</option>
                      {services.map(s => <option key={s.idservicios} value={s.idservicios}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', fontWeight: 700 }}>Método de Pago</label>
                    <select className="input-field" value={form.method} onChange={e => update('method', e.target.value)} style={{ borderRadius: '12px' }}>
                      {methods.map(m => <option key={m.idmetodopago} value={m.tipo}>{m.tipo}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', fontWeight: 700 }}>Monto Cobrado (COP)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-3)' }}>$</span>
                    <input type="number" className="input-field" placeholder="0" value={form.amount} onChange={e => update('amount', e.target.value)} required min="0" style={{ borderRadius: '12px', paddingLeft: '2.5rem', fontSize: '1.25rem', fontWeight: 900 }} />
                  </div>
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', fontWeight: 700 }}>Nota u Observación (Opcional)</label>
                  <input className="input-field" placeholder="Ej. Descuento aplicado..." value={form.note} onChange={e => update('note', e.target.value)} style={{ borderRadius: '12px' }} />
                </div>



                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', height: '52px', fontWeight: 700 }} onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '14px', height: '52px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 24px var(--primary-light)' }}>Confirmar Pago</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              </div>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>¿Eliminar pago?</h3>
              <p style={{ margin: '0 0 2rem', fontSize: '1rem', color: 'var(--text-4)', lineHeight: 1.5 }}>Esta acción es irreversible y afectará los reportes financieros.</p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }} onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn btn-danger" style={{ flex: 1, borderRadius: '14px', padding: '0.8rem', background: 'var(--danger)', boxShadow: '0 8px 20px var(--danger-light)' }} onClick={() => handleDelete(deleteTarget)}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Snackbar ── */}
      {snackbar.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, background: snackbar.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', transform: 'translateY(0)', animation: 'slideInBottom 0.3s ease-out' }}>
          <style>{`
            @keyframes slideInBottom { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
          {snackbar.type === 'success' ? '✓' : '✕'} {snackbar.message}
        </div>
      )}
    </div>
  );
}
