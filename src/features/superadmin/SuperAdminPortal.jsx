import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './SuperAdminPortal.css';

const authHelper = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://aulddrljywoigivxugqf.supabase.co/',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kRI9Xe0UXW9Ma0ecTdQWZQ_6uba91Cm',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

const ESTADO_OPTIONS = [
  { id: 1, label: 'Activo',      bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  { id: 2, label: 'Suspendido',  bg: '#fff7ed', color: '#ea580c', border: '#fdba74' },
  { id: 3, label: 'Eliminado',   bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  { id: 4, label: 'En Espera',   bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  { id: 5, label: 'En Revisión', bg: '#eff6ff', color: '#7c3aed', border: '#a5b4fc' },
  { id: 6, label: 'Deployed',    bg: '#ecfeff', color: '#0891b2', border: '#67e8f9' },
];

const ROL_OPTIONS = [
  { id: 1, label: 'Administrador' },
  { id: 2, label: 'Recepcionista' },
  { id: 3, label: 'Profesional / Especialista' },
];

const TABS = [
  { id: 'negocios',   label: 'Negocios',    icon: '🏢' },
  { id: 'usuarios',   label: 'Usuarios',    icon: '👥' },
  { id: 'ubicaciones',label: 'Ubicaciones', icon: '📍' },
  { id: 'monitoreo',  label: 'Monitoreo',   icon: '📊' },
];

/* ─── Small components ─────────────────────────────────── */
function Snackbar({ snack }) {
  if (!snack) return null;
  const bg = snack.type === 'error' ? '#dc2626' : snack.type === 'warning' ? '#d97706' : '#16a34a';
  const icon = snack.type === 'error' ? '✕' : snack.type === 'warning' ? '⚠' : '✓';
  return (
    <div className="super-snackbar animate-fade-in" style={{ background: bg }}>
      <span className="super-snackbar-icon">{icon}</span>
      {snack.message}
    </div>
  );
}

function ConfirmDialog({ confirm, onCancel }) {
  if (!confirm?.open) return null;
  return (
    <div className="super-confirm-overlay">
      <div className="card super-confirm-card animate-scale-in">
        <div className="super-confirm-icon-box">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 className="super-confirm-title">¿Confirmar acción?</h3>
        <p className="super-confirm-msg">{confirm.message}</p>
        <div className="super-confirm-actions">
          <button onClick={onCancel} className="btn-cancel" style={{ padding: '0.65rem 1.4rem', borderRadius: 10 }}>Cancelar</button>
          <button onClick={confirm.onConfirm} className="super-btn-delete-alt">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function EstadoBadge({ id }) {
  const opt = ESTADO_OPTIONS.find(e => e.id === id);
  if (!opt) return <span style={{ color: '#9ca3af' }}>—</span>;
  return <span className="super-badge" style={{ background: opt.bg, color: opt.color, border: `1px solid ${opt.border}` }}>{opt.label}</span>;
}

const TH = ({ children }) => <th className="super-th">{children}</th>;
const TD = ({ children, className = '', style }) => <td className={`super-td ${className}`} style={style}>{children}</td>;

function Field({ label, style, children }) {
  return (
    <div className="input-group" style={{ flex: '1 1 240px', ...style }}>
      <label className="super-field-label">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, width = 660 }) {
  return (
    <div className="super-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="super-modal-card animate-scale-in" style={{ maxWidth: width }}>
        <div className="super-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{title}</h3>
            {subtitle && <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-4)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="super-modal-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="super-modal-body">{children}</div>
      </div>
    </div>
  );
}

function FilterBar({ search, onSearch, sort, onSort, extra }) {
  return (
    <div className="super-filter-bar">
      <div className="super-search-wrapper">
        <svg className="super-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="input-field super-search-input" placeholder="Buscar…" value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      <select value={sort} onChange={e => onSort(e.target.value)} className="super-select-small">
        <option value="newest">Más reciente</option>
        <option value="oldest">Más antiguo</option>
      </select>
      {extra}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, sub, color = 'var(--primary)' }) {
  return (
    <div className="super-stat-card">
      <div className="super-stat-card-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="super-stat-card-body">
        <div className="super-stat-card-value" style={{ color }}>{value}</div>
        <div className="super-stat-card-label">{label}</div>
        {sub && <div className="super-stat-card-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Tenant Form ─── */
function TenantForm({ form, setForm, onSubmit, onDelete, isEdit, saving, allUsers }) {
  const [userSearch, setUserSearch] = useState('');
  const filteredUsers = (allUsers || []).filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return [u.nombre, u.apellido, u.email].join(' ').toLowerCase().includes(q);
  });

  return (
    <form onSubmit={onSubmit} className="super-form">
      <div className="super-form-grid">
        <Field label="NIT"><input className="input-field" required value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} placeholder="900123456-1" /></Field>
        <Field label="Nombre"><input className="input-field" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Clínica Ejemplo" /></Field>
        <Field label="Teléfono"><input className="input-field" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+57 300..." /></Field>
        <Field label="Dirección"><input className="input-field" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle 123..." /></Field>
        <Field label="Descripción" style={{ flex: '1 1 100%' }}><input className="input-field" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción del negocio" /></Field>
        <Field label="Estado">
          <select className="input-field" value={form.idestadoapp} onChange={e => setForm(f => ({ ...f, idestadoapp: parseInt(e.target.value) }))}>
            {ESTADO_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Subdominio" style={{ flex: '1 1 100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input className="input-field" required value={form.subdomain} onChange={e => setForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="mi-clinica" style={{ flex: 1 }} />
            <span style={{ color: 'var(--text-4)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>.novagendas.com</span>
          </div>
        </Field>
        <Field label="¿Deployed en producción?">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', paddingTop: '0.45rem' }}>
            <input type="checkbox" checked={form.deployed} onChange={e => setForm(f => ({ ...f, deployed: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-2)' }}>Activo en producción</span>
          </label>
        </Field>
        <Field label="Usuarios del negocio" style={{ flex: '1 1 100%' }}>
          <div style={{ marginBottom: '0.4rem', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input-field" style={{ paddingLeft: '1.8rem', fontSize: '0.82rem', height: '2rem' }} placeholder="Buscar usuario…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
            {(!allUsers || allUsers.length === 0) && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-4)' }}>Sin usuarios registrados</div>
            )}
            {filteredUsers.length === 0 && allUsers && allUsers.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-4)' }}>Sin resultados para "{userSearch}"</div>
            )}
            {filteredUsers.map(u => {
              const linked = form.usuarios.find(x => x.idusuario === u.idusuario);
              return (
                <div key={u.idusuario} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 1rem', borderBottom: '1px solid var(--border)', background: linked ? 'var(--primary-light)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={!!linked}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm(f => ({ ...f, usuarios: [...f.usuarios, { idusuario: u.idusuario, es_principal: false }] }));
                      } else {
                        setForm(f => ({ ...f, usuarios: f.usuarios.filter(x => x.idusuario !== u.idusuario) }));
                      }
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{u.nombre} {u.apellido}</div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-4)' }}>{u.email} · ID {u.idusuario}</div>
                  </div>
                  {linked && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: linked.es_principal ? '#7c3aed' : 'var(--text-4)', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={!!linked.es_principal}
                        onChange={e => setForm(f => ({ ...f, usuarios: f.usuarios.map(x => x.idusuario === u.idusuario ? { ...x, es_principal: e.target.checked } : x) }))}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#7c3aed' }}
                      />
                      Dueño ★
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {form.usuarios.length > 0 && (
            <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-4)' }}>
              {form.usuarios.length} usuario{form.usuarios.length !== 1 ? 's' : ''} seleccionado{form.usuarios.length !== 1 ? 's' : ''}
              {!form.usuarios.some(u => u.es_principal) && <span style={{ color: '#d97706', marginLeft: 8 }}>⚠ Marca uno como Dueño para asignar el admin del negocio</span>}
            </div>
          )}
        </Field>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 10 }}>
          {saving ? <><span className="spinner-mini" style={{ marginRight: 8 }} />Guardando...</> : isEdit ? 'Guardar Cambios' : 'Crear Negocio'}
        </button>
        {isEdit && <button type="button" onClick={onDelete} className="super-btn-delete-alt">🗑️ Eliminar Negocio</button>}
      </div>
    </form>
  );
}

/* ─── User Form ─── */
function UserForm({ form, setForm, onSubmit, onDelete, isEdit, saving, tenants }) {
  const [showPass, setShowPass] = useState(false);
  const [negSearch, setNegSearch] = useState('');
  const filteredTenants = (tenants || []).filter(t => {
    if (!negSearch) return true;
    const q = negSearch.toLowerCase();
    return [t.nombre, t.dominio].join(' ').toLowerCase().includes(q);
  });

  return (
    <form onSubmit={onSubmit} className="super-form">
      <div className="super-form-grid">
        <Field label="Nombre"><input className="input-field" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Karen" /></Field>
        <Field label="Apellido"><input className="input-field" required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Useche" /></Field>
        <Field label="Cédula"><input className="input-field" required value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} placeholder="1010000001" /></Field>
        <Field label="Email"><input type="email" className="input-field" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@tienda.com" /></Field>
        <Field label={isEdit ? 'Nueva Contraseña (vacío = no cambiar)' : 'Contraseña *'}>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} className="input-field" required={!isEdit} value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))} placeholder="••••••" style={{ paddingRight: '2.5rem' }} />
            <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '1rem' }}>{showPass ? '🙈' : '👁️'}</button>
          </div>
        </Field>
        <Field label="Teléfono"><input className="input-field" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+57 300..." /></Field>
        <Field label="Profesión"><input className="input-field" value={form.profesion} onChange={e => setForm(f => ({ ...f, profesion: e.target.value }))} placeholder="Médico estético..." /></Field>
        <Field label="Rol">
          <select className="input-field" value={form.idrol} onChange={e => setForm(f => ({ ...f, idrol: parseInt(e.target.value) }))}>
            {ROL_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className="input-field" value={form.idestado} onChange={e => setForm(f => ({ ...f, idestado: parseInt(e.target.value) }))}>
            <option value={1}>Activo</option>
            <option value={2}>Inactivo</option>
          </select>
        </Field>
        <Field label="Negocios asociados" style={{ flex: '1 1 100%' }}>
          <div style={{ marginBottom: '0.4rem', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input-field" style={{ paddingLeft: '1.8rem', fontSize: '0.82rem', height: '2rem' }} placeholder="Buscar negocio…" value={negSearch} onChange={e => setNegSearch(e.target.value)} />
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {tenants && tenants.length === 0 && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-4)' }}>Sin negocios registrados</div>
            )}
            {filteredTenants.length === 0 && tenants && tenants.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-4)' }}>Sin resultados para "{negSearch}"</div>
            )}
            {filteredTenants.map(t => {
              const linked = form.negocios.find(n => n.idnegocios === t.idnegocios);
              return (
                <div key={t.idnegocios} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 1rem', borderBottom: '1px solid var(--border)', background: linked ? 'var(--primary-light)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={!!linked}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm(f => ({ ...f, negocios: [...f.negocios, { idnegocios: t.idnegocios, es_principal: false }] }));
                      } else {
                        setForm(f => ({ ...f, negocios: f.negocios.filter(n => n.idnegocios !== t.idnegocios) }));
                      }
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{t.nombre}</div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-4)' }}>{t.dominio} · ID {t.idnegocios}</div>
                  </div>
                  {linked && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: linked.es_principal ? '#7c3aed' : 'var(--text-4)', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={!!linked.es_principal}
                        onChange={e => setForm(f => ({ ...f, negocios: f.negocios.map(n => n.idnegocios === t.idnegocios ? { ...n, es_principal: e.target.checked } : n) }))}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#7c3aed' }}
                      />
                      Dueño ★
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {form.negocios.length > 0 && (
            <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-4)' }}>
              {form.negocios.length} negocio{form.negocios.length !== 1 ? 's' : ''} seleccionado{form.negocios.length !== 1 ? 's' : ''}
              {!form.negocios.some(n => n.es_principal) && <span style={{ color: '#d97706', marginLeft: 8 }}>⚠ Marca uno como Dueño para el acceso principal</span>}
            </div>
          )}
        </Field>
      </div>
      {!isEdit && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--primary-light)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
          ℹ️ Al crear el usuario también se registrará en Supabase Auth para recuperación de contraseña por correo.
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 10 }}>
          {saving ? <><span className="spinner-mini" style={{ marginRight: 8 }} />Guardando...</> : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
        {isEdit && <button type="button" onClick={onDelete} className="super-btn-delete-alt">🗑️ Eliminar Usuario</button>}
      </div>
    </form>
  );
}

/* ══════════════════════════ MAIN ══════════════════════════════════════ */
export default function SuperAdminPortal() {
  const [adminLogged, setAdminLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('negocios');
  const [copied, setCopied] = useState(null);

  const [snack, setSnack] = useState(null);
  const showSnack = useCallback((message, type = 'success') => {
    setSnack({ message, type });
    setTimeout(() => setSnack(null), 3500);
  }, []);

  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });
  const askConfirm = (message, onConfirm) => setConfirm({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirm({ open: false, message: '', onConfirm: null });

  /* ── Data state ── */
  const [tenants, setTenants] = useState([]);
  const [tenantLoad, setTenantLoad] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantSort, setTenantSort] = useState('newest');
  const [tenantModal, setTenantModal] = useState(null);
  const [savingT, setSavingT] = useState(false);
  const blankT = { nit: '', name: '', subdomain: '', descripcion: '', direccion: '', telefono: '', deployed: false, idestadoapp: 1, usuarios: [] };
  const [tForm, setTForm] = useState(blankT);

  const [users, setUsers] = useState([]);
  const [userLoad, setUserLoad] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState('newest');
  const [userRolFilter, setUserRolFilter] = useState('all');
  const [userModal, setUserModal] = useState(null);
  const [savingU, setSavingU] = useState(false);
  const blankU = { nombre: '', apellido: '', email: '', cedula: '', contrasena: '', telefono: '', profesion: '', idestado: 1, idrol: 2, negocios: [] };
  const [uForm, setUForm] = useState(blankU);

  /* Ubicaciones */
  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicSearch, setUbicSearch] = useState('');
  const [ubicLoad, setUbicLoad] = useState(false);
  const [ubicModal, setUbicModal] = useState(null);
  const [savingLoc, setSavingLoc] = useState(false);
  const blankLoc = { nombre: '', idnegocios: '', direccion: '' };
  const [locForm, setLocForm] = useState(blankLoc);

  /* Monitoring */
  const [monitorLoad, setMonitorLoad] = useState(false);
  const [monitorData, setMonitorData] = useState({ citas: [], clientes: [], citasHoy: [] });

  /* Login */
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  /* ── Fetchers ── */
  const fetchTenants = useCallback(async () => {
    setTenantLoad(true);
    const { data } = await supabase.from('negocios').select('*').order('idnegocios');
    setTenants(data || []);
    setTenantLoad(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUserLoad(true);
    const [{ data: userData }, { data: rolData }, { data: negocioData }] = await Promise.all([
      supabase.from('usuario').select('*').is('deleted_at', null).order('idusuario'),
      supabase.from('rolpermisos').select('idusuario, idrol'),
      supabase.from('negociousuario').select('idusuario, idnegocios, es_principal'),
    ]);
    const rolMap = {};
    (rolData || []).forEach(r => { if (!rolMap[r.idusuario]) rolMap[r.idusuario] = r.idrol; });
    const negMap = {};
    (negocioData || []).forEach(n => {
      if (!negMap[n.idusuario]) negMap[n.idusuario] = [];
      negMap[n.idusuario].push({ idnegocios: n.idnegocios, es_principal: n.es_principal });
    });
    setUsers((userData || []).map(u => ({ ...u, _idrol: rolMap[u.idusuario] || null, _negocios: negMap[u.idusuario] || [] })));
    setUserLoad(false);
  }, []);

  const fetchUbicaciones = useCallback(async () => {
    setUbicLoad(true);
    const { data } = await supabase.from('ubicacion').select('*').is('deleted_at', null).order('idubicacion');
    setUbicaciones(data || []);
    setUbicLoad(false);
  }, []);

  const fetchMonitor = useCallback(async () => {
    setMonitorLoad(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [{ data: allCitas }, { data: allClientes }] = await Promise.all([
      supabase.from('cita').select('idcita, idnegocios, fechahorainicio, idestadocita').is('deleted_at', null),
      supabase.from('cliente').select('idcliente, idnegocios').is('deleted_at', null),
    ]);

    const todayStr = today.toISOString();
    const tomorrowStr = tomorrow.toISOString();
    const citasHoy = (allCitas || []).filter(c => c.fechahorainicio >= todayStr && c.fechahorainicio < tomorrowStr);

    setMonitorData({ citas: allCitas || [], clientes: allClientes || [], citasHoy });
    setMonitorLoad(false);
  }, []);

  useEffect(() => {
    if (adminLogged) {
      const initData = async () => {
        await Promise.all([
          fetchTenants(),
          fetchUsers(),
          fetchUbicaciones()
        ]);
      };
      initData();
    }
  }, [adminLogged, fetchTenants, fetchUsers, fetchUbicaciones]);

  useEffect(() => {
    if (adminLogged && tab === 'monitoreo') {
      const loadMonitor = async () => {
        await fetchMonitor();
      };
      loadMonitor();
    }
  }, [adminLogged, tab, fetchMonitor]);

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setIsAuthLoading(false);
    if (error) {
      setLoginError(error.message.includes('Email not confirmed')
        ? 'Correo no confirmado. Desactiva "Confirm Email" en Supabase Auth → Settings.'
        : error.message);
    } else if (data.session) {
      setCurrentUser(data.user);
      setAdminLogged(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminLogged(false);
    setCurrentUser(null);
  };

  const handleRegisterSuper = async (e) => {
    e.preventDefault();
    if (masterPass !== 'super123') { setLoginError('Contraseña maestra incorrecta.'); return; }
    setIsAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { is_super_admin: true } } });
    if (!error) {
      await supabase.from('usuario').insert([{ nombre: 'Nuevo', apellido: 'SuperAdmin', email, password: pass, issuperadmin: true, idestado: 1 }]);
      await insertLog({ accion: 'CREATE', entidad: 'SuperAdmin', descripcion: `Nueva cuenta SuperAdmin: ${email}`, idUsuario: data.user?.id, idNegocios: null });
      showSnack('Cuenta SuperAdmin creada. Confirma el email si es necesario.');
      setIsRegistering(false);
    } else {
      setLoginError('Error al crear SuperAdmin: ' + error.message);
    }
    setIsAuthLoading(false);
  };

  /* ── Negocios CRUD ── */
  const openAddTenant = () => { setTForm(blankT); setTenantModal('add'); };
  const openEditTenant = t => {
    const tenantUsuarios = users
      .filter(u => u._negocios?.some(n => n.idnegocios === t.idnegocios))
      .map(u => ({ idusuario: u.idusuario, es_principal: u._negocios.find(n => n.idnegocios === t.idnegocios)?.es_principal || false }));
    setTForm({ nit: t.nit || '', name: t.nombre || '', subdomain: t.dominio || '', descripcion: t.descripcion || '', direccion: t.direccion || '', telefono: t.telefono || '', deployed: !!t.deployed, idestadoapp: t.idestadoapp || 1, usuarios: tenantUsuarios });
    setTenantModal(t);
  };

  const handleSaveTenant = async e => {
    e.preventDefault();
    setSavingT(true);
    const payload = { nit: tForm.nit, nombre: tForm.name, dominio: tForm.subdomain, descripcion: tForm.descripcion, direccion: tForm.direccion, telefono: tForm.telefono, deployed: tForm.deployed, idestadoapp: tForm.idestadoapp };
    const isAdd = tenantModal === 'add';
    const { data: savedData, error } = isAdd
      ? await supabase.from('negocios').insert([payload]).select('idnegocios').maybeSingle()
      : await supabase.from('negocios').update(payload).eq('idnegocios', tenantModal.idnegocios).select('idnegocios').maybeSingle();
    setSavingT(false);
    if (error) { showSnack('Error: ' + error.message, 'error'); return; }
    const negocioId = savedData?.idnegocios || tenantModal?.idnegocios;
    if (negocioId) {
      await supabase.from('negociousuario').delete().eq('idnegocios', negocioId);
      if (tForm.usuarios.length > 0) {
        await supabase.from('negociousuario').insert(
          tForm.usuarios.map(u => ({ idusuario: u.idusuario, idnegocios: negocioId, es_principal: u.es_principal }))
        );
      }
    }
    await insertLog({ accion: isAdd ? 'CREATE' : 'UPDATE', entidad: 'Negocio', descripcion: `${isAdd ? 'Creación' : 'Actualización'} del negocio '${tForm.name}'`, idUsuario: currentUser?.id, idNegocios: negocioId || null });
    showSnack(isAdd ? `Negocio "${tForm.name}" creado.` : `Negocio "${tForm.name}" actualizado.`);
    setTenantModal(null);
    fetchTenants();
    fetchUsers();
  };

  const deleteTenant = () => {
    askConfirm(`¿Eliminar el negocio "${tenantModal.nombre}" permanentemente?`, async () => {
      closeConfirm();
      const { error } = await supabase.from('negocios').delete().eq('idnegocios', tenantModal.idnegocios);
      if (error) { showSnack('Error al eliminar: ' + error.message, 'error'); return; }
      showSnack(`Negocio "${tenantModal.nombre}" eliminado.`, 'warning');
      setTenantModal(null);
      fetchTenants();
    });
  };

  const toggleDeployed = async (id, current) => {
    await supabase.from('negocios').update({ deployed: !current }).eq('idnegocios', id);
    fetchTenants();
  };

  const updateStatus = async (id, val) => {
    await supabase.from('negocios').update({ idestadoapp: val }).eq('idnegocios', id);
    fetchTenants();
  };

  /* ── Usuarios CRUD ── */
  const openAddUser = () => { setUForm(blankU); setUserModal('add'); };
  const openEditUser = u => {
    setUForm({ nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '', cedula: u.cedula || '', contrasena: '', telefono: u.telefono || '', profesion: u.profesion || '', idestado: u.idestado || 1, idrol: u._idrol || 1, negocios: u._negocios || [] });
    setUserModal(u);
  };

  const handleSaveUser = async e => {
    e.preventDefault();
    setSavingU(true);
    const isAdd = userModal === 'add';
    const principalNeg = uForm.negocios.find(n => n.es_principal) || uForm.negocios[0];
    const idnegociosPrincipal = principalNeg?.idnegocios || null;
    const payload = { nombre: uForm.nombre, apellido: uForm.apellido, email: uForm.email, cedula: uForm.cedula, telefono: uForm.telefono, profesion: uForm.profesion, idestado: uForm.idestado };
    if (uForm.contrasena) payload['password'] = uForm.contrasena;

    let savedId = isAdd ? null : userModal.idusuario;

    if (isAdd) {
      const { data: inserted, error } = await supabase
        .from('usuario')
        .insert([{ ...payload, password: uForm.contrasena }])
        .select('idusuario')
        .single();
      if (error) { showSnack('Error: ' + error.message, 'error'); setSavingU(false); return; }
      savedId = inserted?.idusuario ?? null;
      if (!savedId) {
        const { data: found } = await supabase.from('usuario').select('idusuario').eq('email', uForm.email).maybeSingle();
        savedId = found?.idusuario ?? null;
      }
    } else {
      const { error } = await supabase.from('usuario').update(payload).eq('idusuario', userModal.idusuario);
      if (error) { showSnack('Error: ' + error.message, 'error'); setSavingU(false); return; }
    }

    if (savedId && uForm.idrol) {
      const { data: updatedRows } = await supabase.from('rolpermisos').update({ idrol: uForm.idrol }).eq('idusuario', savedId).select();
      if (!updatedRows || updatedRows.length === 0) {
        await supabase.from('rolpermisos').insert([{ idusuario: savedId, idrol: uForm.idrol, idpermiso: 1 }]);
      }
    }

    if (savedId) {
      await supabase.from('negociousuario').delete().eq('idusuario', savedId);
      if (uForm.negocios.length > 0) {
        await supabase.from('negociousuario').insert(
          uForm.negocios.map(n => ({ idusuario: savedId, idnegocios: n.idnegocios, es_principal: n.es_principal, idrol: uForm.idrol }))
        );
      }
    }

    if (isAdd && uForm.email && uForm.contrasena) {
      const { error: authErr } = await authHelper.auth.signUp({ email: uForm.email, password: uForm.contrasena, options: { data: { nombre: uForm.nombre, apellido: uForm.apellido, idusuario: savedId, idnegocios: idnegociosPrincipal } } });
      if (authErr && !authErr.message?.toLowerCase().includes('already registered')) console.warn('auth.users sync:', authErr.message);
    }

    await insertLog({ accion: isAdd ? 'CREATE' : 'UPDATE', entidad: 'Usuario', descripcion: `${isAdd ? 'Creación' : 'Edición'} de usuario: ${uForm.nombre} ${uForm.apellido} (${uForm.email})`, idUsuario: currentUser?.id, idNegocios: idnegociosPrincipal });
    setSavingU(false);
    showSnack(isAdd ? `Usuario "${uForm.nombre} ${uForm.apellido}" creado.` : `Usuario "${uForm.nombre} ${uForm.apellido}" actualizado.`);
    setUserModal(null);
    fetchUsers();
  };

  const deleteUser = (u) => {
    const target = u || userModal;
    if (!target) return;
    askConfirm(`¿Eliminar al usuario "${target.nombre} ${target.apellido}" (${target.email})?`, async () => {
      closeConfirm();
      await supabase.from('negociousuario').delete().eq('idusuario', target.idusuario);
      await supabase.from('rolpermisos').delete().eq('idusuario', target.idusuario);
      const { error } = await supabase.from('usuario').delete().eq('idusuario', target.idusuario);
      if (error) { showSnack('Error eliminando: ' + error.message, 'error'); return; }
      await insertLog({ accion: 'DELETE', entidad: 'Usuario', descripcion: `Se eliminó al usuario: ${target.nombre} ${target.apellido} (${target.email})`, idUsuario: currentUser?.id, idNegocios: target.idnegocios });
      showSnack(`Usuario "${target.nombre} ${target.apellido}" eliminado.`, 'warning');
      setUserModal(null);
      fetchUsers();
    });
  };

  /* ── Ubicaciones CRUD ── */
  const openAddUbic = () => { setLocForm(blankLoc); setUbicModal('add'); };
  const openEditUbic = u => {
    setLocForm({ nombre: u.nombre || '', idnegocios: u.idnegocios || '', direccion: u.direccion || '' });
    setUbicModal(u);
  };

  const handleSaveUbic = async e => {
    e.preventDefault();
    if (!locForm.idnegocios) { showSnack('Selecciona un negocio', 'error'); return; }
    setSavingLoc(true);
    const payload = { nombre: locForm.nombre, idnegocios: parseInt(locForm.idnegocios), direccion: locForm.direccion || null };
    const isAdd = ubicModal === 'add';
    const { error } = isAdd
      ? await supabase.from('ubicacion').insert([payload])
      : await supabase.from('ubicacion').update(payload).eq('idubicacion', ubicModal.idubicacion);
    setSavingLoc(false);
    if (error) { showSnack('Error: ' + error.message, 'error'); return; }
    showSnack(isAdd ? `Sede "${locForm.nombre}" creada.` : `Sede "${locForm.nombre}" actualizada.`);
    setUbicModal(null);
    fetchUbicaciones();
  };

  const deleteUbic = (u) => {
    askConfirm(`¿Eliminar la sede "${u.nombre}"?`, async () => {
      closeConfirm();
      const { error } = await supabase.from('ubicacion').update({ deleted_at: new Date().toISOString() }).eq('idubicacion', u.idubicacion);
      if (error) { showSnack('Error: ' + error.message, 'error'); return; }
      showSnack(`Sede "${u.nombre}" eliminada.`, 'warning');
      fetchUbicaciones();
    });
  };

  /* ── Helpers ── */
  const copyId = (id, e) => {
    e?.stopPropagation?.();
    navigator.clipboard.writeText(String(id));
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  // Acceso seguro: usamos una función extractor con switch en lugar de acceso dinámico por corchetes
  const CAMPOS_ORDEN_PERMITIDOS = ['idnegocios', 'idusuario', 'idubicacion'];
  const getFieldValue = (obj, key) => {
    if (key === 'idnegocios') return obj.idnegocios || 0;
    if (key === 'idusuario')  return obj.idusuario  || 0;
    if (key === 'idubicacion') return obj.idubicacion || 0;
    return 0;
  };
  const sortFn = (a, b, key, dir) => {
    if (!CAMPOS_ORDEN_PERMITIDOS.includes(key)) return 0;
    return dir === 'newest' ? getFieldValue(b, key) - getFieldValue(a, key) : getFieldValue(a, key) - getFieldValue(b, key);
  };
  const tenantName = id => tenants.find(t => t.idnegocios === id)?.nombre || null;

  const filteredTenants = tenants
    .filter(t => !tenantSearch || [t.nombre, t.dominio, t.nit].join(' ').toLowerCase().includes(tenantSearch.toLowerCase()))
    .sort((a, b) => sortFn(a, b, 'idnegocios', tenantSort));

  const filteredUsers = users
    .filter(u => {
      const q = userSearch.toLowerCase();
      const matchSearch = !q || [u.nombre, u.apellido, u.email, u.cedula].join(' ').toLowerCase().includes(q);
      const matchRol = userRolFilter === 'all' || String(u._idrol) === userRolFilter;
      return matchSearch && matchRol;
    })
    .sort((a, b) => sortFn(a, b, 'idusuario', userSort));

  const filteredUbic = ubicaciones
    .filter(u => !ubicSearch || [u.nombre, tenantName(u.idnegocios) || ''].join(' ').toLowerCase().includes(ubicSearch.toLowerCase()));

  const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
  const hostHost = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
  const hostParts = hostHost.split('.');
  const baseDomain = (!isLocal && hostParts.length > 2) ? hostParts.slice(1).join('.') : (isLocal && hostParts.length > 1 ? hostParts.slice(1).join('.') : hostHost);
  const protocol = isLocal ? 'http:' : 'https:';
  const port = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');

  /* ── Global stats ── */
  const activeTenantsCount = tenants.filter(t => t.idestadoapp === 1).length;
  const deployedCount = tenants.filter(t => t.deployed).length;
  const activeUsersCount = users.filter(u => u.idestado === 1).length;
  const ubicacionesCount = ubicaciones.length;

  /* ─── Current tab count badge ─── */
  const tabCount = { negocios: filteredTenants.length, usuarios: filteredUsers.length, ubicaciones: filteredUbic.length, monitoreo: tenants.length };

  /* ═══════════════ LOGIN SCREEN ═══════════════ */
  if (!adminLogged) return (
    <div className="super-login-wrap">
      <ParticleBackground />
      <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />
      <div className="card super-login-card animate-fade-up">
        <div className="super-login-header">
          <div className="super-login-logo">
            <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/logodark.jpeg' : '/logoclaro.jpeg'} alt="Logo" onError={e => e.target.style.display = 'none'} />
          </div>
          <h2 style={{ margin: '0 0 0.25rem', fontWeight: 800 }}>{isRegistering ? 'Crear Super Admin' : 'Portal Super Admin'}</h2>
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-3)' }}>Novagendas · Solo personal autorizado</p>
        </div>

        {loginError && (
          <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '1rem', padding: '0.7rem 0.9rem', fontSize: '0.83rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {loginError}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegisterSuper : handleLogin} className="super-login-form">
          <input type="email" className="input-field" placeholder="Correo electrónico" value={email} onChange={e => { setEmail(e.target.value); setLoginError(''); }} autoFocus />
          <input type="password" className="input-field" placeholder="Contraseña" value={pass} onChange={e => { setPass(e.target.value); setLoginError(''); }} />
          {isRegistering && (
            <input type="password" className="input-field" placeholder="Contraseña maestra de confirmación" value={masterPass} onChange={e => setMasterPass(e.target.value)} style={{ border: '1px solid var(--accent)' }} />
          )}
          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '0.9rem', marginTop: '0.25rem', borderRadius: 12 }} disabled={isAuthLoading}>
            {isAuthLoading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner-mini" />Procesando...</span> : isRegistering ? 'Registrar SuperAdmin' : 'Ingresar'}
          </button>
        </form>

        {isRegistering && (
          <div className="super-login-footer">
            <button type="button" onClick={() => { setIsRegistering(false); setLoginError(''); }} className="super-text-link">← Volver al Login</button>
          </div>
        )}
      </div>
    </div>
  );

  /* ═══════════════ MAIN PORTAL ═══════════════ */
  return (
    <div className="super-portal-layout">

      {/* ── Sticky header ── */}
      <div className="super-header">
        <div className="super-header-left">
          <div className="super-brand">
            <div className="super-brand-logo">
              <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/logodark.jpeg' : '/logoclaro.jpeg'} alt="Logo" onError={e => e.target.style.display = 'none'} />
            </div>
            <div>
              <div className="super-brand-name">Novagendas</div>
              <div className="super-brand-sub">Super Admin</div>
            </div>
          </div>

          <div className="super-nav-tabs">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`super-nav-btn ${tab === t.id ? 'super-nav-btn--active' : ''}`}>
                <span>{t.icon}</span>
                {t.label}
                <span className="super-nav-count">{tabCount[t.id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="super-header-right">
          {currentUser && <span className="super-user-email">{currentUser.email}</span>}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: 'var(--text-3)', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Salir
          </button>
          <ThemeToggle style={{ position: 'relative' }} />
          {tab !== 'monitoreo' && (
            <button
              className="btn btn-primary"
              style={{ borderRadius: 10, padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
              onClick={tab === 'negocios' ? openAddTenant : tab === 'usuarios' ? openAddUser : tab === 'ubicaciones' ? openAddUbic : null}
            >
              + {tab === 'negocios' ? 'Nuevo Negocio' : tab === 'usuarios' ? 'Nuevo Usuario' : 'Nueva Sede'}
            </button>
          )}
          {tab === 'monitoreo' && (
            <button className="super-refresh-btn" style={{ fontSize: '1rem', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.8rem' }} onClick={fetchMonitor} title="Actualizar datos">
              ↻ Actualizar
            </button>
          )}
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      <div className="super-stats-bar">
        {[
          { label: 'Activos', value: activeTenantsCount, color: '#16a34a' },
          { label: 'En producción', value: deployedCount, color: '#0891b2' },
          { label: 'Total negocios', value: tenants.length, color: 'var(--text-2)' },
          { label: 'Usuarios activos', value: activeUsersCount, color: '#7c3aed' },
          { label: 'Total usuarios', value: users.length, color: 'var(--text-2)' },
          { label: 'Sedes registradas', value: ubicacionesCount, color: '#ea580c' },
        ].map(s => (
          <div key={s.label} className="super-stat-item">
            <span className="super-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="super-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="super-content-container">

        {/* ══════════ NEGOCIOS TAB ══════════ */}
        {tab === 'negocios' && (
          <div className="card super-main-card animate-fade-in">
            <div className="super-card-header">
              <h3 className="super-card-title">Negocios registrados <span className="super-card-subtitle">({filteredTenants.length})</span></h3>
              <button onClick={fetchTenants} className="super-refresh-btn" title="Actualizar">↻</button>
            </div>
            <FilterBar search={tenantSearch} onSearch={setTenantSearch} sort={tenantSort} onSort={setTenantSort} />
            <div className="super-table-wrapper">
              <table className="super-table">
                <thead><tr>{['ID', 'Subdominio', 'Nombre / NIT', 'Sedes', 'Admin', 'Deployed', 'Estado', 'Acciones'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {tenantLoad ? (
                    <tr><td colSpan="8" className="super-empty-cell"><span className="spinner-mini" style={{ width: 18, height: 18 }} /> Cargando...</td></tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr><td colSpan="8" className="super-empty-cell">{tenantSearch ? 'Sin resultados.' : 'Sin negocios registrados.'}</td></tr>
                  ) : filteredTenants.map(t => {
                    const tenantUbic = ubicaciones.filter(u => u.idnegocios === t.idnegocios);
                    const tenantUsers = users.filter(u => u._negocios?.some(n => n.idnegocios === t.idnegocios) && u.idestado === 1);
                    return (
                      <tr key={t.idnegocios} className="super-tr-hover">
                        <TD>
                          <button onClick={e => copyId(t.idnegocios, e)} className={`super-btn-copy ${copied === t.idnegocios ? 'super-btn-copy--success' : ''}`}>
                            {copied === t.idnegocios ? '✓' : '⎘'} #{t.idnegocios}
                          </button>
                        </TD>
                        <TD><span className="super-subdomain-tag">{t.dominio}</span></TD>
                        <TD>
                          <div style={{ fontWeight: 600 }}>{t.nombre}</div>
                          {t.nit && <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: 2 }}>NIT: {t.nit}</div>}
                        </TD>
                        <TD>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {tenantUbic.length > 0
                              ? tenantUbic.map(u => <span key={u.idubicacion} className="super-loc-chip">{u.nombre}</span>)
                              : <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>Sin sedes</span>
                            }
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', marginTop: 3 }}>{tenantUsers.length} usuario{tenantUsers.length !== 1 ? 's' : ''} activo{tenantUsers.length !== 1 ? 's' : ''}</div>
                        </TD>
                        <TD style={{ fontSize: '0.8rem' }}>
                          {tenantUsers.length > 0
                            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {tenantUsers.map(u => {
                                  const esDueno = u._negocios?.find(n => n.idnegocios === t.idnegocios)?.es_principal;
                                  return (
                                    <div key={u.idusuario} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ color: 'var(--text-2)', fontWeight: esDueno ? 700 : 400 }}>{u.nombre} {u.apellido}</span>
                                      {esDueno && <span style={{ fontSize: '0.6rem', background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>Dueño</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            : <span style={{ color: '#9ca3af' }}>—</span>}
                        </TD>
                        <TD style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={!!t.deployed} onChange={() => toggleDeployed(t.idnegocios, t.deployed)}
                            style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--primary)' }} />
                        </TD>
                        <TD>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select value={t.idestadoapp || 1} onChange={e => updateStatus(t.idnegocios, parseInt(e.target.value))}
                              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.82rem', color: 'var(--text)', marginBottom: 2 }}>
                              {ESTADO_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                            <EstadoBadge id={t.idestadoapp} />
                          </div>
                        </TD>
                        <TD>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => openEditTenant(t)} className="super-action-btn super-action-btn--edit">✏️ Editar</button>
                            <a href={`${protocol}//${t.dominio}.${baseDomain}${port}`} target="_blank" rel="noreferrer" className="super-action-btn super-action-btn--link">Abrir ↗</a>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ USUARIOS TAB ══════════ */}
        {tab === 'usuarios' && (
          <div className="card super-main-card animate-fade-in">
            <div className="super-card-header">
              <h3 className="super-card-title">Usuarios del sistema <span className="super-card-subtitle">({filteredUsers.length})</span></h3>
              <button onClick={fetchUsers} className="super-refresh-btn">↻</button>
            </div>
            <FilterBar
              search={userSearch} onSearch={setUserSearch}
              sort={userSort} onSort={setUserSort}
              extra={
                <select value={userRolFilter} onChange={e => setUserRolFilter(e.target.value)} className="super-select-small">
                  <option value="all">Todos los roles</option>
                  {ROL_OPTIONS.map(r => <option key={r.id} value={String(r.id)}>{r.label}</option>)}
                </select>
              }
            />
            <div className="super-table-wrapper">
              <table className="super-table">
                <thead><tr>{['ID', 'Nombre', 'Email', 'Negocio', 'Rol', 'Estado', 'Acciones'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {userLoad ? (
                    <tr><td colSpan="7" className="super-empty-cell"><span className="spinner-mini" style={{ width: 18, height: 18 }} /> Cargando...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="7" className="super-empty-cell">{userSearch ? 'Sin resultados.' : 'Sin usuarios.'}</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.idusuario} className="super-tr-hover">
                      <TD>
                        <button onClick={e => copyId(u.idusuario, e)} className={`super-btn-copy ${copied === u.idusuario ? 'super-btn-copy--success' : ''}`}>
                          {copied === u.idusuario ? '✓' : '⎘'} #{u.idusuario}
                        </button>
                      </TD>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{u.nombre} {u.apellido}</div>
                        {u.cedula && <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{u.cedula}</div>}
                        {u.profesion && <div style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>{u.profesion}</div>}
                      </TD>
                      <TD style={{ color: 'var(--text-2)', fontSize: '0.83rem' }}>{u.email}</TD>
                      <TD>
                        {u._negocios && u._negocios.length > 0
                          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {u._negocios.map(n => (
                                <div key={n.idnegocios} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{tenantName(n.idnegocios) || `ID: ${n.idnegocios}`}</span>
                                  {n.es_principal && <span style={{ fontSize: '0.62rem', background: '#ede9fe', color: '#7c3aed', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>Dueño</span>}
                                </div>
                              ))}
                            </div>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </TD>
                      <TD>
                        {(() => {
                          const rolColor = u._idrol === 1 ? '#7c3aed' : u._idrol === 2 ? '#0891b2' : '#16a34a';
                          const rolBg    = u._idrol === 1 ? '#ede9fe'  : u._idrol === 2 ? '#e0f2fe'  : '#dcfce7';
                          return (
                            <select value={u._idrol || ''} onChange={async e => {
                              const newRol = parseInt(e.target.value);
                              const { data: updatedRows } = await supabase.from('rolpermisos').update({ idrol: newRol }).eq('idusuario', u.idusuario).select();
                              if (!updatedRows || updatedRows.length === 0) await supabase.from('rolpermisos').insert([{ idusuario: u.idusuario, idrol: newRol, idpermiso: 1 }]);
                              showSnack(`Rol de ${u.nombre} actualizado.`);
                              fetchUsers();
                            }} style={{ background: rolBg, color: rolColor, border: `1px solid ${rolColor}40`, borderRadius: 99, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
                              <option value="">Sin rol</option>
                              {ROL_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                          );
                        })()}
                      </TD>
                      <TD>
                        <span style={{ background: u.idestado === 1 ? '#dcfce7' : '#fee2e2', color: u.idestado === 1 ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700 }}>
                          {u.idestado === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </TD>
                      <TD>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => openEditUser(u)} className="super-action-btn super-action-btn--edit">✏️</button>
                          <button onClick={() => deleteUser(u)} className="super-action-btn super-action-btn--del">🗑️</button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ UBICACIONES TAB ══════════ */}
        {tab === 'ubicaciones' && (
          <div className="card super-main-card animate-fade-in">
            <div className="super-card-header">
              <h3 className="super-card-title">Sedes y Ubicaciones <span className="super-card-subtitle">({filteredUbic.length})</span></h3>
              <button onClick={fetchUbicaciones} className="super-refresh-btn">↻</button>
            </div>
            <FilterBar search={ubicSearch} onSearch={setUbicSearch} sort="newest" onSort={() => {}} />
            <div className="super-table-wrapper">
              <table className="super-table">
                <thead><tr>{['ID', 'Nombre de Sede', 'Dirección', 'Negocio', 'Acciones'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {ubicLoad ? (
                    <tr><td colSpan="5" className="super-empty-cell"><span className="spinner-mini" style={{ width: 18, height: 18 }} /> Cargando...</td></tr>
                  ) : filteredUbic.length === 0 ? (
                    <tr><td colSpan="5" className="super-empty-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem' }}>
                        <span style={{ fontSize: '2rem' }}>📍</span>
                        <strong>{ubicSearch ? 'Sin resultados.' : 'Sin sedes registradas.'}</strong>
                        {!ubicSearch && <p style={{ color: 'var(--text-4)', margin: 0, fontSize: '0.83rem' }}>Agrega sedes para que los negocios puedan tener múltiples ubicaciones.</p>}
                      </div>
                    </td></tr>
                  ) : filteredUbic.map(u => (
                    <tr key={u.idubicacion} className="super-tr-hover">
                      <TD>
                        <button onClick={e => copyId(u.idubicacion, e)} className={`super-btn-copy ${copied === u.idubicacion ? 'super-btn-copy--success' : ''}`}>
                          {copied === u.idubicacion ? '✓' : '⎘'} #{u.idubicacion}
                        </button>
                      </TD>
                      <TD>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1rem' }}>📍</span>
                          {u.nombre}
                        </div>
                      </TD>
                      <TD style={{ color: 'var(--text-3)', fontSize: '0.83rem' }}>{u.direccion || <span style={{ color: '#9ca3af' }}>—</span>}</TD>
                      <TD>
                        {u.idnegocios
                          ? <div>
                              <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{tenantName(u.idnegocios) || `ID: ${u.idnegocios}`}</div>
                              <div style={{ fontSize: '0.69rem', color: 'var(--text-4)' }}>#{u.idnegocios}</div>
                            </div>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </TD>
                      <TD>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => openEditUbic(u)} className="super-action-btn super-action-btn--edit">✏️ Editar</button>
                          <button onClick={() => deleteUbic(u)} className="super-action-btn super-action-btn--del">🗑️</button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ MONITOREO TAB ══════════ */}
        {tab === 'monitoreo' && (
          <div className="animate-fade-in">
            {monitorLoad ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--text-3)' }}>
                <span className="spinner-mini" style={{ width: 22, height: 22 }} /> Cargando datos de monitoreo...
              </div>
            ) : (
              <>
                {/* Global KPIs */}
                <div className="super-kpi-grid">
                  <StatCard icon="🏢" label="Negocios activos" value={activeTenantsCount} sub={`${tenants.length} total`} color="#16a34a" />
                  <StatCard icon="🚀" label="En producción" value={deployedCount} sub="deployados" color="#0891b2" />
                  <StatCard icon="📅" label="Citas hoy" value={monitorData.citasHoy.length} sub="en todos los negocios" color="#7c3aed" />
                  <StatCard icon="📋" label="Total citas" value={monitorData.citas.length} sub="sin eliminar" color="#ea580c" />
                  <StatCard icon="👥" label="Clientes totales" value={monitorData.clientes.length} sub="en todos los negocios" color="#2563eb" />
                  <StatCard icon="📍" label="Sedes" value={ubicacionesCount} sub="ubicaciones activas" color="#d97706" />
                </div>

                {/* Per-tenant breakdown */}
                <div className="card super-main-card" style={{ marginTop: '1.5rem' }}>
                  <div className="super-card-header">
                    <h3 className="super-card-title">Detalle por Negocio</h3>
                    <button onClick={fetchMonitor} className="super-refresh-btn">↻</button>
                  </div>
                  <div className="super-table-wrapper">
                    <table className="super-table">
                      <thead><tr>{['Negocio', 'Estado', 'Citas hoy', 'Citas total', 'Clientes', 'Sedes', 'Usuarios activos', 'Acceso'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                      <tbody>
                        {tenants.map(t => {
                          const tCitas = monitorData.citas.filter(c => c.idnegocios === t.idnegocios);
                          const tCitasHoy = monitorData.citasHoy.filter(c => c.idnegocios === t.idnegocios);
                          const tClientes = monitorData.clientes.filter(c => c.idnegocios === t.idnegocios);
                          const tUbic = ubicaciones.filter(u => u.idnegocios === t.idnegocios);
                          const tUsers = users.filter(u => u._negocios?.some(n => n.idnegocios === t.idnegocios) && u.idestado === 1);
                          return (
                            <tr key={t.idnegocios} className="super-tr-hover">
                              <TD>
                                <div style={{ fontWeight: 700 }}>{t.nombre}</div>
                                <div style={{ fontSize: '0.69rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>{t.dominio}</div>
                              </TD>
                              <TD><EstadoBadge id={t.idestadoapp} /></TD>
                              <TD>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: tCitasHoy.length > 0 ? '#7c3aed' : 'var(--text-3)' }}>
                                  {tCitasHoy.length}
                                </span>
                              </TD>
                              <TD style={{ fontWeight: 700, color: 'var(--text-2)' }}>{tCitas.length}</TD>
                              <TD style={{ fontWeight: 700, color: 'var(--text-2)' }}>{tClientes.length}</TD>
                              <TD>
                                {tUbic.length > 0
                                  ? <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{tUbic.map(u => <span key={u.idubicacion} className="super-loc-chip">{u.nombre}</span>)}</div>
                                  : <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>—</span>
                                }
                              </TD>
                              <TD>
                                <span style={{ fontWeight: 700, color: tUsers.length > 0 ? '#16a34a' : 'var(--text-4)' }}>{tUsers.length}</span>
                              </TD>
                              <TD>
                                {t.idestadoapp === 1 && (
                                  <a href={`${protocol}//${t.dominio}.${baseDomain}${port}`} target="_blank" rel="noreferrer" className="super-action-btn super-action-btn--link">
                                    Abrir ↗
                                  </a>
                                )}
                              </TD>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ Tenant Modal ══ */}
      {tenantModal && (
        <Modal
          title={tenantModal === 'add' ? '+ Nuevo Negocio' : `Editar · ${tenantModal.nombre}`}
          subtitle={tenantModal === 'add' ? 'Registra un nuevo negocio en la plataforma' : `ID: ${tenantModal.idnegocios} · ${tenantModal.dominio}`}
          onClose={() => setTenantModal(null)}
        >
          <TenantForm form={tForm} setForm={setTForm} onSubmit={handleSaveTenant} onDelete={deleteTenant} isEdit={tenantModal !== 'add'} saving={savingT} allUsers={users} />
        </Modal>
      )}

      {/* ══ User Modal ══ */}
      {userModal && userModal !== 'delete' && (
        <Modal
          title={userModal === 'add' ? '+ Nuevo Usuario' : `Editar · ${userModal.nombre} ${userModal.apellido}`}
          subtitle={userModal !== 'add' ? `${userModal.email} · ID: ${userModal.idusuario}` : 'Crea un usuario en el sistema'}
          onClose={() => setUserModal(null)}
        >
          <UserForm form={uForm} setForm={setUForm} onSubmit={handleSaveUser} onDelete={() => deleteUser(userModal)} isEdit={userModal !== 'add'} saving={savingU} tenants={tenants} />
        </Modal>
      )}

      {/* ══ Ubicacion Modal ══ */}
      {ubicModal && (
        <Modal
          title={ubicModal === 'add' ? '+ Nueva Sede' : `Editar sede · ${ubicModal.nombre}`}
          subtitle={ubicModal !== 'add' ? `Negocio: ${tenantName(ubicModal.idnegocios) || '—'} · ID: ${ubicModal.idubicacion}` : 'Registra una sede para un negocio'}
          onClose={() => setUbicModal(null)}
          width={500}
        >
          <form onSubmit={handleSaveUbic} className="super-form">
            <div className="super-form-grid">
              <Field label="Nombre de la sede" style={{ flex: '1 1 100%' }}>
                <input className="input-field" required value={locForm.nombre} onChange={e => setLocForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Sede Norte, Sala 1..." />
              </Field>
              <Field label="Dirección (opcional)" style={{ flex: '1 1 100%' }}>
                <input className="input-field" value={locForm.direccion} onChange={e => setLocForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle 45 # 23-10..." />
              </Field>
              <Field label="Negocio al que pertenece" style={{ flex: '1 1 100%' }}>
                <select className="input-field" required value={locForm.idnegocios} onChange={e => setLocForm(f => ({ ...f, idnegocios: e.target.value }))}>
                  <option value="">Selecciona un negocio...</option>
                  {tenants.map(t => <option key={t.idnegocios} value={t.idnegocios}>{t.nombre} ({t.dominio})</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={savingLoc} style={{ borderRadius: 10 }}>
                {savingLoc ? <><span className="spinner-mini" style={{ marginRight: 8 }} />Guardando...</> : ubicModal === 'add' ? 'Crear Sede' : 'Guardar Cambios'}
              </button>
              {ubicModal !== 'add' && <button type="button" onClick={() => deleteUbic(ubicModal)} className="super-btn-delete-alt">🗑️ Eliminar</button>}
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog confirm={confirm} onCancel={closeConfirm} />
      <Snackbar snack={snack} />
    </div>
  );
}
