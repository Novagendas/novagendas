import { useState } from 'react';
import { GlobalProvider } from './context/GlobalState';
import './index.css';
import Login     from './pages/Login';
import Layout    from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agenda    from './pages/Agenda';
import Clients   from './pages/Clients';
import Services  from './pages/Services';
import Payments  from './pages/Payments';
import Inventory from './pages/Inventory';
import Users     from './pages/Users';

function AppContent() {
  const [user, setUser] = useState(null); // null when not logged in
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  const renderRoute = () => {
    // Privacidad: Especialista solo accede a Agenda y Pacientes
    if (user.role === 'especialista' && currentRoute !== 'agenda' && currentRoute !== 'clients') {
      return <Agenda user={user} />;
    }
    // Privacidad: Recepción no accede a Pagos ni Usuarios
    if (user.role === 'recepcion' && (currentRoute === 'payments' || currentRoute === 'users')) {
      return <Dashboard user={user} onNavigate={setCurrentRoute} />;
    }

    switch (currentRoute) {
      case 'dashboard': return <Dashboard user={user} onNavigate={setCurrentRoute} />;
      case 'agenda':    return <Agenda user={user} />;
      case 'clients':   return <Clients user={user} />;
      case 'services':  return <Services />;
      case 'payments':  return <Payments />;
      case 'inventory': return <Inventory />;
      case 'users':     return user.role === 'admin' ? <Users /> : <Dashboard user={user} onNavigate={setCurrentRoute} />;
      default:          return <Dashboard user={user} onNavigate={setCurrentRoute} />;
    }
  };

  if (!user) return <Login onLogin={(userObj) => {
    setUser(userObj);
    setCurrentRoute(userObj.role === 'especialista' ? 'agenda' : 'dashboard');
  }} />;

  return (
    <Layout user={user} currentRoute={currentRoute} onNavigate={setCurrentRoute} onLogout={() => setUser(null)}>
      {renderRoute()}
    </Layout>
  );
}

export default function App() {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}
