import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();
export const useGlobalState = () => useContext(GlobalContext);

// --- MOCK DATABASE (Simulating Supabase Tables) ---
let MOCK_TENANTS = [
  { id: 'soleil', name: 'Centro Soleil', subdomain: 'soleil', active: true },
  { id: 'drfabiola', name: 'Clínica Dra. Fabiola', subdomain: 'drfabiola', active: true }
];

const todayStr = new Date().toISOString().split('T')[0];

let mockClients = [
  { id: 1, tenant_id: 'soleil', doc: '1010123456', name: 'Ana Rodríguez', phone: '+57 300 123 4567', lastVisit: '10 Ago 2026', totalVisits: 4, history: [{ id: 1, date: '10 Ago 2026', title: 'Aplicación Bótox (3 Zonas)', doctor: 'Dra. Fabiola Rodríguez', notes: 'Paciente acude a sesión de retoque. Se aplican 20 unidades adicionales en el tercio superior. Sin reacciones.' }] },
  { id: 2, tenant_id: 'soleil', doc: '52345678', name: 'María Gómez', phone: '+57 320 987 6543', lastVisit: '05 Jul 2026', totalVisits: 1, history: [] },
  { id: 3, tenant_id: 'drfabiola', doc: '90012345', name: 'Carlos Mendoza', phone: '+57 311 444 5555', lastVisit: '-', totalVisits: 0, history: [] }
];

let mockServices = [
  { id: 1, tenant_id: 'soleil', name: 'Aplicación Bótox (3 Zonas)', category: 'Inyectables', duration: 45, price: 850000, color: '#3b82f6' },
  { id: 2, tenant_id: 'soleil', name: 'Depilación Láser (Cuerpo Completo)', category: 'Aparatología', duration: 60, price: 450000, color: '#2dd4bf' },
  { id: 3, tenant_id: 'drfabiola', name: 'Limpieza Facial Profunda', category: 'Cosmetología', duration: 90, price: 180000, color: '#8b5cf6' }
];

let mockInventory = [
  { id: 1, tenant_id: 'soleil', name: 'Toxina Botulínica (Vial 100u)', category: 'Inyectables', stock: 2, minStock: 5, status: 'low' },
  { id: 2, tenant_id: 'soleil', name: 'Ácido Hialurónico (Jeringa 1ml)', category: 'Inyectables', stock: 15, minStock: 10, status: 'ok' },
  { id: 3, tenant_id: 'drfabiola', name: 'Gel Conductor Láser (Galón)', category: 'Insumos', stock: 1, minStock: 3, status: 'low' },
  { id: 4, tenant_id: 'soleil', name: 'Agujas 30G x 13mm (Cajas)', category: 'Material Médico', stock: 24, minStock: 10, status: 'ok' }
];

let mockAppointments = [
  { id: 1, tenant_id: 'soleil', clientId: 1, serviceId: 1, date: todayStr, time: '10:00', duration: 45, status: 'Confirmada', doctor: 'Dra. Fabiola Rodríguez' },
  { id: 2, tenant_id: 'soleil', clientId: 2, serviceId: 2, date: todayStr, time: '11:00', duration: 60, status: 'En Espera', doctor: 'Dra. Fabiola Rodríguez' }
];

let mockPayments = [
  { id: 1, tenant_id: 'soleil', clientId: 1, serviceId: 1, appointmentId: 1, amount: 850000, method: 'Tarjeta', date: todayStr, note: '', status: 'Pagado' }
];

export const GlobalProvider = ({ children, tenantId }) => {

  const [clients, setClients] = useState(mockClients.filter(c => c.tenant_id === tenantId));
  const addClient = (client) => {
    const newClient = { ...client, id: Date.now(), tenant_id: tenantId, totalVisits: 0, history: [], lastVisit: '-' };
    mockClients.push(newClient);
    setClients(prev => [newClient, ...prev]);
  };
  const updateClient = (id, updates) => {
    mockClients = mockClients.map(c => c.id === id ? { ...c, ...updates } : c);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const addHistory = (clientId, entry) => {
    const newEntry = { ...entry, id: Date.now(), date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) };
    mockClients = mockClients.map(c => c.id === clientId ? { ...c, history: [newEntry, ...c.history] } : c);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, history: [newEntry, ...c.history] } : c));
  };

  const [services, setServices] = useState(mockServices.filter(s => s.tenant_id === tenantId));
  const addService = (s) => {
    const newS = { ...s, id: Date.now(), tenant_id: tenantId };
    mockServices.push(newS);
    setServices(prev => [newS, ...prev]);
  };
  const updateService = (id, updates) => {
    mockServices = mockServices.map(s => s.id === id ? { ...s, ...updates } : s);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const deleteService = (id) => {
    mockServices = mockServices.filter(s => s.id !== id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const [inventory, setInventory] = useState(mockInventory.filter(i => i.tenant_id === tenantId));
  const addInventory = (item) => {
    const newI = { ...item, id: Date.now(), tenant_id: tenantId, status: item.stock <= item.minStock ? 'low' : 'ok' };
    mockInventory.push(newI);
    setInventory(prev => [newI, ...prev]);
  };
  const updateInventoryItem = (id, updates) => {
    setInventory(prev => prev.map(i => {
      if (i.id !== id) return i;
      const n = { ...i, ...updates };
      const finalized = { ...n, status: n.stock <= n.minStock ? 'low' : 'ok' };
      mockInventory = mockInventory.map(mi => mi.id === id ? finalized : mi);
      return finalized;
    }));
  };
  const updateStock = (id, delta) => {
    setInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newStock = Math.max(0, item.stock + delta);
      const finalized = { ...item, stock: newStock, status: newStock <= item.minStock ? 'low' : 'ok' };
      mockInventory = mockInventory.map(mi => mi.id === id ? finalized : mi);
      return finalized;
    }));
  };

  const [appointments, setAppointments] = useState(mockAppointments.filter(a => a.tenant_id === tenantId));
  const addAppointment = (app) => {
    const newA = { ...app, id: Date.now(), tenant_id: tenantId, status: 'Confirmada', doctor: app.doctor || 'Dra. Fabiola Rodríguez' };
    mockAppointments.push(newA);
    setAppointments(prev => [...prev, newA]);
  };
  const updateAppointment = (id, updates) => {
    mockAppointments = mockAppointments.map(a => a.id === id ? { ...a, ...updates } : a);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };
  const deleteAppointment = (id) => {
    mockAppointments = mockAppointments.filter(a => a.id !== id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const [payments, setPayments] = useState(mockPayments.filter(p => p.tenant_id === tenantId));
  const addPayment = (p) => {
    const newP = { ...p, id: Date.now(), tenant_id: tenantId, date: new Date().toISOString().split('T')[0], status: 'Pagado' };
    mockPayments.push(newP);
    setPayments(prev => [newP, ...prev]);
  };
  const deletePayment = (id) => {
    mockPayments = mockPayments.filter(p => p.id !== id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };
  const updatePayment = (id, updates) => {
    mockPayments = mockPayments.map(p => p.id === id ? { ...p, ...updates } : p);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <GlobalContext.Provider value={{
      clients, addClient, updateClient, addHistory,
      services, addService, updateService, deleteService,
      inventory, addInventory, updateInventoryItem, updateStock,
      appointments, addAppointment, updateAppointment, deleteAppointment,
      payments, addPayment, deletePayment, updatePayment,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const getTenants = () => MOCK_TENANTS;
export const getTenantBySubdomain = (subdomain) => MOCK_TENANTS.find(t => t.subdomain === subdomain);
export const addTenant = (tenant) => { MOCK_TENANTS.push({ ...tenant, id: tenant.subdomain, active: true }); };
export const toggleTenantActive = (subdomain) => { MOCK_TENANTS = MOCK_TENANTS.map(t => t.subdomain === subdomain ? { ...t, active: !t.active } : t); };
