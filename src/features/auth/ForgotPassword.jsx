import React, { useState } from 'react';
import { supabase } from '../../Supabase/supabaseClient';
import ParticleBackground from '../../components/ParticleBackground';
import ThemeToggle from '../../components/ThemeToggle';

export default function ForgotPassword({ tenant, onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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

  if (sent) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-subtle)', padding: '2rem', position: 'relative'
      }}>
        <ParticleBackground />
        <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />
        <div className="animate-fade-up" style={{
          width: '100%', maxWidth: '400px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)', textAlign: 'center'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--success-light, #d1fae5)', margin: '0 auto 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--success, #10b981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 5.87 5.87l.47-.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>
            ¡Revisa tu correo!
          </h2>
          <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            Te enviamos un enlace de recuperación a <strong style={{ color: 'var(--text)' }}>{email}</strong>.
            Puede tardar unos minutos.
          </p>
          <button className="btn btn-outline" style={{ width: '100%', borderRadius: '14px', padding: '0.875rem', fontWeight: 700 }} onClick={onBack}>
            Volver al inicio de sesión
          </button>
        </div>
        <p style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>
          NovaAgendas © {new Date().getFullYear()}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-subtle)', padding: '2rem', position: 'relative'
    }}>
      <ParticleBackground />
      <ThemeToggle style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }} />

      <div className="animate-fade-up" style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius)',
            background: 'var(--primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.25rem', overflow: 'hidden'
          }}>
            <img src="/logoclaro.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => e.target.parentElement.innerHTML = '<span style="color:#fff;font-weight:700;font-size:1.1rem">NA</span>'} />
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            Recuperar Contraseña
          </h2>
          <p style={{ color: 'var(--text-4)', fontSize: '0.875rem', margin: 0 }}>
            Te enviaremos un enlace para restablecer tu contraseña.
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

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', marginTop: '0.25rem' }}
          >
            {loading ? <div className="spinner" /> : 'Enviar enlace de recuperación'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', padding: '0.75rem', color: 'var(--text-4)', fontSize: '0.875rem' }}
            onClick={onBack}
          >
            ← Volver al inicio de sesión
          </button>
        </form>
      </div>

      <p style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 500 }}>
        NovaAgendas © {new Date().getFullYear()}
      </p>
    </div>
  );
}
