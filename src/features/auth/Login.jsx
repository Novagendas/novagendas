import React, { useState, useRef } from 'react';
import { supabase } from '../../Supabase/supabaseClient';

export default function Login({ tenant, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Credenciales inválidas.');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // 3D Tilt & Spotlight States
  const [transform, setTransform] = useState('perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [opacity, setOpacity] = useState(0);
  const cardRef = useRef(null);

  // Mock accounts for testing roles
  const MOCK_USERS = [
    { email: '1@1', pass: '1', user: { name: 'Administrador', email: 'admin@soleil.com', role: 'admin' } },
    { email: '2@2', pass: '2', user: { name: 'Karen Useche', email: 'recepcion@soleil.com', role: 'recepcion' } },
    { email: '3@3', pass: '3', user: { name: 'Dra. Fabiola Rodríguez', email: 'especialista@soleil.com', role: 'especialista' } },
    { email: 'admin@soleil.com', pass: 'admin', user: { name: 'Administrador', email: 'admin@soleil.com', role: 'admin' } },
    { email: 'recepcion@soleil.com', pass: 'recepcion', user: { name: 'Karen Useche', email: 'recepcion@soleil.com', role: 'recepcion' } },
    { email: 'especialista@soleil.com', pass: 'especialista', user: { name: 'Dra. Fabiola Rodríguez', email: 'especialista@soleil.com', role: 'especialista' } },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      if (!tenant || !tenant.id) {
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
        else if (u.rol_nombre === 'recepcionista') role = 'recepcion';
        
        onLogin({
          id: u.idusuario,
          name: u.nombre + ' ' + u.apellido,
          email: u.email,
          role: role
        });
        return;
      }
    } catch(err) {
      console.warn("DB login error, using fallback.");
    }

    setTimeout(() => {
      const match = MOCK_USERS.find(u => u.email === email && u.pass === password);
      if (match) {
        onLogin(match.user);
      } else {
        setErrorMsg('Credenciales inválidas.');
        setError(true);
        setLoading(false);
      }
    }, 600);
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    setOpacity(1);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    setTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setOpacity(0);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: '2rem'
    }}>
      {/* Decorative Blobs */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 60%)', opacity: 0.6, filter: 'blur(100px)', borderRadius: '50%', animation: 'blobPulse 15s infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, var(--secondary-light) 0%, transparent 60%)', opacity: 0.4, filter: 'blur(100px)', borderRadius: '50%', animation: 'blobPulse 20s infinite' }} />
      </div>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="animate-fade-up"
        style={{
          width: '100%', maxWidth: '420px',
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border)',
          borderRadius: '32px',
          padding: '3rem',
          boxShadow: 'var(--shadow-xl)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
          transform: transform,
          transition: 'transform 0.1s ease-out',
          willChange: 'transform',
          overflow: 'hidden'
        }}
      >
        {/* Spotlight Effect */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, var(--primary-light), transparent 80%)`,
          opacity: opacity, pointerEvents: 'none', transition: 'opacity 0.4s ease', zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px var(--primary-light)',
              overflow: 'hidden'
            }}>
               <img src="/logoclaro.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.parentElement.innerHTML = '<span style="color:#fff;font-weight:900;font-size:1.5rem">NA</span>'} />
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)' }}>
              NovAgendas
            </h2>
            <p style={{ color: 'var(--text-4)', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tenant?.name || 'Acceso Profesional'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '0.5rem' }}>Usuario / Email</label>
              <input
                type="email"
                className="input-field"
                style={{ borderRadius: '16px', padding: '1rem 1.25rem' }}
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(false); }}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contraseña</label>
                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>¿Olvidaste la clave?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  style={{ borderRadius: '16px', padding: '1rem 3.5rem 1rem 1.25rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
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
              style={{ padding: '1rem', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, marginTop: '1rem', boxShadow: '0 8px 24px var(--primary-light)' }}
            >
              {loading ? (
                <div className="spinner" />
              ) : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      <p style={{ position: 'absolute', bottom: '2rem', fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 600 }}>
        NovAgendas © {new Date().getFullYear()} · v5.0
      </p>
    </div>
  );
}
