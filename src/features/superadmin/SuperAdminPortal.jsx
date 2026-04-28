import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './SuperAdminPortal.css';

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
    <div className="super-snackbar animate-fade-in" style={{ background: bg }}>
      <span className="super-snackbar-icon">{icon}</span>
      {snack.message}
    </div>
  );
}

/* ─── ConfirmDialog ──────────────────────────────── */
function ConfirmDialog({ confirm, onCancel }) {
  if (!confirm?.open) return null;
  return (
    <div className="super-confirm-overlay">
      <div className="card super-confirm-card animate-scale-in" style={{ padding: '2rem', maxWidth: 400, width: '90%', borderRadius: 20, textAlign: 'center' }}>
        <div className="super-confirm-icon-box">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 className="super-confirm-title">¿Confirmar acción?</h3>
        <p className="super-confirm-msg">{confirm.message}</p>
        <div className="super-confirm-actions">
          <button onClick={onCancel} className="btn-cancel" style={{ padding: '0.65rem 1.4rem', borderRadius: 10 }}>Cancelar</button>
          <button onClick={confirm.onConfirm} className="super-btn-delete-alt">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Static helpers (OUTSIDE main para evitar pérdida de foco) ── */
function EstadoBadge({ id }) {
  const opt = ESTADO_OPTIONS.find(e => e.id === id);
  if (!opt) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <span 
      className="super-badge" 
      style={{ background: opt.bg, color: opt.color, border: `1px solid ${opt.border}` }}
    >
      {opt.label}
    </span>
  );
}

const TH = ({ children }) => (
  <th className="super-th">
    {children}
  </th>
);

const TD = ({ children, className = '', style }) => (
  <td className={`super-td ${className}`} style={style}>
    {children}
  </td>
);

function Field({ label, style, children }) {
  return (
    <div className="input-group" style={{ flex: '1 1 240px', ...style }}>
      <label className="super-field-label">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, width = 640 }) {
  return (
    <div className="super-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: 20 }}>
        <div className="super-modal-header">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} className="super-modal-close">✕</button>
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
        <svg className="super-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
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

function TenantForm({ form, setForm, onSubmit, onDelete, isEdit, saving }) {
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
          {saving ? <><span className="spinner-mini" style={{ marginRight: 8 }} />Guardando...</> : isEdit ? 'Guardar Cambios' : 'Crear Negocio'}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete} className="super-btn-delete-alt">
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
    <form onSubmit={onSubmit} className="super-form">
      <div className="super-form-grid">
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
          {saving ? <><span className="spinner-mini" style={{ marginRight: 8 }} />Guardando...</> : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
        {isEdit && (
          <button type="button" onClick={onDelete} className="super-btn-delete-alt">
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

  useEffect(() => { if (adminLogged) { fetchTenants(); fetchUsers(); } }, [adminLogged, fetchTenants, fetchUsers]);

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
            {isAuthLoading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner-mini" />Procesando...</span>
              : isRegistering ? 'Registrar SuperAdmin' : 'Ingresar'}
          </button>
        </form>

        <div className="super-login-footer">
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setLoginError(''); }} className="super-text-link">
            {isRegistering ? '← Volver al Login' : '¿Eres nuevo? Crear SuperAdmin'}
          </button>
        </div>
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
            {[{ id: 'negocios', label: 'Negocios', count: filteredTenants.length }, { id: 'usuarios', label: 'Usuarios', count: filteredUsers.length }].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`super-nav-btn ${tab === t.id ? 'super-nav-btn--active' : ''}`}
              >
                {t.label}
                <span className="super-nav-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="super-header-right">
          {currentUser && <span className="super-user-email">{currentUser.email}</span>}
          <ThemeToggle style={{ position: 'relative' }} />
          <button 
            className="btn btn-primary" 
            style={{ borderRadius: 10, padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            onClick={tab === 'negocios' ? openAddTenant : openAddUser}
          >
            + {tab === 'negocios' ? 'Nueva Tienda' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="super-stats-bar">
        {[
          { label: 'Negocios activos', value: activeTenantsCount, color: '#16a34a' },
          { label: 'En producción',    value: deployedCount,       color: '#0891b2' },
          { label: 'Total negocios',   value: tenants.length,      color: 'var(--text-2)' },
          { label: 'Usuarios activos', value: activeUsersCount,    color: '#7c3aed' },
          { label: 'Total usuarios',   value: users.length,        color: 'var(--text-2)' },
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
              <h3 className="super-card-title">
                Negocios registrados
                <span className="super-card-subtitle">({filteredTenants.length})</span>
              </h3>
              <button 
                onClick={fetchTenants} 
                className="super-refresh-btn"
                title="Actualizar"
              >
                ↻
              </button>
            </div>

            <FilterBar search={tenantSearch} onSearch={setTenantSearch} sort={tenantSort} onSort={setTenantSort} />

            <div className="super-table-wrapper">
              <table className="super-table">
                <thead><tr>
                  {['ID', 'Subdominio', 'Nombre / NIT', 'Admin', 'Deployed', 'Estado', 'Editar', 'Abrir'].map(h => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {tenantLoad ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span className="spinner-mini" style={{ width: 18, height: 18 }} />
                        Cargando...
                      </div>
                    </td></tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>{tenantSearch ? 'Sin resultados para esa búsqueda.' : 'Sin negocios registrados.'}</td></tr>
                  ) : filteredTenants.map(t => (
                    <tr key={t.idnegocios} className="super-tr-hover">
                      <TD>
                        <button 
                          onClick={e => copyId(t.idnegocios, e)} 
                          title="Copiar ID"
                          className={`super-btn-copy ${copied === t.idnegocios ? 'super-btn-copy--success' : ''}`}
                        >
                          {copied === t.idnegocios ? '✓' : '⎘'} #{t.idnegocios}
                        </button>
                      </TD>
                      <TD><span className="super-subdomain-tag">{t.dominio}</span></TD>
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
          <div className="card super-main-card animate-fade-in">
            <div className="super-card-header">
              <h3 className="super-card-title">
                Usuarios del sistema
                <span className="super-card-subtitle">({filteredUsers.length})</span>
              </h3>
              <button 
                onClick={fetchUsers}
                className="super-refresh-btn"
              >
                ↻
              </button>
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
                <thead><tr>
                  {['ID', 'Nombre', 'Email', 'Negocio', 'Rol', 'Super', 'Estado', 'Acciones'].map(h => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {userLoad ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span className="spinner-mini" style={{ width: 18, height: 18 }} />
                        Cargando desde Supabase...
                      </div>
                    </td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>{userSearch ? 'Sin resultados.' : 'Sin usuarios registrados.'}</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.idusuario} className="super-tr-hover">
                      <TD>
                        <button 
                          onClick={e => copyId(u.idusuario, e)} 
                          title="Copiar ID"
                          className={`super-btn-copy ${copied === u.idusuario ? 'super-btn-copy--success' : ''}`}
                        >
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
