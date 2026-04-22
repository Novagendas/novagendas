import React, { useState, useEffect } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

export default function ResetPassword({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [linkValid, setLinkValid] = useState(false);

  useEffect(() => {
    const init = async () => {
      // PKCE flow: ?code=xxx
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchErr && data?.session) {
          setUserEmail(data.session.user.email || '');
          setLinkValid(true);
        } else {
          setError('El enlace de recuperación es inválido o ha expirado.');
        }
        // Limpiar parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setValidating(false);
        return;
      }

      // Implicit flow: #access_token=xxx&type=recovery
      const hash = window.location.hash;
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        const hp = new URLSearchParams(hash.slice(1));
        const { data, error: sessErr } = await supabase.auth.setSession({
          access_token: hp.get('access_token'),
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

      // Sesión activa de recuperación ya existente
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

  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setError('No se pudo actualizar la contraseña. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    // Sincronizar la nueva contraseña en la tabla usuario (auth custom)
    if (userEmail) {
      await supabase.from('usuario').update({ password }).eq('email', userEmail);
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => { if (onSuccess) onSuccess(); }, 2500);
  };

  const cardStyle = {
    width: '100%', maxWidth: '420px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: '2.5rem',
    boxShadow: 'var(--shadow-xl)'
  };

  const Logo = () => (
    <div style={{
      width: 48, height: 48, borderRadius: 'var(--radius)', background: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 1.25rem', overflow: 'hidden'
    }}>
      <img src="/logoclaro.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => e.target.parentElement.innerHTML = '<span style="color:#fff;font-weight:700;font-size:1.1rem">NA</span>'} />
    </div>
  );

  const Wrap = ({ children }) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', padding: '2rem', position: 'relative' }}>
      <ParticleBackground />
      <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />
      {children}
      <p style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>NovaAgendas © {new Date().getFullYear()}</p>
    </div>
  );

  if (validating) {
    return (
      <Wrap>
        <div className="animate-fade-up" style={{ ...cardStyle, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32 }} />
          <p style={{ color: 'var(--text-4)', fontSize: '0.9rem' }}>Verificando enlace...</p>
        </div>
      </Wrap>
    );
  }

  if (success) {
    return (
      <Wrap>
        <div className="animate-fade-up" style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d1fae5', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>¡Contraseña actualizada!</h2>
          <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión.
          </p>
        </div>
      </Wrap>
    );
  }

  if (!linkValid) {
    return (
      <Wrap>
        <div className="animate-fade-up" style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--danger-light)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>Enlace inválido</h2>
          <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            {error || 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'}
          </p>
          <button className="btn btn-primary" style={{ width: '100%', borderRadius: '14px', padding: '0.875rem' }} onClick={onSuccess}>
            Volver al inicio de sesión
          </button>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="animate-fade-up" style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo />
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            Nueva Contraseña
          </h2>
          <p style={{ color: 'var(--text-4)', fontSize: '0.875rem', margin: 0 }}>
            Crea una contraseña segura para tu cuenta
          </p>
        </div>

        {error && (
          <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '1.5rem', padding: '0.75rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label>Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: '2.5rem' }}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                autoFocus
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.35rem' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= strength ? strengthColors[strength] : 'var(--border)', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: strengthColors[strength], fontWeight: 600 }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Confirmar Contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              required
              style={{ borderColor: confirm && confirm !== password ? 'var(--danger)' : undefined }}
            />
            {confirm && confirm !== password && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                Las contraseñas no coinciden
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (confirm && confirm !== password)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.25rem' }}
          >
            {loading ? <div className="spinner" /> : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </Wrap>
  );
}
