import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';
import './Auth.css';

/* ── Colores de fuerza de contraseña (valores calculados dinámicamente) ── */
const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  return score;
}

/* ── Wrapper de página ── */
function AuthWrap({ children }) {
  return (
    <div className="auth-page">
      <ParticleBackground />
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      {children}
      <p className="auth-footer">
        Novagendas © {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default function ResetPassword({ onSuccess }) {
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [validating, setValidating] = useState(true);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [userEmail,  setUserEmail]  = useState('');
  const [linkValid,  setLinkValid]  = useState(false);

  useEffect(() => {
    const init = async () => {
      // PKCE flow: ?code=xxx
      const params = new URLSearchParams(window.location.search);
      const code   = params.get('code');

      if (code) {
        const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchErr && data?.session) {
          setUserEmail(data.session.user.email || '');
          setLinkValid(true);
        } else {
          setError('El enlace de recuperación es inválido o ha expirado.');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        setValidating(false);
        return;
      }

      // Implicit flow: #access_token=xxx&type=recovery
      const hash = window.location.hash;
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        const hp = new URLSearchParams(hash.slice(1));
        const { data, error: sessErr } = await supabase.auth.setSession({
          access_token:  hp.get('access_token'),
          refresh_token: hp.get('refresh_token') || '',
        });
        if (!sessErr && data?.session) {
          setUserEmail(data.session.user.email || '');
          setLinkValid(true);
        } else {
          setError('El enlace de recuperación es inválido o ha expirado.');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        setValidating(false);
        return;
      }

      // Sesión activa ya existente
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || '');
        setLinkValid(true);
      } else {
        setError('El enlace de recuperación es inválido o ha expirado.');
      }
      setValidating(false);
    };

    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm)  { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    setError('');

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError('No se pudo actualizar la contraseña. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    if (userEmail) {
      await supabase.from('usuario').update({ password }).eq('email', userEmail);
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => { if (onSuccess) onSuccess(); }, 2500);
  };

  const strength = getStrength(password);

  /* ── Estado: validando ── */
  if (validating) {
    return (
      <AuthWrap>
        <div className="auth-card animate-fade-up">
          <div className="spinner auth-spinner-center" />
          <p className="auth-status-text">Verificando enlace...</p>
        </div>
      </AuthWrap>
    );
  }

  /* ── Estado: éxito ── */
  if (success) {
    return (
      <AuthWrap>
        <div className="auth-card animate-fade-up">
          <div className="auth-icon-circle auth-icon-circle--success">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="auth-header">
            <h1>¡Contraseña actualizada!</h1>
            <p>Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión.</p>
          </div>
        </div>
      </AuthWrap>
    );
  }

  /* ── Estado: enlace inválido ── */
  if (!linkValid) {
    return (
      <AuthWrap>
        <div className="auth-card animate-fade-up">
          <div className="auth-icon-circle auth-icon-circle--error">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="auth-header">
            <h1>Enlace inválido</h1>
            <p>{error || 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'}</p>
          </div>
          <button className="btn btn-primary btn-full" onClick={onSuccess}>
            Volver al inicio de sesión
          </button>
        </div>
      </AuthWrap>
    );
  }

  /* ── Formulario principal ── */
  return (
    <AuthWrap>
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
          <h1>Nueva Contraseña</h1>
          <p>Crea una contraseña segura para tu cuenta</p>
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

          {/* Nueva contraseña */}
          <div className="input-group">
            <label>Nueva Contraseña</label>
            <div className="auth-pass-wrapper">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field auth-pass-input"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                autoFocus
              />
              <button type="button" className="auth-pass-toggle" onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Barra de fuerza */}
            {password.length > 0 && (
              <div className="strength-wrapper">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map(i => {
                    let barClass = 'strength-bar';
                    if (i <= strength) {
                      if (strength <= 1) barClass += ' strength-bar--active-weak';
                      else if (strength <= 2) barClass += ' strength-bar--active-medium';
                      else barClass += ' strength-bar--active-strong';
                    }
                    return <div key={i} className={barClass} />;
                  })}
                </div>
                <span className="strength-label" style={{ color: STRENGTH_COLORS[strength] }}>
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="input-group">
            <label>Confirmar Contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              required
            />
            {confirm && confirm !== password && (
              <span className="confirm-mismatch">Las contraseñas no coinciden</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (confirm && confirm !== password)}
            className="btn btn-primary btn-auth"
          >
            {loading ? <div className="spinner" /> : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </AuthWrap>
  );
}
