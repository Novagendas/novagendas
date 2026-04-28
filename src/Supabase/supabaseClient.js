import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)")
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

