import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();
export const useGlobalState = () => useContext(GlobalContext);

const todayStr = new Date().toISOString().split('T')[0];

export const GlobalProvider = ({ children }) => {

  // ── PACIENTES ──────────────────────────────────────────
  const [clients, setClients] = useState([
    { id: 1, doc: '1010123456', name: 'Ana Rodríguez',  phone: '+57 300 123 4567', lastVisit: '10 Ago 2026', totalVisits: 4, history: [{ id: 1, date: '10 Ago 2026', title: 'Aplicación Bótox (3 Zonas)', doctor: 'Dra. Fabiola Rodríguez', notes: 'Paciente acude a sesión de retoque. Se aplican 20 unidades adicionales en el tercio superior. Sin reacciones.' }] },
    { id: 2, doc: '52345678',   name: 'María Gómez',    phone: '+57 320 987 6543', lastVisit: '05 Jul 2026', totalVisits: 1, history: [] },
    { id: 3, doc: '90012345',   name: 'Carlos Mendoza', phone: '+57 311 444 5555', lastVisit: '-',            totalVisits: 0, history: [] }
  ]);
  const addClient   = (client) => setClients(prev => [{ ...client, id: Date.now(), totalVisits: 0, history: [], lastVisit: '-' }, ...prev]);
  const updateClient= (id, updates) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const addHistory  = (clientId, entry) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, history: [{ ...entry, id: Date.now(), date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }, ...c.history] } : c));

  // ── SERVICIOS ──────────────────────────────────────────
  const [services, setServices] = useState([
    { id: 1, name: 'Aplicación Bótox (3 Zonas)',       category: 'Inyectables',  duration: 45, price: 850000, color: '#3b82f6' },
    { id: 2, name: 'Depilación Láser (Cuerpo Completo)', category: 'Aparatología', duration: 60, price: 450000, color: '#2dd4bf' },
    { id: 3, name: 'Limpieza Facial Profunda',          category: 'Cosmetología', duration: 90, price: 180000, color: '#8b5cf6' }
  ]);
  const addService    = (s)  => setServices(prev => [{ ...s, id: Date.now() }, ...prev]);
  const updateService = (id, updates) => setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const deleteService = (id) => setServices(prev => prev.filter(s => s.id !== id));

  // ── INVENTARIO ─────────────────────────────────────────
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Toxina Botulínica (Vial 100u)',    category: 'Inyectables',    stock: 2,  minStock: 5,  status: 'low' },
    { id: 2, name: 'Ácido Hialurónico (Jeringa 1ml)', category: 'Inyectables',    stock: 15, minStock: 10, status: 'ok'  },
    { id: 3, name: 'Gel Conductor Láser (Galón)',      category: 'Insumos',        stock: 1,  minStock: 3,  status: 'low' },
    { id: 4, name: 'Agujas 30G x 13mm (Cajas)',        category: 'Material Médico',stock: 24, minStock: 10, status: 'ok'  }
  ]);
  const addInventory = (item) => setInventory(prev => [{ ...item, id: Date.now(), status: item.stock <= item.minStock ? 'low' : 'ok' }, ...prev]);
  const updateInventoryItem = (id, updates) => setInventory(prev => prev.map(i => {
    if (i.id !== id) return i;
    const n = { ...i, ...updates };
    return { ...n, status: n.stock <= n.minStock ? 'low' : 'ok' };
  }));
  const updateStock  = (id, delta) => setInventory(prev => prev.map(item => {
    if (item.id !== id) return item;
    const newStock = Math.max(0, item.stock + delta);
    return { ...item, stock: newStock, status: newStock <= item.minStock ? 'low' : 'ok' };
  }));

  // ── CITAS ──────────────────────────────────────────────
  const [appointments, setAppointments] = useState([
    { id: 1, clientId: 1, serviceId: 1, date: todayStr, time: '10:00', duration: 45, status: 'Confirmada', doctor: 'Dra. Fabiola Rodríguez' },
    { id: 2, clientId: 2, serviceId: 2, date: todayStr, time: '11:00', duration: 60, status: 'En Espera',  doctor: 'Dra. Fabiola Rodríguez' }
  ]);
  const addAppointment    = (app) => setAppointments(prev => [...prev, { ...app, id: Date.now(), status: 'Confirmada', doctor: app.doctor || 'Dra. Fabiola Rodríguez' }]);
  const updateAppointment = (id, updates) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  const deleteAppointment = (id) => setAppointments(prev => prev.filter(a => a.id !== id));

  // ── PAGOS ──────────────────────────────────────────────
  const [payments, setPayments] = useState([
    { id: 1, clientId: 1, serviceId: 1, appointmentId: 1, amount: 850000, method: 'Tarjeta', date: todayStr, note: '', status: 'Pagado' },
  ]);
  const addPayment    = (p)  => setPayments(prev => [{ ...p, id: Date.now(), date: new Date().toISOString().split('T')[0], status: 'Pagado' }, ...prev]);
  const deletePayment = (id) => setPayments(prev => prev.filter(p => p.id !== id));
  const updatePayment = (id, updates) => setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

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
