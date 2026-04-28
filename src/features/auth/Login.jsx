import React, { useState } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './Auth.css';

export default function Login({ tenant, onLogin, onForgotPassword }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(false);
  const [errorMsg, setErrorMsg] = useState('Credenciales inválidas.');
  const [loading,  setLoading]  = useState(false);
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

        onLogin({ id: u.idusuario, name: u.nombre + ' ' + u.apellido, email: u.email, role });
        return;
      } else {
        setErrorMsg('Credenciales inválidas.');
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Error de conexión.');
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ParticleBackground />
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="auth-card animate-fade-up">
        {/* Logo */}
        <div className="auth-logo">
          <img
            src="/logoclaro.jpeg"
            alt="Logo"
            className="auth-logo-img"
            onError={e => e.target.parentElement.innerHTML = '<span>NA</span>'}
          />
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1>Bienvenido</h1>
          <p>{tenant?.name || 'Acceso Administrativo'}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error-box animate-fade-in">
            <svg className="auth-error-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="auth-form">
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
            <div className="label-group">
              <label>Contraseña</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="auth-forgot-link"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="auth-pass-wrapper">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field auth-pass-input"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                required
              />
              <button type="button" className="auth-pass-toggle" onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-auth">
            {loading ? <div className="spinner" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-footer">NovaAgendas © {new Date().getFullYear()}</p>
      </div>
    </div>

  );
}
