import { createClient } from '@supabase/supabase-js'

const isDevelopment = import.meta.env.VITE_ENV === 'development'

const supabaseUrl = isDevelopment
  ? import.meta.env.VITE_SUPABASE_URL_DEV
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isDevelopment
  ? import.meta.env.VITE_SUPABASE_ANON_KEY_DEV
  : import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const envLabel = isDevelopment ? 'desarrollo (VITE_SUPABASE_URL_DEV / VITE_SUPABASE_ANON_KEY_DEV)' : 'producción (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'
  console.error(`Faltan variables de entorno de Supabase para ${envLabel}`)
}

// ── Singleton guard: se crea UNA sola instancia por sesión ──
if (!globalThis.__novagendas_supabase__) {
  globalThis.__novagendas_supabase__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  })
}

export const supabase = globalThis.__novagendas_supabase__

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

