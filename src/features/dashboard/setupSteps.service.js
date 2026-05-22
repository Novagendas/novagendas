import { supabase } from '../../Supabase/supabaseClient'

// Paso_keys válidos en orden de aparición en UI.
// 'servicios' es obligatorio; el resto son opcionales o condicionales.
export const ALL_STEP_KEYS = [
  'servicios',        // obligatorio
  'agenda_google',    // opcional
  'pacientes',        // opcional
  'dias_bloqueados',  // opcional
  'pagos',            // opcional
  'inventario',       // opcional
  'estadisticas',     // opcional
  'usuarios',         // opcional
  'perfil',           // opcional
  'movimientos',      // opcional
  'bot',              // condicional (solo si bot activo)
]

/**
 * Obtiene los pasos de configuración de un negocio.
 * Los pasos sin fila en DB se consideran no completados.
 *
 * @param {number} idnegocios
 * @returns {Promise<Array<{ paso_key: string, completado: boolean }>>}
 */
export async function fetchSetupSteps(idnegocios) {
  try {
    const { data, error } = await supabase
      .from('setup_pasos')
      .select('paso_key, completado')
      .eq('idnegocios', idnegocios)

    if (error) {
      console.error('[setupSteps] Error al obtener pasos:', error)
      return []
    }

    return data ?? []
  } catch (err) {
    console.error('[setupSteps] Error inesperado en fetchSetupSteps:', err)
    return []
  }
}

/**
 * Inicializa filas para los pasos que aún no existen en la tabla.
 * Usa ignoreDuplicates para que sea idempotente y seguro llamarlo
 * cada vez que se carga el componente.
 *
 * @param {number} idnegocios
 * @param {string[]} stepKeys - Lista de paso_keys a garantizar
 * @returns {Promise<{ error: object|null }>}
 */
export async function ensureStepsExist(idnegocios, stepKeys) {
  try {
    const rows = stepKeys.map((paso_key) => ({
      idnegocios,
      paso_key,
      completado: false,
      completado_at: null,
    }))

    const { error } = await supabase
      .from('setup_pasos')
      .upsert(rows, { onConflict: 'idnegocios,paso_key', ignoreDuplicates: true })

    if (error) {
      console.error('[setupSteps] Error al inicializar pasos:', error)
    }

    return { error: error ?? null }
  } catch (err) {
    console.error('[setupSteps] Error inesperado en ensureStepsExist:', err)
    return { error: err }
  }
}

/**
 * Marca un paso como completado o no completado.
 *
 * @param {number} idnegocios
 * @param {string} paso_key
 * @param {boolean} completado
 * @returns {Promise<{ error: object|null }>}
 */
export async function toggleStepComplete(idnegocios, paso_key, completado) {
  try {
    const row = {
      idnegocios,
      paso_key,
      completado,
      completado_at: completado ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('setup_pasos')
      .upsert(row, { onConflict: 'idnegocios,paso_key' })

    if (error) {
      console.error('[setupSteps] Error al actualizar paso:', error)
    }

    return { error: error ?? null }
  } catch (err) {
    console.error('[setupSteps] Error inesperado en toggleStepComplete:', err)
    return { error: err }
  }
}
