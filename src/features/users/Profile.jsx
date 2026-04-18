import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';

const CustomAlert = ({ message, type, onClose }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className="animate-fade-up" style={{
      padding: '1rem 1.25rem', marginBottom: '1.5rem',
      borderRadius: 'var(--radius-sm)',
      background: isError ? 'var(--danger-light)' : 'var(--success-light)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
      color: isError ? 'var(--danger)' : 'var(--success)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isError ? '⚠️' : '✓'} {message}
      </div>
      <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
    </div>
  );
};

export default function Profile({ user }) {
  const [profileData, setProfileData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    cedula: '',
  });

  const [passwords, setPasswords] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });
  
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

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
        fechaactualizacion: new Date().toISOString()
      })
      .eq('idusuario', user?.idusuario || user?.id);
    
    setSaving(false);
    if (error) {
      setAlert({ type: 'error', message: 'Error al actualizar base de datos: ' + error.message });
    } else {
      setAlert({ type: 'success', message: '¡Información de perfil actualizada!' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.actual || !passwords.nueva || !passwords.confirmar) {
      setAlert({ type: 'error', message: 'Todos los campos de contraseña son obligatorios.' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setAlert({ type: 'error', message: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }
    if (passwords.nueva.length < 6) {
      setAlert({ type: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setChangingPass(true);
    setAlert(null);

    const { data, error } = await supabase.rpc('validar_cambio_password', {
      p_idusuario: user?.idusuario || user?.id,
      p_password_actual: passwords.actual,
      p_password_nuevo: passwords.nueva
    });

    setChangingPass(false);

    if (error) {
      setAlert({ type: 'error', message: 'Error en el servidor: ' + error.message });
    } else if (data && !data.success) {
      setAlert({ type: 'error', message: data.message });
    } else {
      setAlert({ type: 'success', message: '¡Contraseña actualizada correctamente!' });
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('novagendas_user');
    window.location.reload();
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)' }}>Cargando datos del perfil...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Col: Avatar & Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card flex-col" style={{ alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', margin: '0 0 2rem', fontWeight: 800, width: '100%' }}>Identidad</h2>
            
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '3rem',
                boxShadow: '0 8px 24px var(--primary-light)', border: '4px solid var(--surface)'
              }}>
                {profileData.nombre?.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem' }}>{profileData.nombre} {profileData.apellido}</h3>
            <span style={{ 
              display: 'inline-block', marginBottom: '0.75rem',
              padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary)',
              borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {user?.role}
            </span>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-3)', fontWeight: 500, fontSize: '0.9rem' }}>{profileData.email}</p>
            
            <div className="sep" style={{ width: '100%' }} />
            <button type="button" className="btn btn-ghost" onClick={handleLogout} style={{ width: '100%', color: 'var(--danger)', marginTop: '0.5rem' }}>Cerrar Sesión</button>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.4rem', margin: '0 0 1.5rem', fontWeight: 800 }}>Seguridad</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>Actualiza tus credenciales verificando tu identidad actual.</p>
            
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label>Contraseña Actual</label>
                <input type="password" placeholder="••••••••" className="input-field" value={passwords.actual} onChange={e => handlePassChange('actual', e.target.value)} required />
              </div>
              <div className="sep" />
              <div className="input-group">
                <label>Nueva Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" className="input-field" value={passwords.nueva} onChange={e => handlePassChange('nueva', e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Confirmar Nueva Contraseña</label>
                <input type="password" placeholder="Repite la nueva contraseña" className="input-field" value={passwords.confirmar} onChange={e => handlePassChange('confirmar', e.target.value)} required />
              </div>
              
              <button type="submit" disabled={changingPass} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {changingPass ? 'Verificando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Personal Info */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 2rem', fontWeight: 800 }}>Información Personal</h2>
          
          <CustomAlert message={alert?.message} type={alert?.type} onClose={() => setAlert(null)} />

          <form onSubmit={handleSaveInfo} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Nombres <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" className="input-field" required value={profileData.nombre} onChange={e => handleChange('nombre', e.target.value)} />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Apellidos</label>
                <input type="text" className="input-field" value={profileData.apellido} onChange={e => handleChange('apellido', e.target.value)} />
              </div>
            </div>

            <div className="input-group">
              <label>Correo Electrónico <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="email" className="input-field" required value={profileData.email} onChange={e => handleChange('email', e.target.value)} />
            </div>

            <div className="input-group">
              <label>Cédula de Identidad</label>
              <input 
                type="text" 
                className="input-field" 
                value={profileData.cedula} 
                readOnly 
                style={{ backgroundColor: 'var(--surface-2)', cursor: 'not-allowed', color: 'var(--text-4)' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
