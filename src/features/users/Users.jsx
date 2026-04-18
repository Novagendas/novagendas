import React, { useState, useEffect, useRef } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

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
              <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
  dashboard: { id: 1, label: 'Dashboard General', icon: '📊' },
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
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
          created: new Date(u.fecharegistro).toLocaleDateString()
        };
      }));
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
    setSuccess(''); 
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
    setSuccess('');
    setModalOpen(true);
  };

  const cancelEdit = (e) => {
    if (e) e.preventDefault();
    setForm({ name: '', email: '', role: 'recepcion', permissions: ROLES.recepcion.permissions, password: '', confirm: '' });
    setEditId(null);
    setFormError('');
    setSuccess('');
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return setFormError('Nombre y correo son obligatorios.');
    if (!editId && (!form.password || form.password !== form.confirm)) return setFormError('Las contraseñas no coinciden.');
    setSaving(true);

    const parts = form.name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '.';
    const roleId = form.role === 'admin' ? 1 : form.role === 'recepcion' ? 2 : 3;

    const payload = {
      nombre: firstName,
      apellido: lastName,
      email: form.email,
      'password': form.password || undefined,
      idnegocios: tenant.id,
      idestado: 1
    };

    try {
      let userId = editId;
      if (editId) {
        const { error } = await supabase.from('usuario').update(payload).eq('idusuario', editId);
        if (error) throw error;
      } else {
        const { data: newUser, error } = await supabase.from('usuario').insert([payload]).select().single();
        if (error) throw error;
        userId = newUser.idusuario;
      }

      // Sync Role and Permissions
      // 1. Delete existing permissions
      await supabase.from('rolpermisos').delete().eq('idusuario', userId);

      // 2. Insert new ones
      const permissionEntries = form.permissions.map(permKey => ({
        idusuario: userId,
        idrol: roleId,
        idpermiso: MODULE_LABELS[permKey].id
      }));

      // If no permissions selected, at least keep the role record? 
      // Actually, standard practice is to have at least one entry for the role.
      if (permissionEntries.length === 0) {
        permissionEntries.push({ idusuario: userId, idrol: roleId, idpermiso: 2 }); // Default to Agenda if nothing else
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
      
      setSuccess(editId ? '✓ Usuario actualizado.' : '✓ Usuario creado correctamente.');
      fetchData();
      cancelEdit();
    } catch (err) {
      setFormError('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    const newStatus = u.active ? 2 : 1;
    const { error } = await supabase.from('usuario').update({ idestado: newStatus }).eq('idusuario', u.id);
    if (!error) fetchData();
  };

  const confirmDelete = (id) => setDeleteId(id);
  const doDelete = async () => {
    const { error } = await supabase.from('usuario').delete().eq('idusuario', deleteId);
    if (!error) {
      await insertLog({
        accion: 'DELETE',
        entidad: 'Usuario',
        descripcion: `Se eliminó al usuario con ID ${deleteId}`,
        idUsuario: user.idusuario || user.id,
        idNegocios: tenant.id
      });
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
              {users.map((u, idx) => (
                <div key={u.id} className="animate-fade-in" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  animationDelay: `${idx * 50}ms`
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    border: '1px solid var(--border)'
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.05rem' }}>{u.name}</span>
                      <RoleBadge role={u.role} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        {u.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Desde {u.created}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div onClick={() => toggleActive(u)} style={{ cursor: 'pointer' }}>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: '10px', padding: '0.4rem 0.8rem' }}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => startEdit(u)} className="btn btn-ghost btn-icon" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => confirmDelete(u.id)} className="btn btn-ghost btn-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', color: 'var(--danger)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

                <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '24px', border: '1.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Módulos Habilitados</label>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>PERMISOS DINÁMICOS</span>
                  </div>
                  <PermissionGrid permissions={form.permissions} onToggle={togglePermission} />
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
    </div>
  );
}
