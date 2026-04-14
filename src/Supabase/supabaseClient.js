import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const insertLog = async ({ accion, entidad, descripcion, idUsuario, idNegocios }) => {
  // If we don't have user or business, we still try or we can decide a default.
  // For SuperAdmin actions, idNegocios might be null/undefined.
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
