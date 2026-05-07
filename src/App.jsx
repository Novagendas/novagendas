import { useState, useEffect } from 'react';
import { GlobalProvider } from './context/GlobalState';
import './index.css';
import './App.css';
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
import Statistics from './features/statistics/Statistics';

import SuperAdminPortal from './features/superadmin/SuperAdminPortal';
import HolidayCalendar from './features/agenda/HolidayCalendar';
import LandingPage from './features/landing/LandingPage';
import TermsPage from './features/legal/TermsPage';
import ConditionsPage from './features/legal/ConditionsPage';
import { supabase } from './Supabase/supabaseClient';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      {/* Logo animado */}
      <div className="loading-logo">
        <img
          src="/logoclaro.jpeg"
          alt="Novagendas"
          onError={e => {
            e.target.classList.add('hidden-img');
            e.target.parentElement.innerHTML = '<span>NA</span>';
          }}
        />
      </div>

      {/* Nombre y tagline */}
      <div className="loading-info">
        <p className="loading-brand">Novagendas</p>
        <p className="loading-tagline">Preparando tu plataforma</p>
      </div>

      {/* Barra de progreso */}
      <div className="loading-bar-wrapper">
        <div className="loading-bar" />
      </div>

      {/* Puntos saltarines */}
      <div className="loading-dots">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="loading-dot"
          />
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
      } catch { /* error ignorado intencionalmente al parsear caché */ }
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
      } catch { /* error ignorado intencionalmente al actualizar caché */ }
    }
  };

  const renderRoute = () => {
    if (user.role === 'especialista' && currentRoute !== 'agenda' && currentRoute !== 'clients' && currentRoute !== 'profile') {
      return <Agenda user={user} tenant={tenant} />;
    }
    if (user.role === 'recepcion' && (currentRoute === 'payments' || currentRoute === 'users' || currentRoute === 'estadisticas')) {
      return <Dashboard user={user} onNavigate={setCurrentRoute} />;
    }
    if (currentRoute === 'estadisticas' && user.role !== 'admin') {
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
      case 'feriados': {
        const canManageFeriados = user.role === 'admin' || (Array.isArray(user.permissions) && user.permissions.includes('feriados'));
        return <HolidayCalendar user={user} tenant={tenant} canManage={canManageFeriados} />;
      }
      case 'profile':       return <Profile user={user} tenant={tenant} onUserUpdate={handleUserUpdate} />;
      case 'logs':          return <AuditLogs tenant={tenant} user={user} />;
      case 'estadisticas':  return <Statistics user={user} tenant={tenant} />;
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
  const isDevelopment = import.meta.env.VITE_ENV === 'development' || import.meta.env.ENV === 'development';

  // Log del entorno al iniciar
  useEffect(() => {
    console.log(`🚀 Novagendas - Entorno: ${isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
    console.log(`🌐 Host: ${window.location.hostname}`);
    console.log(`🔗 URL: ${window.location.href}`);
  }, [isDevelopment]);

  useEffect(() => {
    const init = async () => {
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
      } else {
        // Limpiar sesión Supabase Auth (admin o huérfana) antes de cargar el tenant
        // para evitar 403 Forbidden cuando se viene del portal superadmin
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await supabase.auth.signOut();
      }

      const host = window.location.hostname;
      const parts = host.split('.');
      let subdomain = null;

      const isIp = /^[0-9.]+$/.test(host);
      if (!isIp) {
        if (host.includes('localhost')) {
          if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
            subdomain = parts[0];
          }
        } else {
          if (parts.length >= 3 && parts[0] !== 'www') {
            subdomain = parts[0];
            if (isDevelopment && subdomain.startsWith('dev.')) {
              subdomain = subdomain.substring(4);
            }
          }
        }
      }

      if (!subdomain) {
        setView('landing');
        return;
      }

      if (subdomain === 'admin' || subdomain === 'superadmin' ||
          (isDevelopment && (subdomain === 'dev.admin' || subdomain === 'dev.superadmin'))) {
        setView('superadmin');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('negocios')
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

    init();
  }, [isDevelopment]);

  if (view === 'loading') return <LoadingScreen />;
  if (view === 'terminos') return <TermsPage />;
  if (view === 'condiciones') return <ConditionsPage />;
  if (view === 'landing') return <LandingPage />;

  if (view === 'not_found') return (
    <div className="not-found-screen animate-fade-in">
      <div className="not-found-card">
        <div className="auth-icon-circle auth-icon-circle--error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Tienda No Encontrada</h2>
        <p>El subdominio al que intentas acceder no se encuentra registrado o ha sido suspendido temporalmente.</p>
        <button
          onClick={() => {
            const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
            const baseUrl = isLocal ? 'http://localhost:5173' : (isDevelopment ? 'https://dev.novagendas.com' : 'https://novagendas.com');
            window.location.href = baseUrl;
          }}
          className="btn btn-primary btn-full"
        >
          Ir al Inicio
        </button>
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
