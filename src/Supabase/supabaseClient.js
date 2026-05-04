import { createClient } from '@supabase/supabase-js'

// Detectar entorno
const isDevelopment = import.meta.env.VITE_ENV === 'development' || import.meta.env.ENV === 'development'

// Usar credenciales basadas en el entorno
const supabaseUrl = isDevelopment
  ? import.meta.env.VITE_SUPABASE_URL_DEV || import.meta.env.URL_DATABASE_DEV
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isDevelopment
  ? import.meta.env.VITE_SUPABASE_ANON_KEY_DEV || import.meta.env.PUBLIC_KEY_DEV
  : import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const envType = isDevelopment ? 'desarrollo' : 'producción'
  console.error(`Faltan variables de entorno de Supabase para ${envType} (VITE_SUPABASE_URL${isDevelopment ? '_DEV' : ''}, VITE_SUPABASE_ANON_KEY${isDevelopment ? '_DEV' : ''})`)
}

// ── Singleton guard: se crea UNA sola instancia por sesión ──
const SUPABASE_INSTANCE_KEY = '__novagendas_supabase__'

if (!globalThis[SUPABASE_INSTANCE_KEY]) {
  globalThis[SUPABASE_INSTANCE_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  })
}

export const supabase = globalThis[SUPABASE_INSTANCE_KEY]

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

