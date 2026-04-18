import React, { useState, useEffect, useCallback } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

/* ─── Constants ────────────────────────────────────── */
const ESTADO_OPTIONS = [
  { id: 1, label: 'Activo', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  { id: 2, label: 'Suspendido', bg: '#fff7ed', color: '#ea580c', border: '#fdba74' },
  { id: 3, label: 'Eliminado', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  { id: 4, label: 'En Espera', bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  { id: 5, label: 'En Revisión', bg: '#eff6ff', color: '#7c3aed', border: '#a5b4fc' },
  { id: 6, label: 'Deployed', bg: '#eff6ff', color: '#0891b2', border: '#67e8f9' },
];

const ROL_OPTIONS = [
  { id: 1, label: 'Administrador' },
  { id: 2, label: 'Profesional / Especialista' },
  { id: 3, label: 'Recepcionista' },
];

/* ─── Static helpers (OUTSIDE main component to avoid focus loss) ── */
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

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>✕</button>
        </div>
        <div style={{ padding: '1.5rem 1.75rem' }}>{children}</div>
      </div>
    </div>
  );
}

/* FilterBar — outside main component to prevent focus loss */
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

/* TenantForm — outside main to avoid remounting on state change */
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
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 10 }}>{saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Negocio'}</button>
        {isEdit && (
          <button type="button" onClick={onDelete}
            style={{ borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
            Eliminar Negocio
          </button>
        )}
      </div>
    </form>
  );
}

/* UserForm — outside main to avoid remounting */
function UserForm({ form, setForm, onSubmit, onDelete, isEdit, saving, tenants }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <Field label="Nombre"><input className="input-field" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Karen" /></Field>
        <Field label="Apellido"><input className="input-field" required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Useche" /></Field>
        <Field label="Cédula"><input className="input-field" required value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} placeholder="1010000001" /></Field>
        <Field label="Email"><input type="email" className="input-field" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@tienda.com" /></Field>
        <Field label={isEdit ? 'Nueva Contraseña (vacío = no cambiar)' : 'Contraseña *'}>
          <input type="password" className="input-field" required={!isEdit} value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))} placeholder="••••••" />
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
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 10 }}>{saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}</button>
        {isEdit && (
          <button type="button" onClick={onDelete}
            style={{ borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
            Eliminar Usuario
          </button>
        )}
      </div>
    </form>
  );
}

/* ══════════════════════════════ MAIN ══════════════════════════════════════ */
export default function SuperAdminPortal() {
  const [adminLogged, setAdminLogged] = useState(false);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('negocios');
  const [copied, setCopied] = useState(null);

  /* Negocios */
  const [tenants, setTenants] = useState([]);
  const [tenantLoad, setTenantLoad] = useState(true);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantSort, setTenantSort] = useState('newest');
  const [tenantModal, setTenantModal] = useState(null);
  const [savingT, setSavingT] = useState(false);
  const blankT = { nit: '', name: '', subdomain: '', descripcion: '', direccion: '', telefono: '', deployed: false, idestadoapp: 1, idusuarioadmin: '' };
  const [tForm, setTForm] = useState(blankT);

  /* Usuarios */
  const [users, setUsers] = useState([]);
  const [userLoad, setUserLoad] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState('newest');
  const [userRolFilter, setUserRolFilter] = useState('all');
  const [userModal, setUserModal] = useState(null);
  const [savingU, setSavingU] = useState(false);
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
    // Fetch rolpermisos separately to avoid ambiguous FK error
    const { data: rolData } = await supabase.from('rolpermisos').select('idusuario, idrol');
    const rolMap = {};
    (rolData || []).forEach(r => { if (!rolMap[r.idusuario]) rolMap[r.idusuario] = r.idrol; });
    const merged = (userData || []).map(u => ({ ...u, _idrol: rolMap[u.idusuario] || null }));
    setUsers(merged);
    setUserLoad(false);
  }, []);

  useEffect(() => { if (adminLogged) { fetchTenants(); fetchUsers(); } }, [adminLogged]);

  /* ── Login ── */
  const [email, setEmail] = useState('sanabria3210@gmail.com');
  const [isRegistering, setIsRegistering] = useState(false);
  const [masterPass, setMasterPass] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setTenantLoad(true);
    let { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setTenantLoad(false);
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        alert('Error: Correo no confirmado. Debes confirmar el email en Supabase Auth o desactivar "Confirm Email" en Authentication -> Settings.');
      } else {
        alert('Error: ' + error.message);
      }
    }
    else if (data.session) setAdminLogged(true);
  };

  const handleRegisterSuper = async (e) => {
    e.preventDefault();
    if (masterPass !== 'super123') return alert('Contraseña maestra incorrecta.');
    setTenantLoad(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { is_super_admin: true } }
    });

    if (!error) {
      const { data: newUser } = await supabase.from('usuario').insert([{
        nombre: 'Nuevo',
        apellido: 'SuperAdmin',
        email: email,
        'password': pass,
        issuperadmin: true,
        idestado: 1
      }]).select();
      
      await insertLog({
        accion: 'CREATE',
        entidad: 'SuperAdmin',
        descripcion: `Se creó una nueva cuenta de SuperAdmin: ${email}`,
        idUsuario: data.user?.id,
        idNegocios: null // Global action
      });

      alert('Cuenta de SuperAdmin creada exitosamente. Recuerda confirmar el email si es necesario.');
      setIsRegistering(false);
    } else {
      alert('Error al crear SuperAdmin: ' + error.message);
    }
    setTenantLoad(false);
  };

  /* ── Negocios CRUD ── */
  const openAddTenant = () => { setTForm(blankT); setTenantModal('add'); };
  const openEditTenant = t => { setTForm({ nit: t.nit || '', name: t.nombre || '', subdomain: t.dominio || '', descripcion: t.descripcion || '', direccion: t.direccion || '', telefono: t.telefono || '', deployed: !!t.deployed, idestadoapp: t.idestadoapp || 1, idusuarioadmin: t.idusuarioadmin || '' }); setTenantModal(t); };

  const handleSaveTenant = async e => {
    e.preventDefault(); setSavingT(true);
    const payload = { nit: tForm.nit, nombre: tForm.name, dominio: tForm.subdomain, descripcion: tForm.descripcion, direccion: tForm.direccion, telefono: tForm.telefono, deployed: tForm.deployed, idestadoapp: tForm.idestadoapp, idusuarioadmin: tForm.idusuarioadmin ? parseInt(tForm.idusuarioadmin) : null };
    const { error } = tenantModal === 'add'
      ? await supabase.from('negocios').insert([payload])
      : await supabase.from('negocios').update(payload).eq('idnegocios', tenantModal.idnegocios);
    setSavingT(false);
    if (!error) {
      await insertLog({
        accion: tenantModal === 'add' ? 'CREATE' : 'UPDATE',
        entidad: 'Negocio',
        descripcion: `${tenantModal === 'add' ? 'Registro' : 'Actualización'} del negocio '${tForm.name}'`,
        idUsuario: user?.idusuario || user?.id,
        idNegocios: tenantModal === 'add' ? null : tenantModal.idnegocios
      });
      setTenantModal(null); fetchTenants();
    }
  };

  const deleteTenant = async () => {
    if (!window.confirm('¿Eliminar este negocio permanentemente?')) return;
    await supabase.from('negocios').delete().eq('idnegocios', tenantModal.idnegocios);
    setTenantModal(null); fetchTenants();
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
  const openEditUser = u => { setUForm({ nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '', cedula: u.cedula || '', contrasena: '', telefono: u.telefono || '', profesion: u.profesion || '', idnegocios: u.idnegocios || '', idestado: u.idestado || 1, idrol: u._idrol || 1 }); setUserModal(u); };

  const handleSaveUser = async e => {
    e.preventDefault(); setSavingU(true);
    const payload = { nombre: uForm.nombre, apellido: uForm.apellido, email: uForm.email, cedula: uForm.cedula, telefono: uForm.telefono, profesion: uForm.profesion, idestado: uForm.idestado, idnegocios: uForm.idnegocios ? parseInt(uForm.idnegocios) : null };
    if (uForm.contrasena) payload['password'] = uForm.contrasena;
    const { error } = userModal === 'add'
      ? await supabase.from('usuario').insert([{ ...payload, 'password': uForm.contrasena }])
      : await supabase.from('usuario').update(payload).eq('idusuario', userModal.idusuario);
    setSavingU(false);
    if (error) { alert('Error: ' + error.message); console.error(error); }
    else {
      // Upsert rol in rolpermisos without .single() to avoid 406 when multiple permissions exist
      const savedId = userModal === 'add'
        ? (await supabase.from('usuario').select('idusuario').eq('email', uForm.email).maybeSingle()).data?.idusuario
        : userModal.idusuario;
      if (savedId && uForm.idrol) {
        // Try update first
        const { data: updatedRows } = await supabase.from('rolpermisos').update({ idrol: uForm.idrol }).eq('idusuario', savedId).select();
        // If no rows updated, insert new
        if (!updatedRows || updatedRows.length === 0) {
          await supabase.from('rolpermisos').insert([{ idusuario: savedId, idrol: uForm.idrol, idpermiso: 1 }]);
        }
      }
      await insertLog({
        accion: userModal === 'add' ? 'CREATE' : 'UPDATE',
        entidad: 'Usuario',
        descripcion: `${userModal === 'add' ? 'Creación' : 'Edición'} de usuario: ${uForm.nombre} ${uForm.apellido} (${uForm.email})`,
        idUsuario: user?.idusuario || user?.id,
        idNegocios: uForm.idnegocios ? parseInt(uForm.idnegocios) : null
      });
      setUserModal(null); fetchUsers();
    }
  };

  const deleteUser = async (u) => {
    const target = u || userModal;
    if (!target || !window.confirm('¿Eliminar este usuario?')) return;
    await supabase.from('rolpermisos').delete().eq('idusuario', target.idusuario);
    const { error } = await supabase.from('usuario').delete().eq('idusuario', target.idusuario);
    if (!error) {
      await insertLog({
        accion: 'DELETE',
        entidad: 'Usuario',
        descripcion: `Se eliminó al usuario: ${target.nombre} ${target.apellido} (${target.email})`,
        idUsuario: user?.idusuario || user?.id,
        idNegocios: target.idnegocios
      });
      setUserModal(null); fetchUsers();
    } else {
      alert("Error eliminando: " + error.message);
    }
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

  // Lookup helpers
  const tenantName = id => tenants.find(t => t.idnegocios === id)?.nombre || null;
  const userName = id => { const u = users.find(u => u.idusuario === id); return u ? `${u.nombre} ${u.apellido}` : null; };

  /* ── Domain helper ── */
  const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
  const hostHost = window.location.hostname.replace(/^www\./, '').replace('127.0.0.1', 'localhost');
  const hostParts = hostHost.split('.');
  const baseDomain = (!isLocal && hostParts.length > 2) ? hostParts.slice(1).join('.') : (isLocal && hostParts.length > 1 ? hostParts.slice(1).join('.') : hostHost);
  const protocol = isLocal ? 'http:' : 'https:';
  const port = window.location.port ? `:${window.location.port}` : (isLocal ? ':5173' : '');

  if (!adminLogged) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface-2)', position: 'relative' }}>
      <ParticleBackground />
      <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />
      <div className="card flex-col gap-4" style={{ width: 360, padding: '2.5rem', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', overflow: 'hidden' }}>
            <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/logodark.jpeg' : '/logoclaro.jpeg'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
          </div>
          <h2 style={{ margin: '0 0 0.25rem' }}>{isRegistering ? 'Crear Super Admin' : 'Portal Super Admin'}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-3)' }}>novagendas · Solo personal autorizado</p>
        </div>
        <form onSubmit={isRegistering ? handleRegisterSuper : handleLogin} className="flex-col gap-4">
          <input type="email" className="input-field" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} autoFocus style={{ marginBottom: '1rem' }} />
          <input type="password" className="input-field" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} style={{ marginBottom: '1rem' }} />

          {isRegistering && (
            <input type="password" className="input-field" placeholder="Confirmación Maestra" value={masterPass} onChange={e => setMasterPass(e.target.value)} style={{ marginBottom: '1rem', border: '1px solid var(--accent)' }} />
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
            {tenantLoad ? 'Procesando...' : (isRegistering ? 'Registrar SuperAdmin' : 'Ingresar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            {isRegistering ? '← Volver al Login' : '¿Eres nuevo? Crear SuperAdmin'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-main)', position: 'relative' }}>

      {/* ── Sticky header ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/logodark.jpeg' : '/logoclaro.jpeg'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>NovAgendas</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Super Admin</div>
            </div>
          </div>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, border: '1px solid var(--border)', marginLeft: '0.5rem' }}>
            {[{ id: 'negocios', icon: '🏢', label: 'Negocios' }, { id: 'usuarios', icon: '👤', label: 'Usuarios' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '0.38rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-3)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', transition: 'all 0.2s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle style={{ position: 'relative' }} />
          <button className="btn btn-primary" style={{ borderRadius: 10, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={tab === 'negocios' ? openAddTenant : openAddUser}>
            ＋ {tab === 'negocios' ? 'Nueva Tienda' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '1.75rem 2rem' }}>

        {/* ══════════ NEGOCIOS TAB ══════════ */}
        {tab === 'negocios' && (
          <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Negocios <span style={{ color: 'var(--text-4)', fontWeight: 500, fontSize: '0.82rem' }}>({filteredTenants.length})</span></h3>
              <button onClick={fetchTenants} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '1.15rem' }} title="Actualizar">↻</button>
            </div>

            <FilterBar search={tenantSearch} onSearch={setTenantSearch} sort={tenantSort} onSort={setTenantSort} />

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr>
                  {['ID', 'Subdominio', 'Nombre / NIT', 'Teléfono', 'Deployed', 'Estado', 'Editar', 'Abrir'].map(h => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {tenantLoad ? (
                    <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>Cargando…</td></tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>{tenantSearch ? 'Sin resultados.' : 'Sin negocios registrados.'}</td></tr>
                  ) : filteredTenants.map(t => (
                    <tr key={t.idnegocios}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ transition: 'background 0.15s' }}>
                      <TD>
                        {/* Copy ID for negocios */}
                        <button onClick={e => copyId(t.idnegocios, e)} title="Copiar ID"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: copied === t.idnegocios ? '#dcfce7' : 'var(--surface-2)', border: `1px solid ${copied === t.idnegocios ? '#86efac' : 'var(--border)'}`, borderRadius: 7, padding: '3px 8px', cursor: 'pointer', fontSize: '0.79rem', fontWeight: 700, color: copied === t.idnegocios ? '#16a34a' : 'var(--text-3)', fontFamily: 'monospace', transition: 'all 0.2s' }}>
                          {copied === t.idnegocios ? '✓' : '⎘'} #{t.idnegocios}
                        </button>
                      </TD>
                      <TD><span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>{t.dominio}</span></TD>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{t.nombre}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: 2 }}>NIT: {t.nit}</div>
                        {t.descripcion && <div style={{ fontSize: '0.69rem', color: 'var(--text-4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descripcion}</div>}
                      </TD>
                      <TD style={{ color: 'var(--text-3)' }}>{t.telefono || '—'}</TD>

                      <TD style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={!!t.deployed} onChange={() => toggleDeployed(t.idnegocios, t.deployed)}
                          style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--primary)' }} />
                      </TD>
                      <TD>
                        <select value={t.idestadoapp || 1} onChange={e => updateStatus(t.idnegocios, parseInt(e.target.value))}
                          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.82rem', color: 'var(--text)', marginBottom: 4 }}>
                          {ESTADO_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                        <div><EstadoBadge id={t.idestadoapp} /></div>
                      </TD>
                      <TD>
                        <button onClick={() => openEditTenant(t)}
                          style={{ background: 'var(--primary-light)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                          ✏️ Editar
                        </button>
                      </TD>
                      <TD>
                        <a href={`${protocol}//${t.dominio}.${baseDomain}${port}`} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem', padding: '4px 10px', border: '1px solid var(--primary)', borderRadius: 8 }}
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
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Usuarios <span style={{ color: 'var(--text-4)', fontWeight: 500, fontSize: '0.82rem' }}>({filteredUsers.length})</span></h3>
              <button onClick={fetchUsers} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '1.15rem' }}>↻</button>
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
                    <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>Cargando desde Supabase…</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>{userSearch ? 'Sin resultados.' : 'Sin usuarios registrados.'}</td></tr>
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
                      <TD><div style={{ fontWeight: 600 }}>{u.nombre} {u.apellido}</div></TD>
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
                          const rolOpt = ROL_OPTIONS.find(r => r.id === u._idrol);
                          const rolColor = u._idrol === 1 ? '#7c3aed' : u._idrol === 2 ? '#0891b2' : '#16a34a';
                          const rolBg = u._idrol === 1 ? '#ede9fe' : u._idrol === 2 ? '#e0f2fe' : '#dcfce7';
                          return (
                            <select
                              value={u._idrol || ''}
                              onChange={async e => {
                                const newRol = parseInt(e.target.value);
                                const { data: updatedRows } = await supabase.from('rolpermisos').update({ idrol: newRol }).eq('idusuario', u.idusuario).select();
                                if (!updatedRows || updatedRows.length === 0) {
                                  await supabase.from('rolpermisos').insert([{ idusuario: u.idusuario, idrol: newRol, idpermiso: 1 }]);
                                }
                                fetchUsers();
                              }}
                              style={{ background: rolBg, color: rolColor, border: `1px solid ${rolColor}40`, borderRadius: 99, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}
                            >
                              <option value="">Sin rol</option>
                              {ROL_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                          );
                        })()}
                      </TD>
                      <TD style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={!!u.issuperadmin} readOnly style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                      </TD>
                      <TD>
                        <span style={{ background: u.idestado === 1 ? '#dcfce7' : '#fee2e2', color: u.idestado === 1 ? '#16a34a' : '#dc2626', padding: '3px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700 }}>
                          {u.idestado === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </TD>
                      <TD>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => openEditUser(u)}
                            style={{ background: 'var(--primary-light)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>✏️</button>
                          <button onClick={() => deleteUser(u)}
                            style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>🗑️</button>
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
        <Modal title={tenantModal === 'add' ? 'Nueva Tienda' : `Editar · ${tenantModal.nombre}`} onClose={() => setTenantModal(null)}>
          <TenantForm form={tForm} setForm={setTForm} onSubmit={handleSaveTenant} onDelete={deleteTenant} isEdit={tenantModal !== 'add'} saving={savingT} />
        </Modal>
      )}

      {/* ══ User Modal ══ */}
      {userModal && userModal !== 'delete' && (
        <Modal title={userModal === 'add' ? 'Nuevo Usuario' : `Editar · ${userModal.nombre} ${userModal.apellido}`} onClose={() => setUserModal(null)}>
          <UserForm form={uForm} setForm={setUForm} onSubmit={handleSaveUser} onDelete={() => deleteUser(userModal)} isEdit={userModal !== 'add'} saving={savingU} tenants={tenants} />
        </Modal>
      )}
    </div>
  );
}
