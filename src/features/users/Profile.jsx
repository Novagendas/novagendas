import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import Locations from './Locations';
import './Profile.css';

const CustomAlert = ({ message, type, onClose }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`profile-alert profile-alert--${isError ? 'error' : 'success'} animate-fade-in`}>
      <div className="profile-alert-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {isError ? (
            <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
          ) : (
            <><polyline points="20 6 9 17 4 12" /></>
          )}
        </svg>
        <span>{message}</span>
      </div>
      <button type="button" className="profile-alert-close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
};

const AccordionCard = ({ title, icon, open, onToggle, children }) => (
  <div className="accordion-card glass">
    <div className="accordion-header" onClick={onToggle}>
      <div className="accordion-title-wrapper">
        <div className="accordion-icon">{icon}</div>
        <h2 className="accordion-title">{title}</h2>
      </div>
      <svg className="accordion-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: `rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.3s ease' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
    {open && (
      <div className="accordion-body">
        {children}
      </div>
    )}
  </div>
);

export default function Profile({ user, tenant, onUserUpdate }) {
  const [profileData, setProfileData] = useState({ nombre: '', apellido: '', email: '', cedula: '' });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [openSections, setOpenSections] = useState({ intro: true, info: true, locations: false, security: false });

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('idusuario', user?.idusuario || user?.id)
        .single();
      if (data && !error) {
        setProfileData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          email: data.email || '',
          cedula: data.cedula || '',
        });
      }
      setLoading(false);
    };
    if (user) fetchUser();
  }, [user]);

  const handleChange = (k, v) => setProfileData(p => ({ ...p, [k]: v }));
  const handlePassChange = (k, v) => setPasswords(p => ({ ...p, [k]: v }));

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!profileData.nombre || !profileData.email) {
      setAlert({ type: 'error', message: 'El nombre y correo son obligatorios.' });
      return;
    }
    setSaving(true);
    setAlert(null);
    const { error } = await supabase
      .from('usuario')
      .update({
        nombre: profileData.nombre,
        apellido: profileData.apellido,
        email: profileData.email,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq('idusuario', user?.idusuario || user?.id);
    setSaving(false);
    if (error) {
      setAlert({ type: 'error', message: 'Error al actualizar: ' + error.message });
    } else {
      setAlert({ type: 'success', message: '¡Información actualizada!' });
      if (onUserUpdate) onUserUpdate({ name: profileData.nombre + ' ' + profileData.apellido, email: profileData.email });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.actual || !passwords.nueva || !passwords.confirmar) {
      setAlert({ type: 'error', message: 'Todos los campos son obligatorios.' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setAlert({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }
    if (passwords.nueva.length < 6) {
      setAlert({ type: 'error', message: 'Mínimo 6 caracteres.' });
      return;
    }
    setChangingPass(true);
    setAlert(null);
    const { data, error } = await supabase.rpc('validar_cambio_password', {
      p_idusuario: user?.idusuario || user?.id,
      p_password_actual: passwords.actual,
      p_password_nuevo: passwords.nueva,
    });
    setChangingPass(false);
    if (error) {
      setAlert({ type: 'error', message: 'Error: ' + error.message });
    } else if (data && !data.success) {
      setAlert({ type: 'error', message: data.message });
    } else {
      setAlert({ type: 'success', message: '¡Contraseña actualizada!' });
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('novagendas_user');
    window.location.reload();
  };

  if (loading) return (
    <div className="profile-loading animate-fade-in">
      <div className="skeleton profile-skeleton-avatar" />
      <p>Cargando perfil...</p>
    </div>
  );

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-column">

        {/* Card 1: Mi Perfil (collapsible) */}
        <AccordionCard
          title="Mi Perfil"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>}
          open={openSections.intro}
          onToggle={() => setOpenSections(s => ({ ...s, intro: !s.intro }))}
        >
          <div className="profile-card-intro">
            <div className="profile-avatar-large">
              {profileData.nombre?.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="profile-display-name">{profileData.nombre} {profileData.apellido}</h3>
            <div className="profile-role-badge">{user?.role}</div>
            <p className="profile-email-text">{profileData.email}</p>
            <button type="button" className="btn btn-outline profile-logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Cerrar Sesión
            </button>
          </div>
        </AccordionCard>

        {/* Card 2: Información Personal (expandible) */}
        <AccordionCard
          title="Información Personal"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
          open={openSections.info}
          onToggle={() => setOpenSections(s => ({ ...s, info: !s.info }))}
        >
          <CustomAlert message={alert?.message} type={alert?.type} onClose={() => setAlert(null)} />
          <form onSubmit={handleSaveInfo} noValidate className="profile-form">
            <div className="profile-name-row">
              <div className="input-group">
                <label>Nombres <span className="required-star">*</span></label>
                <input type="text" className="input-field capitalize-text" required value={profileData.nombre} onChange={e => handleChange('nombre', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Apellidos</label>
                <input type="text" className="input-field capitalize-text" value={profileData.apellido} onChange={e => handleChange('apellido', e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label>Correo Electrónico <span className="required-star">*</span></label>
              <input type="email" className="input-field" required value={profileData.email} onChange={e => handleChange('email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Cédula (Bloqueado)</label>
              <div className="profile-readonly-container">
                <input type="text" className="input-field profile-readonly-field" value={profileData.cedula} readOnly />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary profile-update-btn">
              {saving ? 'Guardando...' : 'Actualizar Perfil'}
            </button>
          </form>
        </AccordionCard>

        {/* Card 3: Ubicaciones (solo admin, expandible) */}
        {user?.role === 'admin' && tenant?.id && (
          <AccordionCard
            title="Ubicaciones del Negocio"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
            open={openSections.locations}
            onToggle={() => setOpenSections(s => ({ ...s, locations: !s.locations }))}
          >
            <Locations user={user} tenant={tenant} />
          </AccordionCard>
        )}

        {/* Card 4: Seguridad / Contraseña (expandible) */}
        <AccordionCard
          title="Seguridad"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
          open={openSections.security}
          onToggle={() => setOpenSections(s => ({ ...s, security: !s.security }))}
        >
          <p className="profile-section-sub">Actualiza tus credenciales verificando tu identidad actual.</p>
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="input-group">
              <label>Contraseña Actual</label>
              <input type="password" placeholder="••••••••" className="input-field" value={passwords.actual} onChange={e => handlePassChange('actual', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Nueva Contraseña</label>
              <input type="password" placeholder="Mínimo 6 caracteres" className="input-field" value={passwords.nueva} onChange={e => handlePassChange('nueva', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Confirmar Nueva Contraseña</label>
              <input type="password" placeholder="Repite la nueva contraseña" className="input-field" value={passwords.confirmar} onChange={e => handlePassChange('confirmar', e.target.value)} required />
            </div>
            <button type="submit" disabled={changingPass} className="btn btn-secondary profile-submit-btn">
              {changingPass ? 'Procesando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </AccordionCard>

      </div>
    </div>
  );
}
