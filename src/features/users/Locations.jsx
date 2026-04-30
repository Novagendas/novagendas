import React, { useEffect, useMemo, useState } from 'react';
import { supabase, insertLog } from '../../Supabase/supabaseClient';
import './Locations.css';

const COLOR_PRESETS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#0891b2', '#db2777', '#475569'];

export default function Locations({ user, tenant }) {
  const [locations, setLocations] = useState([]);
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [snack, setSnack] = useState(null);

  function emptyForm() {
    return { nombre: '', direccion: '', barrio: '', telefono: '', color: COLOR_PRESETS[0], idpais: '', iddepartamento: '', idciudad: '' };
  }

  const showSnack = (message, type = 'success') => {
    setSnack({ message, type });
    setTimeout(() => setSnack(null), 3000);
  };

  useEffect(() => {
    if (!tenant?.id) return;
    const load = async () => {
      setLoading(true);
      const [{ data: locs }, { data: ps }, { data: ds }, { data: cs }] = await Promise.all([
        supabase.from('ubicacion').select('*').eq('idnegocios', tenant.id).is('deleted_at', null).order('nombre'),
        supabase.from('pais').select('*').order('nombre'),
        supabase.from('departamento').select('*').order('nombre'),
        supabase.from('ciudad').select('*').order('nombre'),
      ]);
      setLocations(locs || []);
      setPaises(ps || []);
      setDepartamentos(ds || []);
      setCiudades(cs || []);
      setLoading(false);
    };
    load();
  }, [tenant]);

  const filteredDeptos = useMemo(
    () => departamentos.filter(d => !form.idpais || String(d.idpais) === String(form.idpais)),
    [departamentos, form.idpais]
  );

  const filteredCiudades = useMemo(
    () => ciudades.filter(c => !form.iddepartamento || String(c.iddepartamento) === String(form.iddepartamento)),
    [ciudades, form.iddepartamento]
  );

  const update = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'idpais') { next.iddepartamento = ''; next.idciudad = ''; }
      if (k === 'iddepartamento') { next.idciudad = ''; }
      return next;
    });
  };

  const openCreate = () => {
    const colombia = paises.find(p => p.nombre === 'Colombia');
    setEditId(null);
    setForm({ ...emptyForm(), idpais: colombia ? String(colombia.idpais) : '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (loc) => {
    const ciu = ciudades.find(c => c.idciudad === loc.idciudad);
    const dep = ciu ? departamentos.find(d => d.iddepartamento === ciu.iddepartamento) : null;
    setEditId(loc.idubicacion);
    setForm({
      nombre: loc.nombre || '',
      direccion: loc.direccion || '',
      barrio: loc.barrio || '',
      telefono: loc.telefono || '',
      color: loc.color || COLOR_PRESETS[0],
      idpais: dep ? String(dep.idpais) : '',
      iddepartamento: ciu ? String(ciu.iddepartamento) : '',
      idciudad: loc.idciudad ? String(loc.idciudad) : '',
    });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(emptyForm());
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre de la sede es obligatorio.');
      return;
    }
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || null,
      barrio: form.barrio.trim() || null,
      telefono: form.telefono.trim() || null,
      color: form.color || null,
      idciudad: form.idciudad ? Number(form.idciudad) : null,
      idnegocios: tenant.id,
    };
    let result;
    if (editId) {
      result = await supabase.from('ubicacion').update(payload).eq('idubicacion', editId).select().single();
    } else {
      result = await supabase.from('ubicacion').insert([payload]).select().single();
    }
    setSaving(false);
    if (result.error) {
      setError('No fue posible guardar: ' + result.error.message);
      return;
    }
    setLocations(prev => editId
      ? prev.map(l => l.idubicacion === editId ? result.data : l)
      : [...prev, result.data]
    );
    await insertLog({
      accion: editId ? 'UPDATE' : 'CREATE',
      entidad: 'Ubicacion',
      descripcion: `${editId ? 'Se actualizó' : 'Se creó'} la sede: ${payload.nombre}`,
      idUsuario: user.idusuario || user.id,
      idNegocios: tenant.id,
    });
    showSnack(editId ? 'Sede actualizada' : 'Sede creada');
    closeModal();
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    setSaving(true);
    const { error } = await supabase
      .from('ubicacion')
      .update({ deleted_at: new Date().toISOString() })
      .eq('idubicacion', confirmDel.idubicacion);
    setSaving(false);
    if (error) {
      showSnack('Error al eliminar: ' + error.message, 'error');
      return;
    }
    setLocations(prev => prev.filter(l => l.idubicacion !== confirmDel.idubicacion));
    await insertLog({
      accion: 'DELETE',
      entidad: 'Ubicacion',
      descripcion: `Se eliminó la sede: ${confirmDel.nombre}`,
      idUsuario: user.idusuario || user.id,
      idNegocios: tenant.id,
    });
    showSnack('Sede eliminada');
    setConfirmDel(null);
  };

  const ciudadById = (id) => ciudades.find(c => c.idciudad === id);
  const deptoById = (id) => departamentos.find(d => d.iddepartamento === id);

  return (
    <div className="card glass locations-card">
      <div className="locations-header">
        <div>
          <h2 className="profile-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Ubicaciones del negocio
          </h2>
          <p className="profile-section-sub">Gestiona las sedes donde se prestan servicios.</p>
        </div>
        <button className="btn btn-primary locations-add-btn" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar sede
        </button>
      </div>

      {loading ? (
        <div className="locations-loading">Cargando sedes…</div>
      ) : locations.length === 0 ? (
        <div className="locations-empty">
          <div className="locations-empty-icon">📍</div>
          <h4>Sin sedes registradas</h4>
          <p>Agrega tu primera sede para asignarla a las citas.</p>
        </div>
      ) : (
        <div className="locations-list">
          {locations.map(loc => {
            const ciu = ciudadById(loc.idciudad);
            const dep = ciu ? deptoById(ciu.iddepartamento) : null;
            return (
              <div key={loc.idubicacion} className="location-item">
                <span className="location-color-dot" style={{ background: loc.color || 'var(--text-4)' }} />
                <div className="location-info">
                  <div className="location-name">{loc.nombre}</div>
                  <div className="location-meta">
                    {loc.direccion && <span>📍 {loc.direccion}</span>}
                    {loc.barrio && <span>🏘️ {loc.barrio}</span>}
                    {ciu && <span>🌆 {ciu.nombre}{dep ? `, ${dep.nombre}` : ''}</span>}
                    {loc.telefono && <span>📞 {loc.telefono}</span>}
                  </div>
                </div>
                <div className="location-actions">
                  <button className="btn btn-icon location-edit-btn" onClick={() => openEdit(loc)} title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="btn btn-icon location-delete-btn" onClick={() => setConfirmDel(loc)} title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !saving && closeModal()}>
          <div className="modal-box locations-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-gradient">
              <div className="modal-header-info">
                <div className="modal-header-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className="modal-header-text">
                  <h3>{editId ? 'Editar sede' : 'Nueva sede'}</h3>
                  <p>Información de la ubicación</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={submit} className="modal-form">
              <div className="modal-scroll-area">
                {error && <div className="modal-error-alert">{error}</div>}

                <div className="input-group">
                  <label className="label-caps">Nombre de la sede *</label>
                  <input className="input-field input-field--large" placeholder="Ej. Sede Centro"
                    value={form.nombre} onChange={e => update('nombre', e.target.value)} required />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="label-caps">País</label>
                    <select className="input-field input-field--medium" value={form.idpais} onChange={e => update('idpais', e.target.value)}>
                      <option value="">Selecciona…</option>
                      {paises.map(p => <option key={p.idpais} value={p.idpais}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="label-caps">Departamento</label>
                    <select className="input-field input-field--medium" value={form.iddepartamento} onChange={e => update('iddepartamento', e.target.value)} disabled={!form.idpais}>
                      <option value="">Selecciona…</option>
                      {filteredDeptos.map(d => <option key={d.iddepartamento} value={d.iddepartamento}>{d.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="label-caps">Ciudad</label>
                  <select className="input-field input-field--medium" value={form.idciudad} onChange={e => update('idciudad', e.target.value)} disabled={!form.iddepartamento}>
                    <option value="">Selecciona…</option>
                    {filteredCiudades.map(c => <option key={c.idciudad} value={c.idciudad}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="label-caps">Dirección</label>
                  <input className="input-field input-field--medium" placeholder="Calle 10 # 5-23"
                    value={form.direccion} onChange={e => update('direccion', e.target.value)} />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="label-caps">Barrio</label>
                    <input className="input-field input-field--medium" placeholder="Centro"
                      value={form.barrio} onChange={e => update('barrio', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="label-caps">Teléfono</label>
                    <input className="input-field input-field--medium" placeholder="+57 300 000 0000"
                      value={form.telefono} onChange={e => update('telefono', e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="label-caps">Color identificador</label>
                  <div className="color-picker-row">
                    {COLOR_PRESETS.map(c => (
                      <button type="button" key={c}
                        className={`color-swatch ${form.color === c ? 'color-swatch--active' : ''}`}
                        style={{ background: c }}
                        onClick={() => update('color', c)}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-outline modal-footer-btn-cancel" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary modal-footer-btn-submit" disabled={saving}>
                  {saving ? 'Guardando…' : (editId ? 'Guardar cambios' : 'Crear sede')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal-box modal-box--delete" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-box">
              <div className="delete-confirm-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </div>
              <h3>¿Eliminar la sede "{confirmDel.nombre}"?</h3>
              <p>Las citas que la usan no se borrarán pero quedarán sin ubicación asignada.</p>
              <div className="modal-footer-actions">
                <button className="btn btn-outline modal-footer-btn-cancel" onClick={() => setConfirmDel(null)}>No, cancelar</button>
                <button className="btn btn-danger modal-footer-btn-delete" onClick={doDelete} disabled={saving}>
                  {saving ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {snack && (
        <div className={`snackbar snackbar--${snack.type}`}>{snack.message}</div>
      )}
    </div>
  );
}
