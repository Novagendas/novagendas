import { createClient } from '@supabase/supabase-js'

const hostname = window.location.hostname

// Detección por URL en runtime: dev-{tenant}.novagendas.com → dev DB
// Fallback a VITE_ENV para desarrollo local (localhost)
export const isDevEnvironment =
  hostname.split('.')[0].startsWith('dev-') ||
  import.meta.env.VITE_ENV === 'development'

export const supabaseUrl = isDevEnvironment
  ? import.meta.env.VITE_SUPABASE_URL_DEV
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isDevEnvironment
  ? import.meta.env.VITE_SUPABASE_ANON_KEY_DEV
  : import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const envLabel = isDevEnvironment ? 'desarrollo (VITE_SUPABASE_URL_DEV / VITE_SUPABASE_ANON_KEY_DEV)' : 'producción (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'
  console.error(`Faltan variables de entorno de Supabase para ${envLabel}`)
}

const realSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});

const realSupabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});

// --- Mock Database Engine ---
const getInitialMockData = (table) => {
  if (table === 'negociousuario') {
    return [{ idusuario: 'demo-user', idnegocios: 'demo', es_principal: true }];
  }
  if (table === 'rolpermisos') {
    return [{ idusuario: 'demo-user', idrol: 3, idpermiso: 1 }];
  }
  if (table === 'usuario') {
    return [{ idusuario: 'demo-user', nombre: 'Daniel', apellido: 'González', email: 'demo@novagendas.com', role: 'admin', tour: true }];
  }
  if (table === 'metodopago') {
    return [
      { idmetodopago: 1, tipo: 'Efectivo' },
      { idmetodopago: 2, tipo: 'Transferencia' },
      { idmetodopago: 3, tipo: 'Tarjeta de Crédito' },
      { idmetodopago: 4, tipo: 'Tarjeta de Débito' }
    ];
  }
  return [];
};

const mockDatabase = {};

const getMockData = (table) => {
  if (!mockDatabase[table]) {
    mockDatabase[table] = getInitialMockData(table);
  }
  return mockDatabase[table];
};

const saveMockData = (table, data) => {
  mockDatabase[table] = data;
};

const getIdKeyForTable = (table) => {
  if (table === 'cliente') return 'idcliente';
  if (table === 'servicios') return 'idservicios';
  if (table === 'cita') return 'idcita';
  if (table === 'ubicacion') return 'idubicacion';
  if (table === 'producto') return 'idproducto';
  if (table === 'usuario') return 'idusuario';
  if (table === 'pagos') return 'idpago';
  if (table === 'abono') return 'idabono';
  if (table === 'historialclinico') return 'idhistorial';
  if (table === 'negociousuario') return 'idusuario';
  if (table === 'categoriaservicio') return 'idcategoriaservicio';
  if (table === 'categoriaproducto') return 'idcategoriaproducto';
  if (table === 'diasbloqueados') return 'iddiasbloqueados';
  return 'id';
};

const executeMockQuery = async (table, method, filters, payload, options = {}) => {
  let data = getMockData(table);

  if (table === 'logsnegocio' && method === 'insert') {
    return { data: payload, error: null };
  }

  // Filter evaluation
  if (method === 'select' || method === 'update' || method === 'delete') {
    filters.forEach(f => {
      if (f.type === 'eq') {
        data = data.filter(item => {
          let itemVal = item[f.column];
          let queryVal = f.value;
          if (itemVal == null || queryVal == null) return itemVal == queryVal;
          return String(itemVal) === String(queryVal);
        });
      } else if (f.type === 'neq') {
        data = data.filter(item => {
          let itemVal = item[f.column];
          let queryVal = f.value;
          if (itemVal == null && queryVal == null) return false;
          if (itemVal == null || queryVal == null) return true;
          return String(itemVal) !== String(queryVal);
        });
      } else if (f.type === 'is') {
        data = data.filter(item => {
          const val = item[f.column];
          // treat undefined and null as equivalent (new records lack the field)
          if (f.value === null) return val == null;
          return val === f.value;
        });
      } else if (f.type === 'in') {
        data = data.filter(item => {
          const vals = Array.isArray(f.values) ? f.values : [f.values];
          return vals.map(String).includes(String(item[f.column]));
        });
      } else if (f.type === 'gte') {
        data = data.filter(item => {
          const val = item[f.column];
          if (val == null) return false;
          return String(val) >= String(f.value);
        });
      } else if (f.type === 'lte') {
        data = data.filter(item => {
          const val = item[f.column];
          if (val == null) return false;
          return String(val) <= String(f.value);
        });
      } else if (f.type === 'gt') {
        data = data.filter(item => {
          const val = item[f.column];
          if (val == null) return false;
          return String(val) > String(f.value);
        });
      } else if (f.type === 'lt') {
        data = data.filter(item => {
          const val = item[f.column];
          if (val == null) return false;
          return String(val) < String(f.value);
        });
      } else if (f.type === 'ilike' || f.type === 'like') {
        data = data.filter(item => {
          const val = String(item[f.column] || '').toLowerCase();
          const pattern = f.value.replace(/%/g, '').toLowerCase();
          return val.includes(pattern);
        });
      } else if (f.type === 'not_is') {
        data = data.filter(item => {
          const val = item[f.column];
          if (f.value === null) return val != null;
          return val !== f.value;
        });
      }
    });
  }

  if (method === 'select') {
    // Ordering
    if (options.ordering) {
      const col = options.ordering.column;
      const asc = options.ordering.ascending;
      data.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        return asc 
          ? String(valA || '').localeCompare(String(valB || '')) 
          : String(valB || '').localeCompare(String(valA || ''));
      });
    }

    // Limit
    if (options.limit != null) {
      data = data.slice(0, options.limit);
    }

    // Single result formatting
    if (options.isSingle || options.isMaybeSingle) {
      return { data: data[0] || null, error: null };
    }

    // Nesting relations for UI dependencies
    if (table === 'cliente') {
      const allHistorial = getMockData('historialclinico');
      data = data.map(item => {
        const clientId = item.idcliente || item.id;
        const historial = allHistorial.filter(h =>
          String(h.idcliente) === String(clientId)
        );
        return { 
          ...item, 
          apellido: item.apellido || '',
          historialclinico: historial 
        };
      });
    }

    if (table === 'servicios') {
      const allCategories = getMockData('categoriaservicio');
      data = data.map(item => {
        const cat = allCategories.find(c => String(c.idcategoriaservicio) === String(item.idcategoriaservicio));
        return {
          ...item,
          categoriaservicio: cat ? { descripcion: cat.descripcion } : null
        };
      });
    }

    if (table === 'pagos') {
      const allClients = getMockData('cliente');
      const allServices = getMockData('servicios');
      data = data.map(item => {
        const client = allClients.find(c => String(c.idcliente || c.id) === String(item.idcliente));
        const svc = allServices.find(s => String(s.idservicios || s.id) === String(item.idservicios));
        return {
          ...item,
          cliente: client || null,
          servicios: svc || null
        };
      });
    }

    if (table === 'abono') {
      const allClients = getMockData('cliente');
      const allServices = getMockData('servicios');
      const allMethods = getMockData('metodopago');
      data = data.map(item => {
        const client = allClients.find(c => String(c.idcliente || c.id) === String(item.idcliente));
        const svc = allServices.find(s => String(s.idservicios || s.id) === String(item.idservicios));
        const meth = allMethods.find(m => String(m.idmetodopago || m.id) === String(item.idmetodopago));
        return {
          ...item,
          cliente: client || null,
          servicios: svc || null,
          metodopago: meth ? { tipo: meth.tipo } : null
        };
      });
    }

    if (table === 'cita') {
      const allServices = getMockData('servicios');
      const allCitaServicios = getMockData('citaservicios');
      const allCitaProductos = getMockData('citaproducto');
      const allAbonoAplicaciones = getMockData('abonoaplicacion');
      const allGroupDetails = getMockData('detallecitagrupal');
      const allClients = getMockData('cliente');

      data = data.map(item => {
        const apptServices = allCitaServicios
          .filter(cs => String(cs.idcita) === String(item.id || item.idcita))
          .map(cs => {
            const svc = allServices.find(s => String(s.idservicios || s.id) === String(cs.idservicios));
            return { idservicios: cs.idservicios, servicios: svc || null };
          });

        const apptProducts = allCitaProductos
          .filter(cp => String(cp.idcita) === String(item.id || item.idcita))
          .map(cp => ({ idproducto: cp.idproducto, cantidad: cp.cantidad }));

        const apptAbonos = allAbonoAplicaciones
          .filter(aa => String(aa.idcita) === String(item.id || item.idcita))
          .map(aa => ({ idabono: aa.idabono, monto_aplicado: aa.monto_aplicado }));

        const groupDetails = allGroupDetails
          .filter(gd => String(gd.idcita) === String(item.id || item.idcita))
          .map(gd => ({ idcliente: gd.idcliente }));

        return {
          ...item,
          cliente: allClients.find(c => String(c.idcliente || c.id) === String(item.idcliente)) || null,
          estadocita: { descripcion: item.status || 'En Espera' },
          usuario: { nombre: 'Daniel', apellido: 'González' },
          citaservicios: apptServices,
          detallecitagrupal: groupDetails,
          citaproducto: apptProducts,
          abonoaplicacion: apptAbonos
        };
      });
    }

    if (table === 'rolpermisos') {
      data = data.map(item => ({
        ...item,
        usuario: {
          idusuario: 'demo-user',
          nombre: 'Daniel',
          apellido: 'González',
          email: 'demo@novagendas.com',
          profesion: 'Administrador',
          deleted_at: null
        }
      }));
    }

    return { data, error: null };
  }

  if (method === 'insert') {
    const rawData = getMockData(table);
    const idKey = getIdKeyForTable(table);
    const now = new Date().toISOString();

    const newRecords = (Array.isArray(payload) ? payload : [payload]).map(item => {
      const newId = item[idKey] || Math.floor(100000 + Math.random() * 900000);
      const base = {
        [idKey]: newId,
        deleted_at: null,
        ...item
      };
      // Auto-inject timestamp defaults if not present
      if (table === 'cliente' && !base.fecharegistro) base.fecharegistro = now;
      if (table === 'historialclinico' && !base.fecha) base.fecha = now;
      if (table === 'cita' && !base.created_at) base.created_at = now;
      if (table === 'servicios' && !base.created_at) base.created_at = now;
      if (table === 'producto' && !base.created_at) base.created_at = now;
      if (table === 'pagos' && !base.fecha_pago) base.fecha_pago = now;
      return base;
    });

    rawData.push(...newRecords);
    saveMockData(table, rawData);

    const returnVal = Array.isArray(payload) ? newRecords : newRecords[0];
    return { data: returnVal, error: null };
  }


  if (method === 'update') {
    const rawData = getMockData(table);
    const idKey = getIdKeyForTable(table);

    const updatedIds = data.map(item => item[idKey]);
    const updatedRecords = [];

    const nextData = rawData.map(item => {
      if (updatedIds.includes(item[idKey])) {
        const updated = { ...item, ...payload };
        updatedRecords.push(updated);
        return updated;
      }
      return item;
    });

    saveMockData(table, nextData);
    const returnVal = Array.isArray(payload) ? updatedRecords : updatedRecords[0];
    return { data: returnVal, error: null };
  }

  if (method === 'delete') {
    const rawData = getMockData(table);
    const idKey = getIdKeyForTable(table);

    const deletedIds = data.map(item => item[idKey]);
    const nextData = rawData.filter(item => !deletedIds.includes(item[idKey]));

    saveMockData(table, nextData);
    return { data, error: null };
  }

  return { data: null, error: null };
};

const executeMockRpc = async (fnName, args) => {
  if (fnName === 'get_usuario_rol') {
    return { data: 'admin', error: null };
  }
  if (fnName === 'login_usuario') {
    return {
      data: [{
        idusuario: 'demo-user',
        nombre: 'Daniel',
        email: args.p_email || 'demo@novagendas.com',
        role: 'admin',
        foto_perfil: null,
        tour: true,
        idnegocios: 'demo'
      }],
      error: null
    };
  }
  if (fnName === 'has_google_integration' || fnName === 'has_whatsapp_integration') {
    return { data: false, error: null };
  }
  if (fnName === 'disconnect_google_integration' || fnName === 'disconnect_whatsapp_integration') {
    return { data: true, error: null };
  }
  if (fnName === 'validar_cambio_password') {
    return { data: true, error: null };
  }
  return { data: null, error: null };
};

const createMockBuilder = (table, method, payload = null) => {
  const chain = {
    filters: [],
    ordering: null,
    limitVal: null,
    isSingle: false,
    isMaybeSingle: false,
    isCountOnly: false,
    wantsCount: false,

    select(_fields, options = {}) {
      if (options && options.count) this.wantsCount = true;
      if (options && options.head) this.isCountOnly = true;
      return this;
    },
    insert(rows) {
      method = 'insert';
      payload = rows;
      return this;
    },
    update(fields) {
      method = 'update';
      payload = fields;
      return this;
    },
    delete() {
      method = 'delete';
      return this;
    },
    upsert(rows) {
      method = 'insert';
      payload = rows;
      return this;
    },
    eq(column, value) {
      this.filters.push({ type: 'eq', column, value });
      return this;
    },
    neq(column, value) {
      this.filters.push({ type: 'neq', column, value });
      return this;
    },
    is(column, value) {
      this.filters.push({ type: 'is', column, value });
      return this;
    },
    not(column, operator, value) {
      // Support .not('col', 'is', null) → not_is
      this.filters.push({ type: `not_${operator}`, column, value });
      return this;
    },
    in(column, values) {
      this.filters.push({ type: 'in', column, values });
      return this;
    },
    gte(column, value) {
      this.filters.push({ type: 'gte', column, value });
      return this;
    },
    lte(column, value) {
      this.filters.push({ type: 'lte', column, value });
      return this;
    },
    gt(column, value) {
      this.filters.push({ type: 'gt', column, value });
      return this;
    },
    lt(column, value) {
      this.filters.push({ type: 'lt', column, value });
      return this;
    },
    ilike(column, value) {
      this.filters.push({ type: 'ilike', column, value });
      return this;
    },
    like(column, value) {
      this.filters.push({ type: 'like', column, value });
      return this;
    },
    order(column, options = {}) {
      this.ordering = { column, ascending: options.ascending !== false };
      return this;
    },
    limit(val) {
      this.limitVal = val;
      return this;
    },
    range(_from, _to) {
      return this;
    },
    single() {
      this.isSingle = true;
      return this;
    },
    maybeSingle() {
      this.isMaybeSingle = true;
      return this;
    },
    async then(onfulfilled) {
      try {
        const result = await executeMockQuery(table, method, this.filters, payload, {
          isSingle: this.isSingle,
          isMaybeSingle: this.isMaybeSingle,
          ordering: this.ordering,
          limit: this.limitVal
        });
        if (this.wantsCount || this.isCountOnly) {
          const count = Array.isArray(result.data) ? result.data.length : 0;
          return onfulfilled({ data: this.isCountOnly ? null : result.data, count, error: result.error });
        }
        return onfulfilled(result);
      } catch (err) {
        console.error("Mock query error:", err);
        return onfulfilled({ data: null, error: err });
      }
    }
  };
  return chain;
};

const isDemo = () => localStorage.getItem('novagendas_demo_mode') === 'true';

const createClientProxy = (realClient) => {
  return new Proxy(realClient, {
    get(target, prop) {
      if (isDemo()) {
        if (prop === 'from') {
          return (table) => createMockBuilder(table, 'select');
        }
        if (prop === 'rpc') {
          return (fnName, args) => ({
            then(onfulfilled) {
              return executeMockRpc(fnName, args).then(onfulfilled);
            },
            async execute() {
              return executeMockRpc(fnName, args);
            }
          });
        }
        if (prop === 'auth') {
          return {
            signUp: async (args) => {
              return { data: { user: { id: 'demo-user', email: args.email } }, error: null };
            },
            signInWithPassword: async (args) => {
              return { data: { user: { id: 'demo-user', email: args.email } }, error: null };
            },
            signOut: async () => {
              return { error: null };
            },
            getSession: async () => {
              return { data: { session: { user: { id: 'demo-user', email: 'demo@novagendas.com' } } }, error: null };
            },
            getUser: async () => {
              return { data: { user: { id: 'demo-user', email: 'demo@novagendas.com' } }, error: null };
            },
            updateUser: async (args) => {
              return { data: { user: { id: 'demo-user', email: 'demo@novagendas.com' } }, error: null };
            }
          };
        }
        if (prop === 'functions') {
          return {
            invoke: async (fnName, args) => {
              return { data: {}, error: null };
            }
          };
        }
      }
      return target[prop];
    }
  });
};

export const supabase = createClientProxy(realSupabase);
export const supabaseAnon = createClientProxy(realSupabaseAnon);

export const insertLog = async ({ accion, entidad, descripcion, idUsuario, idNegocios }) => {
  if (isDemo()) {
    console.log("[Mock Log]", { accion, entidad, descripcion });
    return;
  }
  try {
    const payload = {
      accion,
      entidad,
      descripcion,
      idusuario: idUsuario || null,
      idnegocios: idNegocios || null
    };
    await realSupabase.from('logsnegocio').insert([payload]);
  } catch (e) {
    console.error("Error logging activity:", e);
  }
};
