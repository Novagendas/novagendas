import React, { useState } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

export default function Login({ tenant, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Credenciales inválidas.');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg(`Incluye un signo "@" en la dirección de correo electrónico. La dirección "${email}" no incluye el signo "@".`);
      setError(true);
      return;
    }
    if (!password) {
      setErrorMsg('Por favor ingresa tu contraseña.');
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      if (!tenant || !tenant.id) {
        setErrorMsg('Negocio no identificado.');
        setError(true);
        setLoading(false);
        return;
      }

      const { data: users, error: dbErr } = await supabase.rpc('login_usuario', {
        p_email: email,
        p_password: password,
        p_idnegocios: tenant.id
      });

      if (!dbErr && users && users.length > 0) {
        const u = users[0];
        let role = 'recepcion';
        if (u.rol_nombre === 'admin') role = 'admin';
        else if (u.rol_nombre === 'profesional') role = 'especialista';
        else if (u.rol_nombre === 'recepcionista' || u.rol_nombre === 'ayudante' || u.rol_nombre === 'asistente') role = 'recepcion';

        onLogin({
          id: u.idusuario,
          name: u.nombre + ' ' + u.apellido,
          email: u.email,
          role: role
        });
        return;
      } else {
        setErrorMsg('Credenciales inválidas.');
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg('Error de conexión.');
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-subtle)', padding: '2rem', position: 'relative'
    }}>
      <ParticleBackground />
      <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />
      <div
        className="animate-fade-up"
        style={{
          width: '100%', maxWidth: '400px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius)',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            overflow: 'hidden'
          }}>
            <img src="/logoclaro.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.parentElement.innerHTML = '<span style="color:#fff;font-weight:700;font-size:1.1rem">NA</span>'} />
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            Bienvenido
          </h2>
          <p style={{ color: 'var(--text-4)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {tenant?.name || 'Acceso Administrativo'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '1.5rem', padding: '0.75rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@empresa.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(false); }}
              required
            />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Contraseña</label>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)'
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.75rem' }}
          >
            {loading ? (
              <div className="spinner" />
            ) : 'Iniciar Sesión'}
          </button>
        </form>
      </div>

      <p style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>
        NovaAgendas © {new Date().getFullYear()}
      </p>
    </div>
  );
}
