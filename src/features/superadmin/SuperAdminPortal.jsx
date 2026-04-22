import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

/* ─── authHelper: client aislado para signUp sin afectar sesión activa ── */
const authHelper = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

/* ─── Constants ─────────────────────────────────── */
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
  { id: 2, label: 'Profesional / Especialista' },
  { id: 3, label: 'Recepcionista' },
];

/* ─── Snackbar ────────────────────────────────────── */
function Snackbar({ snack }) {
  if (!snack) return null;
  const bg = snack.type === 'error' ? '#dc2626' : snack.type === 'warning' ? '#d97706' : '#16a34a';
  const icon = snack.type === 'error' ? '✕' : snack.type === 'warning' ? '⚠' : '✓';
  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      background: bg, color: '#fff', borderRadius: 14,
      padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.7rem',
      boxShadow: '0 8px 30px rgba(0,0,0,0.22)', maxWidth: 380, fontSize: '0.9rem', fontWeight: 600,
    }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>{icon}</span>
      {snack.message}
    </div>
  );
}

/* ─── ConfirmDialog ──────────────────────────────── */
function ConfirmDialog({ confirm, onCancel }) {
  if (!confirm?.open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="card animate-scale-in" style={{ padding: '2rem', maxWidth: 400, width: '90%', borderRadius: 20, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>¿Confirmar acción?</h3>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-3)', fontSize: '0.9rem', lineHeight: 1.5 }}>{confirm.message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '0.65rem 1.4rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-2)', fontFamily: 'var(--font-main)' }}>Cancelar</button>
          <button onClick={confirm.onConfirm} style={{ padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none', background: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#fff', fontFamily: 'var(--font-main)' }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Static helpers (OUTSIDE main para evitar pérdida de foco) ── */
function EstadoBadge({ id }) {
  const opt = ESTADO_OPTIONS.find(e => e.id === id);
  if (!opt) return <span style={{ color: '#9ca3af' }}>—</span>;
  return <span style={{ background: opt.bg, color: opt.color, border: `1px solid ${opt.border}`, borderRadius: 99, padding: '3px 10px', fontSize: '0.71rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{opt.label}</span>;
}

const TH = ({ children }) => (
  <th style={{ padding: '0.65rem 1rem', fontWeight: 700, color: 'var(--text-3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
    {children}
  </th>
);
const TD = ({ children, style }) => (
  <td style={{ padding: '0.72rem 1rem', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', fontSize: '0.875rem', ...style }}>
    {children}
  </td>
);

function Field({ label, style, children }) {
  return (
    <div className="input-group" style={{ flex: '1 1 240px', ...style }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, width = 640 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>✕</button>
        </div>
        <div style={{ padding: '1.5rem 1.75rem' }}>{children}</div>
      </div>
    </div>
  );
}

function FilterBar({ search, onSearch, sort, onSort, extra }) {
  return (
    <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input className="input-field" style={{ paddingLeft: '2rem', fontSize: '0.84rem', height: 36 }} placeholder="Buscar…" value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      <select value={sort} onChange={e => onSort(e.target.value)}
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '4px 10px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-main)', height: 36 }}>
        <option value="newest">Más reciente</option>
        <option value="oldest">Más antiguo</option>
      </select>
      {extra}
    </div>
  );
}

function TenantForm({ form, setForm, onSubmit, onDelete, isEdit, saving }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
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
        <Field label="ID Usuario Admin">
          <input type="number" className="input-field" value={form.idusuarioadmin} onChange={e => setForm(f => ({ ...f, idusuarioadmin: e.target.value }))} placeholder="ID del admin (ver Usuarios)" />
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
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 10 }}>
          {saving ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginRight: 8 }} />Guardando...</> : isEdit ? 'Guardar Cambios' : 'Crear Negocio'}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete}
            style={{ borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
            🗑️ Eliminar Negocio
          </button>
        )}
      </div>
    </form>
  );
}

function UserForm({ form, setForm, onSubmit, onDelete, isEdit, saving, tenants }) {
  const [showPass, setShowPass] = useState(false);
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <Field label="Nombre"><input className="input-field" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Karen" /></Field>
        <Field label="Apellido"><input className="input-field" required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Useche" /></Field>
        <Field label="Cédula"><input className="input-field" required value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} placeholder="1010000001" /></Field>
        <Field label="Email"><input type="email" className="input-field" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@tienda.com" /></Field>
        <Field label={isEdit ? 'Nueva Contraseña (vacío = no cambiar)' : 'Contraseña *'}>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} className="input-field" required={!isEdit} value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))} placeholder="••••••" style={{ paddingRight: '2.5rem' }} />
            <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '1rem' }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </Field>
        <Field label="Teléfono"><input className="input-field" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+57 300..." /></Field>
        <Field label="Profesión"><input className="input-field" value={form.profesion} onChange={e => setForm(f => ({ ...f, profesion: e.target.value }))} placeholder="Médico estético..." /></Field>
        <Field label="Rol por defecto">
          <select className="input-field" value={form.idrol} onChange={e => setForm(f => ({ ...f, idrol: parseInt(e.target.value) }))}>
            {ROL_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Negocio al que pertenece">
          <select className="input-field" value={form.idnegocios} onChange={e => setForm(f => ({ ...f, idnegocios: e.target.value }))}>
            <option value="">Seleccione un negocio...</option>
            {tenants && tenants.map(t => (
              <option key={t.idnegocios} value={t.idnegocios}>{t.nombre} (ID: {t.idnegocios})</option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select className="input-field" value={form.idestado} onChange={e => setForm(f => ({ ...f, idestado: parseInt(e.target.value) }))}>
            <option value={1}>Activo</option><option value={2}>Inactivo</option>
          </select>
        </Field>
      </div>
      {!isEdit && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--primary-light)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
          ℹ️ Al crear el usuario también se registrará en Supabase Auth para habilitar recuperación de contraseña por correo.
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 10 }}>
          {saving ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginRight: 8 }} />Guardando...</> : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete}
            style={{ borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
            🗑️ Eliminar Usuario
          </button>
        )}
      </div>
    </form>
  );
}

/* ══════════════════════════ MAIN ══════════════════════════════════════ */
export default function SuperAdminPortal() {
  const [adminLogged, setAdminLogged]     = useState(false);
  const [currentUser, setCurrentUser]     = useState(null);
  const [pass, setPass]                   = useState('');
  const [tab, setTab]                     = useState('negocios');
  const [copied, setCopied]               = useState(null);

  /* Snackbar */
  const [snack, setSnack] = useState(null);
  const showSnack = useCallback((message, type = 'success') => {
    setSnack({ message, type });
    setTimeout(() => setSnack(null), 3500);
  }, []);

  /* Confirm dialog */
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });
  const askConfirm = (message, onConfirm) => setConfirm({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirm({ open: false, message: '', onConfirm: null });

  /* Negocios */
  const [tenants, setTenants]           = useState([]);
  const [tenantLoad, setTenantLoad]     = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantSort, setTenantSort]     = useState('newest');
  const [tenantModal, setTenantModal]   = useState(null);
  const [savingT, setSavingT]           = useState(false);
  const blankT = { nit: '', name: '', subdomain: '', descripcion: '', direccion: '', telefono: '', deployed: false, idestadoapp: 1, idusuarioadmin: '' };
  const [tForm, setTForm] = useState(blankT);

  /* Usuarios */
  const [users, setUsers]               = useState([]);
  const [userLoad, setUserLoad]         = useState(true);
  const [userSearch, setUserSearch]     = useState('');
  const [userSort, setUserSort]         = useState('newest');
  const [userRolFilter, setUserRolFilter] = useState('all');
  const [userModal, setUserModal]       = useState(null);
  const [savingU, setSavingU]           = useState(false);
  const blankU = { nombre: '', apellido: '', email: '', cedula: '', contrasena: '', telefono: '', profesion: '', idnegocios: '', idestado: 1, idrol: 1 };
  const [uForm, setUForm] = useState(blankU);

  /* ── Fetchers ── */
  const fetchTenants = useCallback(async () => {
    setTenantLoad(true);
    const { data, error } = await supabase.from('negocios').select('*').order('idnegocios');
    if (error) console.error('fetchTenants:', error);
    setTenants(data || []);
    setTenantLoad(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUserLoad(true);
    const { data: userData, error } = await supabase.from('usuario').select('*').order('idusuario');
    if (error) { console.error('fetchUsers:', error); setUsers([]); setUserLoad(false); return; }
    const { data: rolData } = await supabase.from('rolpermisos').select('idusuario, idrol');
    const rolMap = {};
    (rolData || []).forEach(r => { if (!rolMap[r.idusuario]) rolMap[r.idusuario] = r.idrol; });
    setUsers((userData || []).map(u => ({ ...u, _idrol: rolMap[u.idusuario] || null })));
    setUserLoad(false);
  }, []);

  useEffect(() => { if (adminLogged) { fetchTenants(); fetchUsers(); } }, [adminLogged]);

  /* ── Login ── */
  const [email, setEmail]                 = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [masterPass, setMasterPass]       = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [loginError, setLoginError]       = useState('');

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

  const handleRegisterSuper = async (e) => {
    e.preventDefault();
    if (masterPass !== 'super123') { setLoginError('Contraseña maestra incorrecta.'); return; }
    setIsAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { is_super_admin: true } } });
    if (!error) {
      await supabase.from('usuario').insert([{ nombre: 'Nuevo', apellido: 'SuperAdmin', email, 'password': pass, issuperadmin: true, idestado: 1 }]);
      await insertLog({ accion: 'CREATE', entidad: 'SuperAdmin', descripcion: `Nueva cuenta SuperAdmin: ${email}`, idUsuario: data.user?.id, idNegocios: null });
      showSnack('Cuenta SuperAdmin creada. Confirma el email si es necesario.');
      setIsRegistering(false);
    } else {
      setLoginError('Error al crear SuperAdmin: ' + error.message);
    }
    setIsAuthLoading(false);
  };

  /* ── Negocios CRUD ── */
  const openAddTenant  = () => { setTForm(blankT); setTenantModal('add'); };
  const openEditTenant = t => {
    setTForm({ nit: t.nit || '', name: t.nombre || '', subdomain: t.dominio || '', descripcion: t.descripcion || '', direccion: t.direccion || '', telefono: t.telefono || '', deployed: !!t.deployed, idestadoapp: t.idestadoapp || 1, idusuarioadmin: t.idusuarioadmin || '' });
    setTenantModal(t);
  };

  const handleSaveTenant = async e => {
    e.preventDefault();
    setSavingT(true);
    const payload = { nit: tForm.nit, nombre: tForm.name, dominio: tForm.subdomain, descripcion: tForm.descripcion, direccion: tForm.direccion, telefono: tForm.telefono, deployed: tForm.deployed, idestadoapp: tForm.idestadoapp, idusuarioadmin: tForm.idusuarioadmin ? parseInt(tForm.idusuarioadmin) : null };
    const isAdd = tenantModal === 'add';
    const { error } = isAdd
      ? await supabase.from('negocios').insert([payload])
      : await supabase.from('negocios').update(payload).eq('idnegocios', tenantModal.idnegocios);
    setSavingT(false);
    if (error) {
      showSnack('Error: ' + error.message, 'error');
      console.error(error);
    } else {
      await insertLog({ accion: isAdd ? 'CREATE' : 'UPDATE', entidad: 'Negocio', descripcion: `${isAdd ? 'Creación' : 'Actualización'} del negocio '${tForm.name}'`, idUsuario: currentUser?.id, idNegocios: isAdd ? null : tenantModal.idnegocios });
      showSnack(isAdd ? `Negocio "${tForm.name}" creado correctamente.` : `Negocio "${tForm.name}" actualizado.`);
      setTenantModal(null);
      fetchTenants();
    }
  };

  const deleteTenant = () => {
    askConfirm(`¿Eliminar el negocio "${tenantModal.nombre}" permanentemente? Esta acción no se puede deshacer.`, async () => {
      closeConfirm();
      const { error } = await supabase.from('negocios').delete().eq('idnegocios', tenantModal.idnegocios);
      if (error) {
        showSnack('Error al eliminar: ' + error.message, 'error');
      } else {
        showSnack(`Negocio "${tenantModal.nombre}" eliminado.`, 'warning');
        setTenantModal(null);
        fetchTenants();
      }
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
  const openAddUser  = () => { setUForm(blankU); setUserModal('add'); };
  const openEditUser = u => {
    setUForm({ nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '', cedula: u.cedula || '', contrasena: '', telefono: u.telefono || '', profesion: u.profesion || '', idnegocios: u.idnegocios || '', idestado: u.idestado || 1, idrol: u._idrol || 1 });
    setUserModal(u);
  };

  const handleSaveUser = async e => {
    e.preventDefault();
    setSavingU(true);
    const isAdd = userModal === 'add';
    const payload = { nombre: uForm.nombre, apellido: uForm.apellido, email: uForm.email, cedula: uForm.cedula, telefono: uForm.telefono, profesion: uForm.profesion, idestado: uForm.idestado, idnegocios: uForm.idnegocios ? parseInt(uForm.idnegocios) : null };
    if (uForm.contrasena) payload['password'] = uForm.contrasena;

    const { error } = isAdd
      ? await supabase.from('usuario').insert([{ ...payload, 'password': uForm.contrasena }])
      : await supabase.from('usuario').update(payload).eq('idusuario', userModal.idusuario);

    if (error) {
      showSnack('Error: ' + error.message, 'error');
      setSavingU(false);
      return;
    }

    /* Obtener ID del usuario guardado */
    const savedId = isAdd
      ? (await supabase.from('usuario').select('idusuario').eq('email', uForm.email).maybeSingle()).data?.idusuario
      : userModal.idusuario;

    /* Sincronizar rol */
    if (savedId && uForm.idrol) {
      const { data: updatedRows } = await supabase.from('rolpermisos').update({ idrol: uForm.idrol }).eq('idusuario', savedId).select();
      if (!updatedRows || updatedRows.length === 0) {
        await supabase.from('rolpermisos').insert([{ idusuario: savedId, idrol: uForm.idrol, idpermiso: 1 }]);
      }
    }

    /* Registrar en auth.users para habilitar recuperación por correo */
    if (isAdd && uForm.email && uForm.contrasena) {
      const { error: authErr } = await authHelper.auth.signUp({
        email: uForm.email,
        password: uForm.contrasena,
        options: { data: { nombre: uForm.nombre, apellido: uForm.apellido, idusuario: savedId, idnegocios: uForm.idnegocios ? parseInt(uForm.idnegocios) : null } }
      });
      if (authErr && !authErr.message?.toLowerCase().includes('already registered')) {
        console.warn('auth.users sync (no crítico):', authErr.message);
      }
    }

    await insertLog({ accion: isAdd ? 'CREATE' : 'UPDATE', entidad: 'Usuario', descripcion: `${isAdd ? 'Creación' : 'Edición'} de usuario: ${uForm.nombre} ${uForm.apellido} (${uForm.email})`, idUsuario: currentUser?.id, idNegocios: uForm.idnegocios ? parseInt(uForm.idnegocios) : null });

    setSavingU(false);
    showSnack(isAdd ? `Usuario "${uForm.nombre} ${uForm.apellido}" creado correctamente.` : `Usuario "${uForm.nombre} ${uForm.apellido}" actualizado.`);
    setUserModal(null);
    fetchUsers();
  };

  const deleteUser = (u) => {
    const target = u || userModal;
    if (!target) return;
    askConfirm(`¿Eliminar al usuario "${target.nombre} ${target.apellido}" (${target.email})? Se limpiarán sus permisos y referencias como admin de negocios.`, async () => {
      closeConfirm();
      /* Limpiar FK: negocios que tengan este usuario como idusuarioadmin */
      await supabase.from('negocios').update({ idusuarioadmin: null }).eq('idusuarioadmin', target.idusuario);
      /* Limpiar rolpermisos */
      await supabase.from('rolpermisos').delete().eq('idusuario', target.idusuario);
      /* Eliminar usuario */
      const { error } = await supabase.from('usuario').delete().eq('idusuario', target.idusuario);
      if (error) {
        showSnack('Error eliminando: ' + error.message, 'error');
      } else {
        await insertLog({ accion: 'DELETE', entidad: 'Usuario', descripcion: `Se eliminó al usuario: ${target.nombre} ${target.apellido} (${target.email})`, idUsuario: currentUser?.id, idNegocios: target.idnegocios });
        showSnack(`Usuario "${target.nombre} ${target.apellido}" eliminado.`, 'warning');
        setUserModal(null);
        fetchUsers();
      }
    });
  };

  const copyId = (id, e) => {
    e?.stopPropagation?.();
    navigator.clipboard.writeText(String(id));
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  /* ── Filtering & sorting ── */
  const sortFn = (a, b, key, dir) => dir === 'newest' ? (b[key] || 0) - (a[key] || 0) : (a[key] || 0) - (b[key] || 0);

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

  const tenantName = id => tenants.find(t => t.idnegocios === id)?.nombre || null;

  /* ── Domain helper ── */
  const isLocal    = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
  const hostHost   = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
  const hostParts  = hostHost.split('.');
  const baseDomain = (!isLocal && hostParts.length > 2) ? hostParts.slice(1).join('.') : (isLocal && hostParts.length > 1 ? hostParts.slice(1).join('.') : hostHost);
  const protocol   = isLocal ? 'http:' : 'https:';
  const port       = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');

  /* ── Stats ── */
  const activeTenantsCount  = tenants.filter(t => t.idestadoapp === 1).length;
  const deployedCount       = tenants.filter(t => t.deployed).length;
  const activeUsersCount    = users.filter(u => u.idestado === 1).length;

  /* ═══════════════ LOGIN SCREEN ═══════════════ */
  if (!adminLogged) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      <ParticleBackground />
      <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />
      <div className="card animate-fade-up" style={{ width: 380, padding: '2.5rem', zIndex: 1, borderRadius: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', overflow: 'hidden', boxShadow: '0 4px 16px rgba(37,99,235,0.2)' }}>
            <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/logodark.jpeg' : '/logoclaro.jpeg'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
          </div>
          <h2 style={{ margin: '0 0 0.25rem', fontWeight: 800 }}>{isRegistering ? 'Crear Super Admin' : 'Portal Super Admin'}</h2>
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-3)' }}>NovaAgendas · Solo personal autorizado</p>
        </div>

        {loginError && (
          <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '1rem', padding: '0.7rem 0.9rem', fontSize: '0.83rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {loginError}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegisterSuper : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <input type="email" className="input-field" placeholder="Correo electrónico" value={email} onChange={e => { setEmail(e.target.value); setLoginError(''); }} autoFocus />
          <input type="password" className="input-field" placeholder="Contraseña" value={pass} onChange={e => { setPass(e.target.value); setLoginError(''); }} />
          {isRegistering && (
            <input type="password" className="input-field" placeholder="Contraseña maestra de confirmación" value={masterPass} onChange={e => setMasterPass(e.target.value)} style={{ border: '1px solid var(--accent)' }} />
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', marginTop: '0.25rem', borderRadius: 12 }} disabled={isAuthLoading}>
            {isAuthLoading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />Procesando...</span>
              : isRegistering ? 'Registrar SuperAdmin' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setLoginError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            {isRegistering ? '← Volver al Login' : '¿Eres nuevo? Crear SuperAdmin'}
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════ MAIN PORTAL ═══════════════ */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-main)', position: 'relative' }}>

      {/* ── Sticky header ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/logodark.jpeg' : '/logoclaro.jpeg'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>NovaAgendas</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Super Admin</div>
            </div>
          </div>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, border: '1px solid var(--border)', marginLeft: '0.5rem' }}>
            {[{ id: 'negocios', label: 'Negocios', count: filteredTenants.length }, { id: 'usuarios', label: 'Usuarios', count: filteredUsers.length }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '0.38rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-3)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {t.label}
                <span style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'var(--border)', borderRadius: 99, padding: '1px 6px', fontSize: '0.7rem' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser && <span style={{ fontSize: '0.78rem', color: 'var(--text-4)', fontWeight: 500 }}>{currentUser.email}</span>}
          <ThemeToggle style={{ position: 'relative' }} />
          <button className="btn btn-primary" style={{ borderRadius: 10, padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            onClick={tab === 'negocios' ? openAddTenant : openAddUser}>
            + {tab === 'negocios' ? 'Nueva Tienda' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.6rem 2rem', display: 'flex', gap: '2rem', overflowX: 'auto' }}>
        {[
          { label: 'Negocios activos', value: activeTenantsCount, color: '#16a34a' },
          { label: 'En producción',    value: deployedCount,       color: '#0891b2' },
          { label: 'Total negocios',   value: tenants.length,      color: 'var(--text-2)' },
          { label: 'Usuarios activos', value: activeUsersCount,    color: '#7c3aed' },
          { label: 'Total usuarios',   value: users.length,        color: 'var(--text-2)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.75rem 2rem' }}>

        {/* ══════════ NEGOCIOS TAB ══════════ */}
        {tab === 'negocios' && (
          <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                Negocios registrados
                <span style={{ color: 'var(--text-4)', fontWeight: 500, fontSize: '0.82rem', marginLeft: 8 }}>({filteredTenants.length})</span>
              </h3>
              <button onClick={fetchTenants} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '1.15rem', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
                title="Actualizar">↻</button>
            </div>

            <FilterBar search={tenantSearch} onSearch={setTenantSearch} sort={tenantSort} onSort={setTenantSort} />

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr>
                  {['ID', 'Subdominio', 'Nombre / NIT', 'Admin', 'Deployed', 'Estado', 'Editar', 'Abrir'].map(h => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {tenantLoad ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Cargando...
                      </div>
                    </td></tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>{tenantSearch ? 'Sin resultados para esa búsqueda.' : 'Sin negocios registrados.'}</td></tr>
                  ) : filteredTenants.map(t => (
                    <tr key={t.idnegocios}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ transition: 'background 0.15s' }}>
                      <TD>
                        <button onClick={e => copyId(t.idnegocios, e)} title="Copiar ID"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: copied === t.idnegocios ? '#dcfce7' : 'var(--surface-2)', border: `1px solid ${copied === t.idnegocios ? '#86efac' : 'var(--border)'}`, borderRadius: 7, padding: '3px 8px', cursor: 'pointer', fontSize: '0.79rem', fontWeight: 700, color: copied === t.idnegocios ? '#16a34a' : 'var(--text-3)', fontFamily: 'monospace', transition: 'all 0.2s' }}>
                          {copied === t.idnegocios ? '✓' : '⎘'} #{t.idnegocios}
                        </button>
                      </TD>
                      <TD><span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>{t.dominio}</span></TD>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{t.nombre}</div>
                        {t.nit && <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: 2 }}>NIT: {t.nit}</div>}
                        {t.descripcion && <div style={{ fontSize: '0.69rem', color: 'var(--text-4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descripcion}</div>}
                      </TD>
                      <TD style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        {t.idusuarioadmin ? (
                          <span>{tenantName(t.idusuarioadmin) || `ID: ${t.idusuarioadmin}`}</span>
                        ) : <span style={{ color: '#9ca3af' }}>—</span>}
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
                        <button onClick={() => openEditTenant(t)}
                          style={{ background: 'var(--primary-light)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          ✏️ Editar
                        </button>
                      </TD>
                      <TD>
                        <a href={`${protocol}//${t.dominio}.${baseDomain}${port}`} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem', padding: '5px 12px', border: '1px solid var(--primary)', borderRadius: 8, whiteSpace: 'nowrap' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          Ir ↗
                        </a>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ USUARIOS TAB ══════════ */}
        {tab === 'usuarios' && (
          <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                Usuarios del sistema
                <span style={{ color: 'var(--text-4)', fontWeight: 500, fontSize: '0.82rem', marginLeft: 8 }}>({filteredUsers.length})</span>
              </h3>
              <button onClick={fetchUsers}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '1.15rem', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}>↻</button>
            </div>

            <FilterBar
              search={userSearch} onSearch={setUserSearch}
              sort={userSort} onSort={setUserSort}
              extra={
                <select value={userRolFilter} onChange={e => setUserRolFilter(e.target.value)}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '4px 10px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-main)', height: 36 }}>
                  <option value="all">Todos los roles</option>
                  {ROL_OPTIONS.map(r => <option key={r.id} value={String(r.id)}>{r.label}</option>)}
                </select>
              }
            />

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr>
                  {['ID', 'Nombre', 'Email', 'Negocio', 'Rol', 'Super', 'Estado', 'Acciones'].map(h => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {userLoad ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Cargando desde Supabase...
                      </div>
                    </td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>{userSearch ? 'Sin resultados.' : 'Sin usuarios registrados.'}</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.idusuario}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ transition: 'background 0.15s' }}>
                      <TD>
                        <button onClick={e => copyId(u.idusuario, e)} title="Copiar ID"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: copied === u.idusuario ? '#dcfce7' : 'var(--surface-2)', border: `1px solid ${copied === u.idusuario ? '#86efac' : 'var(--border)'}`, borderRadius: 7, padding: '3px 8px', cursor: 'pointer', fontSize: '0.79rem', fontWeight: 700, color: copied === u.idusuario ? '#16a34a' : 'var(--text-3)', fontFamily: 'monospace', transition: 'all 0.2s' }}>
                          {copied === u.idusuario ? '✓' : '⎘'} #{u.idusuario}
                        </button>
                      </TD>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{u.nombre} {u.apellido}</div>
                        {u.cedula && <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{u.cedula}</div>}
                      </TD>
                      <TD style={{ color: 'var(--text-2)', fontSize: '0.83rem' }}>{u.email}</TD>
                      <TD>
                        {u.idnegocios
                          ? <div>
                            <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{tenantName(u.idnegocios) || '—'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>ID: {u.idnegocios}</div>
                          </div>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </TD>
                      <TD>
                        {(() => {
                          const rolColor = u._idrol === 1 ? '#7c3aed' : u._idrol === 2 ? '#0891b2' : '#16a34a';
                          const rolBg    = u._idrol === 1 ? '#ede9fe'  : u._idrol === 2 ? '#e0f2fe'  : '#dcfce7';
                          return (
                            <select
                              value={u._idrol || ''}
                              onChange={async e => {
                                const newRol = parseInt(e.target.value);
                                const { data: updatedRows } = await supabase.from('rolpermisos').update({ idrol: newRol }).eq('idusuario', u.idusuario).select();
                                if (!updatedRows || updatedRows.length === 0) {
                                  await supabase.from('rolpermisos').insert([{ idusuario: u.idusuario, idrol: newRol, idpermiso: 1 }]);
                                }
                                showSnack(`Rol de ${u.nombre} actualizado.`);
                                fetchUsers();
                              }}
                              style={{ background: rolBg, color: rolColor, border: `1px solid ${rolColor}40`, borderRadius: 99, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
                              <option value="">Sin rol</option>
                              {ROL_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                          );
                        })()}
                      </TD>
                      <TD style={{ textAlign: 'center' }}>
                        {u.issuperadmin
                          ? <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 99, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>SA</span>
                          : <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>}
                      </TD>
                      <TD>
                        <span style={{ background: u.idestado === 1 ? '#dcfce7' : '#fee2e2', color: u.idestado === 1 ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {u.idestado === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </TD>
                      <TD>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => openEditUser(u)} title="Editar"
                            style={{ background: 'var(--primary-light)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>✏️</button>
                          <button onClick={() => deleteUser(u)} title="Eliminar"
                            style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>🗑️</button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══ Tenant Modal ══ */}
      {tenantModal && (
        <Modal title={tenantModal === 'add' ? '+ Nueva Tienda' : `Editar · ${tenantModal.nombre}`} onClose={() => setTenantModal(null)}>
          <TenantForm form={tForm} setForm={setTForm} onSubmit={handleSaveTenant} onDelete={deleteTenant} isEdit={tenantModal !== 'add'} saving={savingT} />
        </Modal>
      )}

      {/* ══ User Modal ══ */}
      {userModal && userModal !== 'delete' && (
        <Modal title={userModal === 'add' ? '+ Nuevo Usuario' : `Editar · ${userModal.nombre} ${userModal.apellido}`} onClose={() => setUserModal(null)}>
          <UserForm form={uForm} setForm={setUForm} onSubmit={handleSaveUser} onDelete={() => deleteUser(userModal)} isEdit={userModal !== 'add'} saving={savingU} tenants={tenants} />
        </Modal>
      )}

      {/* ══ Confirm Dialog ══ */}
      <ConfirmDialog confirm={confirm} onCancel={closeConfirm} />

      {/* ══ Snackbar ══ */}
      <Snackbar snack={snack} />
    </div>
  );
}
