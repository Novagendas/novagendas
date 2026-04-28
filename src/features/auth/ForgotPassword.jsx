import React, { useState } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './Auth.css';

export default function ForgotPassword({ tenant, onBack }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (authError) {
      setError('No se pudo enviar el correo. Verifica que el correo esté registrado.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  /* ── Pantalla de éxito ── */
  if (sent) {
    return (
      <div className="auth-page">
        <ParticleBackground />
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>

        <div className="auth-card animate-fade-up">
          <div className="auth-icon-circle auth-icon-circle--success">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 5.87 5.87l.47-.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>

          <div className="auth-header">
            <h1>¡Revisa tu correo!</h1>
            <p>
              Te enviamos un enlace de recuperación a <strong>{email}</strong>.
              Puede tardar unos minutos.
            </p>
          </div>

          <button className="btn btn-outline btn-full" onClick={onBack}>
            Volver al inicio de sesión
          </button>

          <p className="auth-footer">NovaAgendas © {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }

  /* ── Formulario de recuperación ── */
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
          <h1>Recuperar Contraseña</h1>
          <p>Te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error-box animate-fade-in">
            <svg className="auth-error-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              className="input-field"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
              autoFocus
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-auth">
            {loading ? <div className="spinner" /> : 'Enviar enlace de recuperación'}
          </button>
 
          <button type="button" className="btn btn-ghost btn-full" onClick={onBack}>
            ← Volver al inicio de sesión
          </button>
        </form>

        <p className="auth-footer">NovaAgendas © {new Date().getFullYear()}</p>
      </div>
    </div>

  );
}
