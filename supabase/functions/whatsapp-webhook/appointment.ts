import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const STATUS_ACTIVE = 2;     // "En Espera"
const STATUS_CANCELLED = 3;  // "Cancelada"

export interface ClientRecord {
  idcliente: number;
  nombre: string;
  apellido: string;
  email: string | null;
}

export interface AppointmentSummary {
  idcita: number;
  fecha: string;
  hora: string;
  servicio: string;
}

export async function getClientByCedula(
  supabase: SupabaseClient,
  idnegocios: number,
  cedula: string
): Promise<ClientRecord | null> {
  const { data } = await supabase
    .from("cliente")
    .select("idcliente, nombre, apellido, email")
    .eq("idnegocios", idnegocios)
    .eq("cedula", cedula.trim())
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function createAppointment(
  supabase: SupabaseClient,
  idnegocios: number,
  idcliente: number,
  idusuario: number | null,
  idservicios: number,
  fechahorainicio: string,
  fechahorafin: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("cita")
    .insert([{
      idnegocios,
      idcliente,
      idusuario,
      idservicio: idservicios,
      fechahorainicio,
      fechahorafin,
      idestadocita: STATUS_ACTIVE,
    }])
    .select("idcita")
    .single();

  if (error || !data) return null;

  await supabase.from("citaservicios").insert([{ idcita: data.idcita, idservicios }]);

  return (data as { idcita: number }).idcita;
}

export async function getUpcomingAppointments(
  supabase: SupabaseClient,
  idnegocios: number,
  idcliente: number
): Promise<AppointmentSummary[]> {
  const now = new Date().toISOString().slice(0, 19);

  const { data } = await supabase
    .from("cita")
    .select(`
      idcita,
      fechahorainicio,
      citaservicios ( servicios:idservicios ( nombre ) )
    `)
    .eq("idnegocios", idnegocios)
    .eq("idcliente", idcliente)
    .neq("idestadocita", STATUS_CANCELLED)
    .gte("fechahorainicio", now)
    .order("fechahorainicio", { ascending: true })
    .limit(10);

  return (data ?? []).map((a: unknown) => {
    const appt = a as {
      idcita: number;
      fechahorainicio: string;
      citaservicios: Array<{ servicios: { nombre: string } }>;
    };
    const iso = appt.fechahorainicio;
    const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
    const dt = new Date(year, month - 1, day);
    const fecha = dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    const hora = iso.slice(11, 16);
    const servicio = appt.citaservicios?.[0]?.servicios?.nombre ?? "Servicio";
    return { idcita: appt.idcita, fecha, hora, servicio };
  });
}

export async function cancelAppointment(
  supabase: SupabaseClient,
  idcita: number,
  idnegocios: number
): Promise<boolean> {
  const { error } = await supabase
    .from("cita")
    .update({ idestadocita: STATUS_CANCELLED })
    .eq("idcita", idcita)
    .eq("idnegocios", idnegocios);

  return !error;
}

export async function updateAppointment(
  supabase: SupabaseClient,
  idcita: number,
  idnegocios: number,
  fechahorainicio: string,
  fechahorafin: string
): Promise<boolean> {
  const { error } = await supabase
    .from("cita")
    .update({ fechahorainicio, fechahorafin })
    .eq("idcita", idcita)
    .eq("idnegocios", idnegocios);

  return !error;
}

export async function createClient(
  supabase: SupabaseClient,
  idnegocios: number,
  cedula: string,
  fullName: string,
  email: string,
  telefono: string
): Promise<ClientRecord | null> {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const nombre = parts[0];
  const apellido = parts.slice(1).join(" ") || ".";

  const { data, error } = await supabase
    .from("cliente")
    .insert([{
      idnegocios,
      cedula: cedula.trim(),
      nombre,
      apellido,
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
    }])
    .select("idcliente, nombre, apellido, email")
    .single();

  if (error || !data) {
    console.warn("createClient failed:", error?.message);
    return null;
  }

  return data as ClientRecord;
}
