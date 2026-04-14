import React, { useState, useEffect } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';

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

const RoleBadge = ({ role }) => {
  const r = ROLES[role] || { label: role, color: 'var(--text-4)' };
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

export default function Users({ user, tenant }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  
  const [form, setForm]         = useState({ name: '', email: '', role: 'recepcion', password: '', confirm: '' });
  const [formError, setFormError] = useState('');
  const [success, setSuccess]   = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId]     = useState(null);

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('idnegocios', tenant.id);
    
    if (!error) {
      setUsers(data.map(u => ({
        id: u.idusuario,
        name: `${u.nombre} ${u.apellido}`,
        email: u.email,
        role: u.idrol === 1 ? 'admin' : u.idrol === 2 ? 'recepcion' : 'especialista',
        active: u.idestado === 1,
        created: new Date(u.fecharegistro).toLocaleDateString()
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenant]);

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
      idrol: roleId,
      idnegocios: tenant.id,
      idestado: 1
    };

    if (editId) {
      const { error } = await supabase.from('usuario').update(payload).eq('idusuario', editId);
      if (!error) {
        await insertLog({
          accion: 'UPDATE',
          entidad: 'Usuario',
          descripcion: `Se actualizaron datos del usuario: ${form.name}`,
          idUsuario: user.idusuario || user.id,
          idNegocios: tenant.id
        });
        setSuccess('✓ Usuario actualizado.');
        fetchData();
      }
    } else {
      const { error } = await supabase.from('usuario').insert([payload]);
      if (!error) {
        await insertLog({
          accion: 'CREATE',
          entidad: 'Usuario',
          descripcion: `Se creó al usuario: ${form.name} (${form.role})`,
          idUsuario: user.idusuario || user.id,
          idNegocios: tenant.id
        });
        setSuccess('✓ Usuario creado correctamente.');
        fetchData();
      }
    }
    
    setSaving(false);
    cancelEdit();
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
      <div className="flex-col gap-4" style={{ minWidth: 370, width: 370 }}>
        <div className="card flex-col gap-4">
          <h3 style={{ margin: 0 }}>{editId ? 'Editar Equipo' : 'Nuevo Miembro'}</h3>
          <form onSubmit={handleSubmit} className="flex-col gap-3">
            <input className="input-field" placeholder="Nombre" value={form.name} onChange={e => update('name', e.target.value)} />
            <input className="input-field" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} />
            <select className="input-field" value={form.role} onChange={e => update('role', e.target.value)}>
              <option value="admin">Administrador</option>
              <option value="recepcion">Recepción</option>
              <option value="especialista">Especialista</option>
            </select>
            <PermissionGrid role={form.role} />
            {!editId && <input type="password" className="input-field" placeholder="Contraseña" value={form.password} onChange={e => update('password', e.target.value)} />}
            {!editId && <input type="password" className="input-field" placeholder="Confirmar" value={form.confirm} onChange={e => update('confirm', e.target.value)} />}
            <button type="submit" disabled={saving} className="btn btn-primary w-full">{saving ? 'Guardando...' : 'Confirmar'}</button>
          </form>
        </div>
      </div>

      <div className="card w-full">
        <h3 style={{ margin: '0 0 1.25rem' }}>Equipo de Trabajo</h3>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Cargando equipo...</div>
        ) : users.length > 0 ? (
          <div className="flex-col gap-2">
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong>{u.name}</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-3)' }}>{u.email} · Registrado el {u.created}</p>
                </div>
                <RoleBadge role={u.role} />
                <span onClick={() => toggleActive(u)} className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer' }}>{u.active ? 'Activo' : 'Inactivo'}</span>
                <button onClick={() => startEdit(u)} className="btn btn-ghost">Editar</button>
                <button onClick={() => confirmDelete(u.id)} className="btn btn-ghost text-danger">Borrar</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            <p style={{ margin: 0, color: 'var(--text-4)', fontWeight: 600 }}>No hay más usuarios registrados en este negocio.</p>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>¿Eliminar cuenta?</h3>
            <div className="flex gap-2">
              <button className="btn" onClick={() => setDeleteId(null)}>No</button>
              <button className="btn btn-danger" onClick={doDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
