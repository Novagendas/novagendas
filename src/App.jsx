import { useState, useEffect } from 'react';
import { GlobalProvider } from './context/GlobalState';
import './index.css';
import Login     from './features/auth/Login';
import Layout    from './components/layout/Layout';
import Dashboard from './features/dashboard/Dashboard';
import Agenda    from './features/agenda/Agenda';
import Clients   from './features/clients/Clients';
import Services  from './features/services/Services';
import Payments  from './features/payments/Payments';
import Inventory from './features/inventory/Inventory';
import Users     from './features/users/Users';
import LogsView  from './features/logs/LogsView';

import SuperAdminPortal from './features/superadmin/SuperAdminPortal';
import LandingPage      from './features/landing/LandingPage';
import { supabase } from './Supabase/supabaseClient';

function TenantApp({ tenant }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('novagendas_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (new Date().getTime() < parsed.exp) return parsed.user;
        else localStorage.removeItem('novagendas_user');
      } catch (e) {}
    }
    return null;
  });
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  const renderRoute = () => {
    if (user.role === 'especialista' && currentRoute !== 'agenda' && currentRoute !== 'clients') {
      return <Agenda user={user} />;
    }
    if (user.role === 'recepcion' && (currentRoute === 'payments' || currentRoute === 'users')) {
      return <Dashboard user={user} onNavigate={setCurrentRoute} />;
    }

    switch (currentRoute) {
      case 'dashboard': return <Dashboard user={user} tenant={tenant} onNavigate={setCurrentRoute} />;
      case 'agenda':    return <Agenda user={user} tenant={tenant} />;
      case 'clients':   return <Clients user={user} tenant={tenant} />;
      case 'services':  return <Services user={user} tenant={tenant} />;
      case 'payments':  return <Payments user={user} tenant={tenant} />;
      case 'inventory': return <Inventory user={user} tenant={tenant} />;
      case 'users':     return user.role === 'admin' ? <Users user={user} tenant={tenant} /> : <Dashboard user={user} onNavigate={setCurrentRoute} />;
      case 'logs':      return <LogsView tenant={tenant} />;
      default:          return <Dashboard user={user} tenant={tenant} onNavigate={setCurrentRoute} />;
    }
  };

  if (!user) return <Login tenant={tenant} onLogin={(userObj) => {
    const loggedUser = { ...userObj, tenant_id: tenant.id };
    setUser(loggedUser);
    localStorage.setItem('novagendas_user', JSON.stringify({
      user: loggedUser,
      exp: new Date().getTime() + 24 * 60 * 60 * 1000 // 24 hours
    }));
    setCurrentRoute(userObj.role === 'especialista' ? 'agenda' : 'dashboard');
  }} />;

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

  useEffect(() => {
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
        // Fallback para pruebas locales si la BD no se ha conectado
        if (subdomain === 'soleil' || subdomain === 'drfabiola') {
          setTenant({ id: subdomain, name: 'Centro de Prueba (MOCK)', subdomain, active: true });
          setView('tenant');
        } else {
          setView('not_found');
        }
      }
    };

    fetchTenant();
  }, []);

  if (view === 'loading') return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Plataforma...</div>;
  if (view === 'landing') return <LandingPage />;
  
  if (view === 'not_found') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="card flex-col items-center gap-4" style={{ padding: '3rem', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ background: 'var(--danger-light)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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

  return <TenantApp tenant={tenant} />;
}
