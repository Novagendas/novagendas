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
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // Percentage
  const [opacity, setOpacity] = useState(0); // Spotlight visibility
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
      // Validamos que la cuenta inicie sesión solo dentro de su propio negocio/tienda
      if (!tenant || !tenant.id) {
         setError(true);
         setLoading(false);
         console.error("No hay contexto de tienda para validar el login.");
         return;
      }

      const { data: users, error: dbErr } = await supabase
        .from('usuario') // Postgres makes unquoted tables lowercase internally
        .select('*, rolpermisos(idrol)')
        .eq('email', email)
        .eq('contraseña', password)
        .eq('idnegocios', tenant.id);

      if (!dbErr && users && users.length > 0) {
        const u = users[0];
        let role = 'recepcion';
        
        if (u.rolpermisos && u.rolpermisos.length > 0) {
          const idRol = u.rolpermisos[0].idrol;
          if (idRol === 1) role = 'admin';
          else if (idRol === 2) role = 'especialista';
          else if (idRol === 3) role = 'recepcion';
        }
        
        onLogin({
          id: u.idusuario,
          name: u.nombre + ' ' + u.apellido,
          email: u.email,
          role: role
        });
        return;
      }
    } catch(err) {
      console.warn("Error validando usuario en BBDD, intentando fallback:", err);
    }

    // Fallback MOCK - also scoped to tenant subdomain
    setTimeout(() => {
      const match = MOCK_USERS.find(u => u.email === email && u.pass === password);
      if (match) {
        // Validate mock user belongs to this tenant's subdomain
        const tenantSub = tenant?.subdomain || tenant?.id || '';
        const emailDomain = match.user.email.split('@')[1]?.split('.')[0];
        if (tenantSub && emailDomain && emailDomain !== tenantSub) {
          setErrorMsg('Esta cuenta no está registrada en este negocio.');
          setError(true);
          setLoading(false);
          return;
        }
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
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spotlight position (percentage)
    const posX = (x / rect.width) * 100;
    const posY = (y / rect.height) * 100;
    setMousePos({ x: posX, y: posY });
    setOpacity(1);

    // 3D Tilt calculation
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setOpacity(0);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #f0f4f8)',
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(1rem, 5vw, 2rem)',
        fontFamily: 'var(--font-main, "Inter", sans-serif)',
      }}
    >
      {/* Animated Light Background Blobs */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '25%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 50%)', filter: 'blur(80px)', borderRadius: '50%', transform: 'translate(-50%, -50%)', animation: 'blobPulse 12s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 50%)', filter: 'blur(80px)', borderRadius: '50%', transform: 'translate(50%, 50%)', animation: 'blobPulse 15s ease-in-out infinite alternate-reverse' }} />
      </div>

      {/* Main Glass Card with 3D Tilt & Dynamic Spotlight */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--surface-overlay, rgba(255, 255, 255, 0.9))',
          border: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
          borderRadius: '28px',
          padding: 'clamp(2rem, 6vw, 2.75rem)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), 0 0 0 1px var(--border-strong, rgba(148, 163, 184, 0.3))',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.8rem',
          transform: transform,
          transition: 'transform 0.1s ease-out',
          willChange: 'transform',
          overflow: 'hidden' // Important for the internal spotlight container
        }}
      >
        {/* Spotlight Overlay - AuthKit/Stripe style halo following the mouse cursor */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, var(--primary-light, rgba(59,130,246,0.15)), transparent 80%)`,
            opacity: opacity,
            pointerEvents: 'none',
            transition: 'opacity 0.4s ease',
            zIndex: 0
          }}
        />

        {/* Card Content Wrapper to stay above spotlight */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>

          {/* Header / Logo section */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: 'linear-gradient(135deg, var(--primary, #3b82f6), var(--accent, #8b5cf6))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.35rem',
                boxShadow: '0 10px 25px -5px var(--primary-glow, rgba(59,130,246,0.3)), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>
              nova<span style={{ color: 'var(--primary, #3b82f6)' }}>agendas</span>
            </h2>
            <p style={{ color: 'var(--text-3, #64748b)', fontSize: '0.98rem', margin: 0, fontWeight: 500 }}>
              Centro de Medicina Estética Soleil
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: 'var(--danger)',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                animation: 'fadeUp 0.3s ease-out forwards'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-3)', marginLeft: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo Electrónico</label>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: focusedInput === 'email' ? '2px solid var(--primary, #3b82f6)' : '1px solid var(--border, rgba(148, 163, 184, 0.2))',
                  background: focusedInput === 'email' ? '#fff' : 'var(--surface, #fff)',
                  transition: 'all 0.25s ease',
                  boxShadow: focusedInput === 'email' ? 'var(--shadow-glow-primary, 0 0 0 3px rgba(59,130,246,0.1))' : 'var(--shadow-xs)'
                }}
              >
                <input
                  type="email"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '1rem',
                    color: 'var(--text)',
                    fontWeight: 500
                  }}
                  placeholder=""
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(false); }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '0.2rem', marginRight: '0.2rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                <a href="#" style={{ fontSize: '0.82rem', color: 'var(--primary, #3b82f6)', textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s', outline: 'none' }} onMouseOver={e => e.currentTarget.style.opacity = 0.7} onMouseOut={e => e.currentTarget.style.opacity = 1}>¿Olvidaste tu contraseña?</a>
              </div>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: focusedInput === 'password' ? '2px solid var(--primary, #3b82f6)' : '1px solid var(--border, rgba(148, 163, 184, 0.2))',
                  background: focusedInput === 'password' ? '#fff' : 'var(--surface, #fff)',
                  transition: 'all 0.25s ease',
                  boxShadow: focusedInput === 'password' ? 'var(--shadow-glow-primary, 0 0 0 3px rgba(59,130,246,0.1))' : 'var(--shadow-xs)'
                }}
              >
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{
                    width: '100%',
                    padding: '0.9rem 3.2rem 0.9rem 1.1rem',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '1rem',
                    color: 'var(--text)',
                    fontWeight: 500,
                    fontFamily: showPass ? 'var(--font-main)' : 'caption',
                    letterSpacing: showPass ? 'normal' : '0.15em'
                  }}
                  placeholder=""
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    color: 'var(--text-4)',
                    transition: 'color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.75rem',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--primary-deep, #1d4ed8) 100%)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                boxShadow: '0 8px 20px -5px var(--primary-glow, rgba(59,130,246,0.4))',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px -5px var(--primary-glow, rgba(59,130,246,0.5))'; } }}
              onMouseOut={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px -5px var(--primary-glow, rgba(59,130,246,0.4))'; } }}
              onMouseDown={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0) scale(0.97)'; } }}
            >
              {loading && (
                <svg className="animate-spin" style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Ingresando...' : 'Entrar al Sistema'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ position: 'absolute', bottom: '1.5rem', width: '100%', textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-4, #94a3b8)', fontWeight: 500, letterSpacing: '0.02em', margin: 0 }}>
          Centro Médico Soleil © {new Date().getFullYear()}
        </p>
      </div>

    </div>
  );
}
