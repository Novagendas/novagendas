import React, { useState } from 'react';

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
  dashboard: { label: 'Dashboard General', icon: '📊' },
  agenda:    { label: 'Agenda de Citas',   icon: '📅' },
  clients:   { label: 'Pacientes',          icon: '👥' },
  services:  { label: 'Catálogo y Pagos',  icon: '💰' },
  inventory: { label: 'Inventario',         icon: '📦' },
  users:     { label: 'Gestión de Usuarios',icon: '🔑' },
};

// ─── Mock existing employees ──────────────────────────────────────────────────
const INIT_USERS = [
  { id: 1, name: 'Dra. Fabiola Rodríguez', email: 'fabiola@soleil.com', role: 'especialista', active: true,  created: '15 Ene 2026' },
  { id: 2, name: 'Karen Useche',           email: 'karen@soleil.com',   role: 'recepcion',    active: true,  created: '20 Feb 2026' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const r = ROLES[role];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: `${r.color}15`, color: r.color }}>
      {r.label}
    </span>
  );
};

const PermissionGrid = ({ role }) => {
  const perms = ROLES[role]?.permissions || [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
      {Object.entries(MODULE_LABELS).map(([key, { label, icon }]) => {
        const allowed = perms.includes(key);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: 8, background: allowed ? 'var(--success-light)' : 'var(--surface-2)', border: `1px solid ${allowed ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
            <span style={{ fontSize: '0.85rem' }}>{icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: allowed ? 'var(--success)' : 'var(--text-3)', flex: 1 }}>{label}</span>
            {allowed
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Users() {
  const [users, setUsers]       = useState(INIT_USERS);
  const [form, setForm]         = useState({ name: '', email: '', role: 'recepcion', password: '', confirm: '' });
  const [formError, setFormError] = useState('');
  const [success, setSuccess]   = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId]     = useState(null);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormError(''); setSuccess(''); };

  const startEdit = (u) => {
    setForm({ name: u.name, email: u.email, role: u.role, password: '', confirm: '' });
    setEditId(u.id);
    setFormError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setForm({ name: '', email: '', role: 'recepcion', password: '', confirm: '' });
    setEditId(null);
    setFormError('');
    setSuccess('');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return setFormError('Nombre y correo son obligatorios.');
    if (!editId && (!form.password || form.password !== form.confirm)) return setFormError('Las contraseñas no coinciden o están vacías.');
    if (form.password && form.password.length < 4) return setFormError('La contraseña debe tener al menos 4 caracteres.');
    
    // Evitar correos duplicados, omitiendo el usuario actual en edición
    if (users.find(u => u.email === form.email && u.id !== editId)) return setFormError('Ya existe un usuario con ese correo.');

    if (editId) {
      setUsers(prev => prev.map(u => u.id === editId ? { ...u, name: form.name, email: form.email, role: form.role } : u));
      setSuccess(`✓ Cuenta de ${form.name} actualizada.`);
    } else {
      setUsers(prev => [...prev, { id: Date.now(), name: form.name, email: form.email, role: form.role, active: true, created: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }]);
      setSuccess(`✓ Cuenta creada para ${form.name} correctamente.`);
    }
    
    setForm({ name: '', email: '', role: 'recepcion', password: '', confirm: '' });
    setEditId(null);
  };

  const toggleActive = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  const confirmDelete = (id) => setDeleteId(id);
  const doDelete = () => { setUsers(prev => prev.filter(u => u.id !== deleteId)); setDeleteId(null); };

  return (
    <div className="flex gap-4" style={{ alignItems: 'flex-start', minHeight: '80vh' }}>

      {/* ── LEFT: Create Form ── */}
      <div className="flex-col gap-4" style={{ minWidth: 370, width: 370 }}>
        <div className="card flex-col gap-4">
          <div>
            <h3 style={{ margin: 0 }}>{editId ? 'Editar Empleado' : 'Crear Cuenta de Empleado'}</h3>
            <p className="text-sm mt-1">Los accesos se limitan automáticamente según el rol asignado.</p>
          </div>

          {formError && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-sm" style={{ color: 'var(--danger)', margin: 0 }}>{formError}</p>
            </div>
          )}
          {success && (
            <div style={{ background: 'var(--success-light)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-sm" style={{ color: 'var(--success)', margin: 0 }}>{success}</p>
            </div>
          )}

          <form onSubmit={handleCreate} className="flex-col gap-3">
            <div className="input-group">
              <label>Nombre Completo</label>
              <input className="input-field" placeholder="Ej. Karen Useche" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input type="email" className="input-field" placeholder="empleado@soleil.com" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Rol del Empleado</label>
              <select className="input-field" value={form.role} onChange={e => update('role', e.target.value)}>
                <option value="recepcion">Recepción / Asistente</option>
                <option value="especialista">Especialista</option>
              </select>
            </div>

            {/* Live Permission Preview */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
              <p className="text-sm" style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.25rem' }}>
                Accesos para: <span style={{ color: ROLES[form.role].color }}>{ROLES[form.role].label}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '0.5rem' }}>{ROLES[form.role].description}</p>
              <PermissionGrid role={form.role} />
            </div>

            <div className="input-group">
              <label>{editId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}</label>
              <input type="password" className="input-field" placeholder="Mínimo 4 caracteres" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Confirmar Contraseña</label>
              <input type="password" className="input-field" placeholder="Repetir contraseña" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {editId && (
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                {editId ? (
                  <>Guardar Cambios</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  Crear Cuenta de Empleado</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── RIGHT: User List ── */}
      <div className="card w-full">
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Equipo de Trabajo</h3>
            <p className="text-sm mt-1">{users.length} cuentas registradas en el sistema</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none', width: 180 }} placeholder="Buscar empleado..." />
          </div>
        </div>

        {/* Admin Row (locked) */}
        <div style={{ borderRadius: 12, border: '1.5px solid var(--border)', marginBottom: '0.75rem', overflow: 'hidden' }}>
          <div className="flex items-center gap-4" style={{ padding: '1rem 1.25rem', background: 'var(--surface-2)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>AD</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>Administrador</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>admin@soleil.com</p>
            </div>
            <RoleBadge role="admin" />
            <span className="badge badge-success">Activo</span>
            <div style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-3)' }}>🔒 No editable</div>
          </div>
        </div>

        {/* Employee Rows */}
        <div className="flex-col gap-2">
          {users.map(u => (
            <div key={u.id} style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', transition: 'var(--transition)' }}>
              <div className="flex items-center gap-4" style={{ padding: '1rem 1.25rem' }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ROLES[u.role].color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLES[u.role].color, fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: u.active ? 'var(--text)' : 'var(--text-3)', textDecoration: u.active ? 'none' : 'line-through' }}>{u.name}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>{u.email} · Creado: {u.created}</p>
                </div>
                {/* Role */}
                <RoleBadge role={u.role} />
                {/* Status */}
                <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer' }} onClick={() => toggleActive(u.id)} title="Clic para activar/desactivar">
                  {u.active ? 'Activo' : 'Inactivo'}
                </span>
                
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {/* Edit */}
                  <button className="btn btn-ghost btn-icon" onClick={() => startEdit(u)} title="Editar empleado" style={{ color: 'var(--primary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  {/* Delete */}
                  <button className="btn btn-ghost btn-icon" onClick={() => confirmDelete(u.id)} title="Eliminar cuenta" style={{ color: 'var(--danger)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>

              {/* Permission Summary Bar */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '0.7rem 1.25rem', background: 'var(--surface-2)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <p className="text-xs" style={{ color: 'var(--text-3)', fontWeight: 600, marginRight: '0.25rem' }}>Accesos:</p>
                {ROLES[u.role].permissions.map(p => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 6, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {MODULE_LABELS[p]?.icon} {MODULE_LABELS[p]?.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
            <p>No hay empleados registrados aún. Crea la primera cuenta aquí.</p>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-scale-in" style={{ maxWidth: 380, width: '90%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem' }}>¿Eliminar esta cuenta?</h3>
            <p className="text-sm" style={{ marginBottom: '1.5rem' }}>Esta acción es irreversible. El empleado perderá todo acceso al sistema.</p>
            <div className="flex gap-3 justify-center">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={doDelete}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
