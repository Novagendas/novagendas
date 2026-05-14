import { createClient } from '@supabase/supabase-js'

const hostname = window.location.hostname

// Detección por URL en runtime: *.dev.novagendas.com → dev DB
// Fallback a VITE_ENV para desarrollo local (localhost)
export const isDevEnvironment =
  hostname.includes('.dev.novagendas.com') ||
  hostname === 'dev.novagendas.com' ||
  import.meta.env.VITE_ENV === 'development'

const supabaseUrl = isDevEnvironment
  ? import.meta.env.VITE_SUPABASE_URL_DEV
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isDevEnvironment
  ? import.meta.env.VITE_SUPABASE_ANON_KEY_DEV
  : import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const envLabel = isDevEnvironment ? 'desarrollo (VITE_SUPABASE_URL_DEV / VITE_SUPABASE_ANON_KEY_DEV)' : 'producción (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'
  console.error(`Faltan variables de entorno de Supabase para ${envLabel}`)
}

// ── Singleton guard: se crea UNA sola instancia por sesión ──
if (!globalThis.__novagendas_supabase__) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });

  globalThis.__novagendas_supabase__ = client;
}

export const supabase = globalThis.__novagendas_supabase__

// Cliente anónimo sin sesión — para consultas que deben ser siempre públicas
// (ej: detección de tenant en App.jsx) sin riesgo de 403 por token heredado
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
})

export const insertLog = async ({ accion, entidad, descripcion, idUsuario, idNegocios }) => {
  try {
    const payload = {
      accion,
      entidad,
      descripcion,
      idusuario: idUsuario || null,
      idnegocios: idNegocios || null
    };
    await supabase.from('logsnegocio').insert([payload]);
  } catch (e) {
    console.error("Error logging activity:", e);
  }
};

