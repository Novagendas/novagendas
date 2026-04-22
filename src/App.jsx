import { useState, useEffect } from 'react';
import { GlobalProvider } from './context/GlobalState';
import './index.css';
import Login from './features/auth/Login';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Layout from './components/layout/Layout';
import Dashboard from './features/dashboard/Dashboard';
import Agenda from './features/agenda/Agenda';
import Clients from './features/clients/Clients';
import Services from './features/services/Services';
import Payments from './features/payments/Payments';
import Inventory from './features/inventory/Inventory';
import Users from './features/users/Users';
import Profile from './features/users/Profile';
import AuditLogs from './features/audit/AuditLogs.jsx';

import SuperAdminPortal from './features/superadmin/SuperAdminPortal';
import LandingPage from './features/landing/LandingPage';
import TermsPage from './features/legal/TermsPage';
import ConditionsPage from './features/legal/ConditionsPage';
import { supabase } from './Supabase/supabaseClient';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-subtle)', gap: '1.75rem'
    }}>
      <style>{`
        @keyframes ng-pulse {
          0%, 100% { box-shadow: 0 16px 48px var(--primary-light, rgba(37,99,235,0.25)); transform: scale(1); }
          50% { box-shadow: 0 24px 72px var(--primary, #2563eb); transform: scale(1.04); }
        }
        @keyframes ng-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(20%); }
          100% { transform: translateX(120%); }
        }
        @keyframes ng-dot {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>

      {/* Logo animado */}
      <div style={{
        width: 76, height: 76, borderRadius: 22,
        background: 'var(--primary)', overflow: 'hidden',
        animation: 'ng-pulse 2.2s ease-in-out infinite'
      }}>
        <img src="/logoclaro.jpeg" alt="NovaAgendas"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            e.target.parentElement.style.display = 'flex';
            e.target.parentElement.style.alignItems = 'center';
            e.target.parentElement.style.justifyContent = 'center';
            e.target.parentElement.innerHTML = '<span style="color:#fff;font-weight:900;font-size:1.4rem;letter-spacing:-0.04em">NA</span>';
          }} />
      </div>

      {/* Nombre */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
          NovaAgendas
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Preparando tu plataforma
        </div>
      </div>

      {/* Barra de progreso deslizante */}
      <div style={{ width: 220, height: 3, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: '45%',
          background: 'linear-gradient(90deg, transparent, var(--primary), var(--accent, #7c3aed), transparent)',
          borderRadius: 999,
          animation: 'ng-bar 1.6s ease-in-out infinite'
        }} />
      </div>

      {/* Puntos saltarines */}
      <div style={{ display: 'flex', gap: '0.55rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--primary)',
            animation: `ng-dot 1.3s ${i * 0.22}s ease-in-out infinite`
          }} />
        ))}
      </div>
    </div>
  );
}

function TenantApp({ tenant, initialView = 'login' }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('novagendas_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (new Date().getTime() < parsed.exp) return parsed.user;
        else localStorage.removeItem('novagendas_user');
      } catch (e) { }
    }
    return null;
  });
  const [authView, setAuthView] = useState(initialView); // 'login' | 'forgot' | 'reset'
  const [currentRoute, setCurrentRoute] = useState(() => {
    return localStorage.getItem('novagendas_route') || 'dashboard';
  });

  const handleUserUpdate = (updatedFields) => {
    const newUser = { ...user, ...updatedFields };
    setUser(newUser);
    const saved = localStorage.getItem('novagendas_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.user = newUser;
        localStorage.setItem('novagendas_user', JSON.stringify(parsed));
      } catch (e) { }
    }
  };

  const renderRoute = () => {
    if (user.role === 'especialista' && currentRoute !== 'agenda' && currentRoute !== 'clients' && currentRoute !== 'profile') {
      return <Agenda user={user} tenant={tenant} />;
    }
    if (user.role === 'recepcion' && (currentRoute === 'payments' || currentRoute === 'users')) {
      return <Dashboard user={user} onNavigate={setCurrentRoute} />;
    }

    switch (currentRoute) {
      case 'dashboard': return <Dashboard user={user} tenant={tenant} onNavigate={setCurrentRoute} />;
      case 'agenda': return <Agenda user={user} tenant={tenant} />;
      case 'clients': return <Clients user={user} tenant={tenant} />;
      case 'services': return <Services user={user} tenant={tenant} />;
      case 'payments': return <Payments user={user} tenant={tenant} />;
      case 'inventory': return <Inventory user={user} tenant={tenant} />;
      case 'users': return user.role === 'admin' ? <Users user={user} tenant={tenant} /> : <Dashboard user={user} onNavigate={setCurrentRoute} />;
      case 'profile': return <Profile user={user} onUserUpdate={handleUserUpdate} />;
      case 'logs': return <AuditLogs tenant={tenant} user={user} />;
      default: return <Dashboard user={user} tenant={tenant} onNavigate={setCurrentRoute} />;
    }
  };

  if (!user) {
    if (authView === 'forgot') {
      return <ForgotPassword tenant={tenant} onBack={() => setAuthView('login')} />;
    }
    if (authView === 'reset') {
      return <ResetPassword onSuccess={() => setAuthView('login')} />;
    }
    return (
      <Login
        tenant={tenant}
        onForgotPassword={() => setAuthView('forgot')}
        onLogin={(userObj) => {
          const loggedUser = { ...userObj, tenant_id: tenant.id };
          setUser(loggedUser);
          localStorage.setItem('novagendas_user', JSON.stringify({
            user: loggedUser,
            exp: new Date().getTime() + 24 * 60 * 60 * 1000
          }));
          setCurrentRoute(userObj.role === 'especialista' ? 'agenda' : 'dashboard');
        }}
      />
    );
  }

  return (
    <GlobalProvider tenantId={tenant.id}>
      <Layout user={user} tenant={tenant} currentRoute={currentRoute} onNavigate={setCurrentRoute} onLogout={() => { setUser(null); localStorage.removeItem('novagendas_user'); }}>
        {renderRoute()}
      </Layout>
    </GlobalProvider>
  );
}

export default function App() {
  const [view, setView] = useState('loading');
  const [tenant, setTenant] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(false);

  useEffect(() => {
    // Detectar rutas legales (/terminos y /condiciones) — aplican en cualquier host
    const pathname = window.location.pathname;
    if (pathname === '/terminos' || pathname.startsWith('/terminos')) {
      setView('terminos');
      return;
    }
    if (pathname === '/condiciones' || pathname.startsWith('/condiciones')) {
      setView('condiciones');
      return;
    }

    // Detectar URL de recuperación de contraseña (Supabase PKCE o implicit flow)
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hasRecoveryHash = window.location.hash.includes('type=recovery');
    if (hasCode || hasRecoveryHash) {
      setResetTrigger(true);
    }

    const host = window.location.hostname;
    const parts = host.split('.');
    let subdomain = null;

    // Detectar si estamos en un subdominio válido de forma robusta
    const isIp = /^[0-9.]+$/.test(host);
    if (!isIp) {
      if (host.includes('localhost')) {
        // Ej: admin.localhost
        if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
          subdomain = parts[0];
        }
      } else {
        // Ej: admin.novagendas.com
        if (parts.length >= 3 && parts[0] !== 'www') {
          subdomain = parts[0];
        }
      }
    }

    // Si no hay subdominio, mostrar landing page principal
    if (!subdomain) {
      setView('landing');
      return;
    }

    if (subdomain === 'admin' || subdomain === 'superadmin') {
      setView('superadmin');
      return;
    }

    const fetchTenant = async () => {
      try {
        const { data, error } = await supabase
          .from('negocios') // lowercase
          .select('*')
          .eq('dominio', subdomain)
          .single();

        if (error) {
          console.warn("Tenant no encontrado en DB, verificando fallback MOCK.");
          throw error;
        }

        if (data && data.idestadoapp === 1) {
          setTenant({
            id: data.idnegocios,
            name: data.nombre,
            subdomain: data.dominio,
            active: true
          });
          setView('tenant');
        } else {
          setView('not_found');
        }
      } catch (e) {
        console.error("Error verificando tenant:", e);
        setView('not_found');
      }
    };

    fetchTenant();
  }, []);

  if (view === 'loading') return <LoadingScreen />;
  if (view === 'terminos') return <TermsPage />;
  if (view === 'condiciones') return <ConditionsPage />;
  if (view === 'landing') return <LandingPage />;

  if (view === 'not_found') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="card flex-col items-center gap-4" style={{ padding: '3rem', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ background: 'var(--danger-light)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <h2 style={{ margin: 0 }}>Tienda No Encontrada</h2>
        <p style={{ color: 'var(--text-3)', margin: 0, fontSize: '0.9rem' }}>El subdominio al que intentas acceder no se encuentra registrado o ha sido suspendido.</p>
        <button onClick={() => {
          const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
          window.location.href = isLocal ? 'http://localhost:5173' : 'https://novagendas.com';
        }} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Ir al Inicio</button>
      </div>
    </div>
  );

  if (view === 'superadmin') {
    return (
      <GlobalProvider tenantId="superadmin">
        <SuperAdminPortal />
      </GlobalProvider>
    );
  }

  return <TenantApp tenant={tenant} initialView={resetTrigger ? 'reset' : 'login'} />;
}
