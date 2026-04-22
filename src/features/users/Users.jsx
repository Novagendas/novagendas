import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

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
    <div className="input-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--surface)',
          border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: '16px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 4px var(--primary-light)' : 'var(--shadow-sm)'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <div style={{ flex: 1, color: selectedOpt ? 'var(--text)' : 'var(--text-5)', fontWeight: selectedOpt ? 700 : 500, fontSize: '0.95rem' }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="3" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>

      {isOpen && (
        <div className="animate-scale-in" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          marginTop: '0.6rem',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 2000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <input
                autoFocus
                className="input-field"
                placeholder="Escribe para buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.9rem', borderRadius: '12px', border: '1.5px solid var(--border-strong)', background: 'var(--surface)' }}
              />
              <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filtered.length > 0 ? filtered.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                style={{
                  padding: '0.9rem 1.25rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: String(value) === String(opt.value) ? 'var(--primary-light)' : 'transparent',
                  color: String(value) === String(opt.value) ? 'var(--primary)' : 'var(--text-2)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={e => e.currentTarget.style.background = String(value) === String(opt.value) ? 'var(--primary-light)' : 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = String(value) === String(opt.value) ? 'var(--primary-light)' : 'transparent'}
              >
                {opt.label}
                {String(value) === String(opt.value) && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            )) : (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-4)', fontWeight: 500 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: `${r.color}15`, color: r.color }}>
      {r.label}
    </span>
  );
};

const PermissionGrid = ({ permissions = [], onToggle }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
      {Object.entries(MODULE_LABELS).map(([key, { id, label, icon }]) => {
        const allowed = permissions.includes(key);
        return (
          <div
            key={key}
            onClick={() => onToggle && onToggle(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '16px',
              background: allowed ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface)',
              border: `1.5px solid ${allowed ? 'var(--success)' : 'var(--border)'}`,
              cursor: onToggle ? 'pointer' : 'default',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: allowed ? '0 4px 12px rgba(16, 185, 129, 0.1)' : 'var(--shadow-xs)',
              minWidth: 0
            }}
          >
            <span style={{ fontSize: '1rem', filter: allowed ? 'none' : 'grayscale(1)' }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: allowed ? 'var(--text)' : 'var(--text-4)', lineHeight: 1.2 }}>{label}</span>
            </div>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '6px',
              border: `2px solid ${allowed ? 'var(--success)' : 'var(--border-strong)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: allowed ? 'var(--success)' : 'transparent',
              transition: 'all 0.2s',
              flexShrink: 0
            }}>
              {allowed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
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
  const [deleteError, setDeleteError] = useState('');
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
        rolpermisos (idrol)
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
      // If role changes, reset permissions to defaults
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

    // Validar un solo administrador
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

    // Build Clean Payload
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

        // Registrar en auth.users para habilitar recuperación de contraseña por correo.
        // Se usa un cliente sin persistSession para no afectar la sesión del administrador.
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

      // Sync Role and Permissions
      // 1. Delete existing permissions for this user
      await supabase.from('rolpermisos').delete().eq('idusuario', userId);

      // 2. Prepare new permission entries
      const permissionEntries = form.permissions.map(permKey => ({
        idusuario: userId,
        idrol: roleId,
        idpermiso: MODULE_LABELS[permKey].id
      }));

      // Default permission if none selected (e.g. at least see Agenda)
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
    // Obtener email antes de borrar para limpiar auth.users
    const target = users.find(u => u.id === deleteId);

    const { error } = await supabase.from('usuario').delete().eq('idusuario', deleteId);
    if (!error) {
      // Intentar eliminar de auth.users usando signIn para obtener uid y luego borrar la sesión
      // Nota: sin service_role key no podemos borrar de auth.users directamente desde frontend.
      // El usuario quedará en auth.users inactivo — no es un problema de seguridad ya que
      // su entrada en usuario fue eliminada y el login custom la valida.
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
    <div className="flex gap-4" style={{ alignItems: 'flex-start', minHeight: '80vh' }}>

      <div className="card w-full animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Equipo de Trabajo</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-4)', fontWeight: 500 }}>{users.length} miembros registrados en este negocio</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditId(null); setModalOpen(true); }} style={{ boxShadow: '0 8px 24px var(--primary-light)', padding: '0.75rem 1.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Nuevo Miembro
          </button>
        </div>

        <div style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ padding: '6rem 0', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
              <p style={{ color: 'var(--text-4)', fontWeight: 600 }}>Cargando equipo de trabajo...</p>
            </div>
          ) : users.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {users.map((u, idx) => {
                const isAdmin = u.role === 'admin';
                return (
                  <div key={u.id} className="animate-fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    background: isAdmin ? 'var(--primary-light)' : 'var(--surface)',
                    border: isAdmin ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '24px',
                    transition: 'all-delay 0.3s ease',
                    animationDelay: `${idx * 50}ms`,
                    position: 'relative',
                    boxShadow: isAdmin ? '0 10px 25px -5px var(--primary-light)' : 'none'
                  }}
                    onMouseEnter={e => { 
                      if (!isAdmin) e.currentTarget.style.borderColor = 'var(--primary)'; 
                      e.currentTarget.style.transform = 'translateY(-2px)'; 
                      e.currentTarget.style.boxShadow = isAdmin ? '0 15px 30px -5px var(--primary-light)' : 'var(--shadow-md)'; 
                    }}
                    onMouseLeave={e => { 
                      if (!isAdmin) e.currentTarget.style.borderColor = 'var(--border)'; 
                      e.currentTarget.style.transform = 'none'; 
                      e.currentTarget.style.boxShadow = isAdmin ? '0 10px 25px -5px var(--primary-light)' : 'none'; 
                    }}
                  >
                    {isAdmin && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '-12px', 
                        right: '24px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', 
                        color: '#fff', 
                        padding: '4px 14px', 
                        borderRadius: '12px', 
                        fontSize: '0.65rem', 
                        fontWeight: 900, 
                        boxShadow: '0 4px 12px var(--primary-light)',
                        letterSpacing: '0.05em'
                      }}>
                        👑 CUENTA PRINCIPAL
                      </div>
                    )}

                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: isAdmin ? 'var(--primary)' : 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: isAdmin ? '#fff' : 'var(--primary)',
                      border: isAdmin ? 'none' : '1px solid var(--border)',
                      boxShadow: isAdmin ? '0 4px 12px var(--primary-light)' : 'none'
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.1rem' }}>{u.name}</span>
                        <RoleBadge role={u.role} />
                        {isAdmin && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>• Propietario</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                          {u.email}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          Registrado el {u.created}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div onClick={() => !isAdmin && toggleActive(u)} style={{ cursor: isAdmin ? 'default' : 'pointer' }}>
                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '12px', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Edit button removed for all users as requested */}
                        {!isAdmin && (
                          <button onClick={() => confirmDelete(u.id)} className="btn btn-ghost btn-icon" style={{ width: '42px', height: '42px', borderRadius: '14px', color: 'var(--danger)', background: 'var(--danger-light)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        )}
                        {isAdmin && (
                          <div title="Cuenta maestra protegida" style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', opacity: 0.5 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '6rem 2rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '24px', border: '2px dashed var(--border)' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-2)', fontWeight: 800 }}>No hay miembros registrados</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-4)', fontSize: '0.9rem' }}>Empieza a construir tu equipo de trabajo agregando el primer colaborador.</p>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 24px var(--danger-light)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              </div>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>¿Eliminar miembro?</h3>
              <p style={{ color: 'var(--text-4)', fontSize: '0.95rem', marginBottom: '2.25rem', lineHeight: 1.5, fontWeight: 500 }}>Esta acción revocará todos los accesos de forma permanente. El usuario ya no podrá ingresar a la plataforma.</p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', height: '52px' }} onClick={() => setDeleteId(null)}>No, cancelar</button>
                <button className="btn btn-danger" style={{ flex: 1, borderRadius: '16px', height: '52px', background: 'var(--danger)', boxShadow: '0 8px 20px var(--danger-light)', fontWeight: 800 }} onClick={doDelete}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => !saving && e.target === e.currentTarget && cancelEdit()}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            {/* Professional Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', padding: '2rem 2rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{editId ? 'Editar Colaborador' : 'Nuevo Integrante'}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{editId ? 'Gestión de perfil y permisos' : 'Crea una cuenta para tu equipo'}</p>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={cancelEdit} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', width: '38px', height: '38px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--surface)' }}>
              <div className="modal-scroll-area" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formError && (
                  <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.85rem 1.25rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {formError}
                  </div>
                )}

                <div className="input-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Nombre Completo</label>
                  <input
                    className="input-field"
                    placeholder="Ej. Juan Pérez"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    style={{ borderRadius: '16px', height: '54px', border: '1.5px solid var(--border-strong)', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <SearchableSelect
                    label="Rol / Cargo"
                    placeholder="Busca un rol..."
                    icon="🛡️"
                    options={Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label }))}
                    value={form.role}
                    onChange={val => update('role', val)}
                  />

                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Email de Acceso</label>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      required
                      style={{ borderRadius: '16px', height: '54px', border: '1.5px solid var(--border-strong)', fontWeight: 600 }}
                    />
                  </div>
                </div>



                {!editId && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="input-group">
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Contraseña</label>
                      <input type="password" placeholder="••••••••" className="input-field" value={form.password} onChange={e => update('password', e.target.value)} style={{ borderRadius: '16px', height: '52px', border: '1.5px solid var(--border-strong)' }} />
                    </div>
                    <div className="input-group">
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Confirmar</label>
                      <input type="password" placeholder="••••••••" className="input-field" value={form.confirm} onChange={e => update('confirm', e.target.value)} style={{ borderRadius: '16px', height: '52px', border: '1.5px solid var(--border-strong)' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--surface)' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', height: '52px' }} onClick={cancelEdit} disabled={saving}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2, borderRadius: '16px', height: '52px', fontWeight: 800, fontSize: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }}>
                  {saving ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Confirmar Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Snackbar */}
      {snackbar.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, background: snackbar.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontWeight: 700, animation: 'slideInBottom 0.3s ease-out' }}>
          <style>{`
            @keyframes slideInBottom { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
