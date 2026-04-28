import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import './Users.css';

// Cliente auxiliar para crear entradas en auth.users sin afectar la sesión del admin
const authHelper = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

/* ─── Searchable Select Component ─────────────────────────── */
const SearchableSelect = ({ label, options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOpt = options.find(o => String(o.value) === String(value));

  return (
    <div className="select-wrapper" ref={wrapperRef}>
      <label className="select-label">{label}</label>
      <div
        className={`select-trigger ${isOpen ? 'select-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="select-trigger-icon">{icon}</span>
        <div className={`select-trigger-text ${selectedOpt ? 'select-trigger-text--selected' : 'select-trigger-text--placeholder'}`}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </div>
        <svg className="select-trigger-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="3">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div className="select-dropdown animate-scale-in">
          <div className="select-search-container">
            <div className="select-search-box">
              <input
                autoFocus
                className="select-search-input"
                placeholder="Escribe para buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              <svg className="select-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
          <div className="select-options-list">
            {filtered.length > 0 ? filtered.map(opt => (
              <div
                key={opt.value}
                className={`select-option ${String(value) === String(opt.value) ? 'select-option--selected' : ''}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
              >
                {opt.label}
                {String(value) === String(opt.value) && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            )) : (
              <div className="select-no-results">
                <div className="select-no-results-icon">🔍</div>
                No se encontraron resultados para "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Role permissions definitions ────────────────────────────────────────────
const ROLES = {
  admin: {
    label: 'Administrador',
    color: 'var(--accent)',
    description: 'Acceso total al sistema, reportes financieros y gestión de usuarios.',
    permissions: ['dashboard', 'agenda', 'clients', 'services', 'inventory', 'users'],
  },
  recepcion: {
    label: 'Recepción / Asistente',
    color: 'var(--primary)',
    description: 'Puede gestionar la agenda, registrar pacientes y consultar servicios. No tiene acceso a finanzas ni inventario.',
    permissions: ['agenda', 'clients', 'services'],
  },
  especialista: {
    label: 'Especialista',
    color: 'var(--secondary)',
    description: 'Solo puede ver sus citas asignadas y registrar valoraciones clínicas de sus pacientes.',
    permissions: ['agenda', 'clients'],
  },
};

const MODULE_LABELS = {
  dashboard: { id: 1, label: 'Vista General', icon: '📊' },
  agenda: { id: 2, label: 'Agenda de Citas', icon: '📅' },
  clients: { id: 3, label: 'Pacientes', icon: '👥' },
  services: { id: 4, label: 'Catálogo y Pagos', icon: '💰' },
  inventory: { id: 5, label: 'Inventario', icon: '📦' },
  users: { id: 6, label: 'Gestión de Usuarios', icon: '🔑' },
};

const RoleBadge = ({ role }) => {
  const r = ROLES[role] || { label: role, color: 'var(--text-4)' };
  return (
    <span className="role-badge" style={{ background: `${r.color}15`, color: r.color }}>
      {r.label}
    </span>
  );
};

const PermissionGrid = ({ permissions = [], onToggle }) => {
  return (
    <div className="permission-grid">
      {Object.entries(MODULE_LABELS).map(([key, { id, label, icon }]) => {
        const allowed = permissions.includes(key);
        return (
          <div
            key={key}
            className={`permission-item ${allowed ? 'permission-item--allowed' : ''}`}
            onClick={() => onToggle && onToggle(key)}
          >
            <span className="permission-item-icon">{icon}</span>
            <div className="permission-item-info">
              <span className="permission-item-label">{label}</span>
            </div>
            <div className="permission-checkbox">
              {allowed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Users({ user, tenant }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', role: 'recepcion', permissions: ROLES.recepcion.permissions, password: '', confirm: '' });
  const [formError, setFormError] = useState('');
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [permEditUser, setPermEditUser] = useState(null);
  const [permEditPerms, setPermEditPerms] = useState([]);

  const showSnack = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data: rawUsers, error } = await supabase
      .from('usuario')
      .select(`
        *,
        rolpermisos (idrol, idpermiso)
      `)
      .eq('idnegocios', tenant.id);

    if (!error && rawUsers) {
      setUsers(rawUsers.map(u => {
        const roles = u.rolpermisos?.map(rp => rp.idrol) || [];
        const permsIds = u.rolpermisos?.map(rp => rp.idpermiso) || [];

        // Reverse map permission IDs to string keys
        const permissions = permsIds.map(id =>
          Object.keys(MODULE_LABELS).find(key => MODULE_LABELS[key].id === id)
        ).filter(Boolean);

        let role = 'recepcion';
        if (roles.includes(1)) role = 'admin';
        else if (roles.includes(3)) role = 'especialista';

        return {
          id: u.idusuario,
          name: `${u.nombre} ${u.apellido}`,
          email: u.email,
          role: role,
          permissions: permissions,
          active: u.idestado === 1,
          created: u.fecharegistro ? new Date(u.fecharegistro).toLocaleDateString() : 'Desconocido'
        };
      }).sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

  const update = (k, v) => {
    setForm(f => {
      const newForm = { ...f, [k]: v };
      if (k === 'role') {
        newForm.permissions = ROLES[v]?.permissions || [];
      }
      return newForm;
    });
    setFormError('');
  };

  const togglePermission = (perm) => {
    setForm(f => {
      const perms = f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm];
      return { ...f, permissions: perms };
    });
  };

  const startEdit = (u) => {
    setForm({ name: u.name, email: u.email, role: u.role, permissions: u.permissions || [], password: '', confirm: '' });
    setEditId(u.id);
    setFormError('');
    setModalOpen(true);
  };

  const openPermEdit = (u) => {
    setPermEditUser(u);
    setPermEditPerms([...u.permissions]);
  };

  const savePermissions = async () => {
    if (!permEditUser) return;
    setSaving(true);
    const userId = permEditUser.id;
    const roleId = permEditUser.role === 'admin' ? 1 : permEditUser.role === 'especialista' ? 3 : 2;
    await supabase.from('rolpermisos').delete().eq('idusuario', userId);
    const rows = permEditPerms.map(p => ({
      idusuario: userId,
      idrol: roleId,
      idpermiso: MODULE_LABELS[p]?.id
    })).filter(r => r.idpermiso);
    if (rows.length > 0) {
      await supabase.from('rolpermisos').insert(rows);
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: permEditPerms } : u));
    showSnack('Permisos actualizados');
    setPermEditUser(null);
    setSaving(false);
  };

  const cancelEdit = (e) => {
    if (e) e.preventDefault();
    setForm({ name: '', email: '', role: 'recepcion', permissions: ROLES.recepcion.permissions, password: '', confirm: '' });
    setEditId(null);
    setFormError('');
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showSnack('⚠️ Nombre y correo son obligatorios', 'error');
      return;
    }

    if (!editId && (!form.password || form.password !== form.confirm)) {
      showSnack('⚠️ Las contraseñas no coinciden', 'error');
      return;
    }

    if (form.role === 'admin') {
      const existingAdmin = users.find(u => u.role === 'admin' && u.id !== editId);
      if (existingAdmin) {
        showSnack('⚠️ Solo se permite un administrador por negocio', 'error');
        return;
      }
    }

    setSaving(true);

    const parts = form.name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '.';
    const roleId = form.role === 'admin' ? 1 : form.role === 'recepcion' ? 2 : 3;

    const payload = {
      nombre: firstName,
      apellido: lastName,
      email: form.email,
      idnegocios: tenant.id
    };
    if (form.password) payload.password = form.password;

    try {
      let userId = editId;
      if (editId) {
        const { error: updateErr } = await supabase.from('usuario').update(payload).eq('idusuario', editId);
        if (updateErr) throw updateErr;
      } else {
        const { data: newUser, error: insertErr } = await supabase.from('usuario').insert([{ ...payload, idestado: 1 }]).select().single();
        if (insertErr) throw insertErr;
        userId = newUser.idusuario;

        const { error: authErr } = await authHelper.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { nombre: firstName, apellido: lastName, idusuario: userId, idnegocios: tenant.id }
          }
        });
        if (authErr && !authErr.message?.toLowerCase().includes('already registered')) {
          console.warn('auth.users sync:', authErr.message);
        }
      }

      await supabase.from('rolpermisos').delete().eq('idusuario', userId);

      const permissionEntries = form.permissions.map(permKey => ({
        idusuario: userId,
        idrol: roleId,
        idpermiso: MODULE_LABELS[permKey].id
      }));

      if (permissionEntries.length === 0) {
        permissionEntries.push({ idusuario: userId, idrol: roleId, idpermiso: 2 });
      }

      const { error: relErr } = await supabase.from('rolpermisos').insert(permissionEntries);
      if (relErr) throw relErr;

      await insertLog({
        accion: editId ? 'UPDATE' : 'CREATE',
        entidad: 'Usuario',
        descripcion: `${editId ? 'Se actualizaron' : 'Se crearon'} datos y permisos del usuario: ${form.name}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });

      showSnack(editId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      fetchData();
      cancelEdit();
    } catch (err) {
      console.error("Error in User handleSubmit:", err);
      showSnack('Error: ' + (err.message || 'No se pudo procesar la solicitud'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    const newStatus = u.active ? 2 : 1;
    const { error } = await supabase.from('usuario').update({ idestado: newStatus }).eq('idusuario', u.id);
    if (!error) fetchData();
  };

  const confirmDelete = (id) => {
    const u = users.find(user => user.id === id);
    if (u && u.role === 'admin') {
      alert('⚠️ Seguridad: No es posible eliminar al administrador del sistema.');
      return;
    }
    setDeleteId(id);
  };

  const doDelete = async () => {
    const target = users.find(u => u.id === deleteId);
    const { error } = await supabase.from('usuario').delete().eq('idusuario', deleteId);
    if (!error) {
      await insertLog({
        accion: 'DELETE',
        entidad: 'Usuario',
        descripcion: `Se eliminó al usuario ${target?.name || deleteId} (${target?.email || ''})`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
      showSnack('Usuario eliminado');
      fetchData();
    }
    setDeleteId(null);
  };

  return (
    <div className="users-layout">
      <div className="users-card-main animate-fade-in">
        <div className="users-header-row">
          <div className="users-header-info">
            <h2>Equipo de Trabajo</h2>
            <p>{users.length} miembros registrados en este negocio</p>
          </div>
          <button className="btn btn-primary users-add-btn" onClick={() => { setEditId(null); setModalOpen(true); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Miembro
          </button>
        </div>

        <div className="users-list">
          {loading ? (
            <div className="users-loading-box">
              <div className="spinner users-loading-spinner"></div>
              <p className="users-loading-text">Cargando equipo de trabajo...</p>
            </div>
          ) : users.length > 0 ? (
            users.map((u, idx) => {
              const isAdmin = u.role === 'admin';
              return (
                <div
                  key={u.id}
                  className={`user-item-card animate-fade-in ${isAdmin ? 'user-item-card--admin' : ''} ${!isAdmin ? 'user-item-card--clickable' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => !isAdmin && openPermEdit(u)}
                  title={!isAdmin ? 'Editar permisos' : undefined}
                >
                  {isAdmin && <div className="user-item-admin-tag">👑 CUENTA PRINCIPAL</div>}

                  <div className="user-item-avatar">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="user-item-content">
                    <div className="user-item-name-row">
                      <span className="user-item-name">{u.name}</span>
                      <RoleBadge role={u.role} />
                      {isAdmin && <span className="user-item-owner-tag">• Propietario</span>}
                    </div>
                    <div className="user-item-meta-row">
                      <span className="user-item-meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        {u.email}
                      </span>
                      <span className="user-item-meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Registrado el {u.created}
                      </span>
                    </div>
                  </div>

                  <div className="user-item-actions">
                    <div className="user-item-status-row">
                      <div onClick={e => { e.stopPropagation(); !isAdmin && toggleActive(u); }}>
                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'} user-item-status-badge`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {!isAdmin && (
                        <button
                          className="user-item-btn-perms"
                          title="Editar permisos"
                          onClick={e => { e.stopPropagation(); openPermEdit(u); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      )}
                    </div>

                    <div className="user-item-actions-group">
                      {!isAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); confirmDelete(u.id); }} className="user-item-btn-delete">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      )}
                      {isAdmin && (
                        <div className="user-item-lock-box" title="Cuenta maestra protegida">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="users-empty-state">
              <div className="users-empty-icon-box">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3>No hay miembros registrados</h3>
              <p>Empieza a construir tu equipo de trabajo agregando el primer colaborador.</p>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box modal-box--delete" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-box">
              <div className="delete-confirm-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              </div>
              <h3>¿Eliminar miembro?</h3>
              <p>Esta acción revocará todos los accesos de forma permanente. El usuario ya no podrá ingresar a la plataforma.</p>

              <div className="modal-footer-actions">
                <button className="btn btn-outline modal-footer-btn-cancel" onClick={() => setDeleteId(null)}>No, cancelar</button>
                <button className="btn btn-danger modal-footer-btn-delete" onClick={doDelete}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && cancelEdit()}>
          <div className="modal-box">
            <div className="modal-header-gradient">
              <div className="modal-header-info">
                <div className="modal-header-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /></svg>
                </div>
                <div className="modal-header-text">
                  <h3>{editId ? 'Editar Colaborador' : 'Nuevo Integrante'}</h3>
                  <p>{editId ? 'Gestión de perfil y permisos' : 'Crea una cuenta para tu equipo'}</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={cancelEdit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-scroll-area">
                {formError && (
                  <div className="modal-error-alert animate-fade-up">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {formError}
                  </div>
                )}

                <div className="input-group">
                  <label className="label-caps">Nombre Completo</label>
                  <input
                    className="input-field input-field--large"
                    placeholder="Ej. Juan Pérez"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                  />
                </div>

                <div className="grid-2">
                  <SearchableSelect
                    label="Rol / Cargo"
                    placeholder="Busca un rol..."
                    icon="🛡️"
                    options={Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label }))}
                    value={form.role}
                    onChange={val => update('role', val)}
                  />

                  <div className="input-group">
                    <label className="label-caps">Email de Acceso</label>
                    <input
                      className="input-field input-field--large"
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="label-caps">Módulos Permitidos</label>
                  <PermissionGrid permissions={form.permissions} onToggle={togglePermission} />
                </div>

                {!editId && (
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="label-caps">Contraseña</label>
                      <input type="password" placeholder="••••••••" className="input-field input-field--medium" value={form.password} onChange={e => update('password', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="label-caps">Confirmar</label>
                      <input type="password" placeholder="••••••••" className="input-field input-field--medium" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-outline modal-footer-btn-cancel" onClick={cancelEdit} disabled={saving}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary modal-footer-btn-submit">
                  {saving ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Confirmar Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {permEditUser && (
        <div className="modal-overlay" onClick={() => !saving && setPermEditUser(null)}>
          <div className="modal-box animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-gradient">
              <div className="modal-header-info">
                <div className="modal-header-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <div className="modal-header-text">
                  <h3>Permisos de Acceso</h3>
                  <p>{permEditUser.name} &nbsp;·&nbsp; <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{ROLES[permEditUser.role]?.label || permEditUser.role}</span></p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setPermEditUser(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="modal-form">
              <div className="modal-scroll-area">
                <div className="input-group">
                  <label className="label-caps">Módulos Permitidos</label>
                  <PermissionGrid
                    permissions={permEditPerms}
                    onToggle={p => setPermEditPerms(prev =>
                      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                    )}
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-outline modal-footer-btn-cancel" onClick={() => setPermEditUser(null)} disabled={saving}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary modal-footer-btn-submit" onClick={savePermissions} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Permisos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {snackbar.show && (
        <div className={`snackbar snackbar--${snackbar.type}`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
