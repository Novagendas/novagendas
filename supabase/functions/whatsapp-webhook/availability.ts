import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_START_MINUTES = 8 * 60;   // 8:00 AM
const DEFAULT_END_MINUTES   = 20 * 60;  // 8:00 PM
const DEFAULT_DAYS          = [1, 2, 3, 4, 5, 6]; // Mon-Sat

interface JornadaBlock {
  habilitado: boolean;
  inicio: string; // "HH:MM"
  fin: string;    // "HH:MM"
}

interface DayJornadas {
  manana: JornadaBlock;
  tarde: JornadaBlock;
  noche: JornadaBlock;
}

interface BotConfig {
  dias_disponibles: number[];
  hora_inicio: string;  // "HH:MM:SS" — legacy fallback
  hora_fin: string;     // "HH:MM:SS" — legacy fallback
  jornadas: DayJornadas | null;
  horarios_por_dia: Record<string, DayJornadas> | null;
}

async function fetchBotConfig(
  supabase: SupabaseClient,
  idnegocios: number
): Promise<BotConfig | null> {
  const { data } = await supabase
    .from("bot_config")
    .select("dias_disponibles, hora_inicio, hora_fin, jornadas, horarios_por_dia")
    .eq("idnegocios", idnegocios)
    .maybeSingle();

  return (data as BotConfig | null) ?? null;
}

function getSlotRanges(
  config: BotConfig | null
): Array<{ start: number; end: number }> {
  if (config?.jornadas) {
    const { manana, tarde, noche } = config.jornadas;
    const ranges: Array<{ start: number; end: number }> = [];
    if (manana?.habilitado) ranges.push({ start: timeStrToMinutes(manana.inicio), end: timeStrToMinutes(manana.fin) });
    if (tarde?.habilitado)  ranges.push({ start: timeStrToMinutes(tarde.inicio),  end: timeStrToMinutes(tarde.fin)  });
    if (noche?.habilitado)  ranges.push({ start: timeStrToMinutes(noche.inicio),  end: timeStrToMinutes(noche.fin)  });
    if (ranges.length > 0) return ranges;
  }
  // fallback a rango único legacy
  const start = config?.hora_inicio ? timeStrToMinutes(config.hora_inicio) : DEFAULT_START_MINUTES;
  const end   = config?.hora_fin    ? timeStrToMinutes(config.hora_fin)    : DEFAULT_END_MINUTES;
  return [{ start, end }];
}

function getSlotRangesForDay(
  config: BotConfig | null,
  dayOfWeek: string
): Array<{ start: number; end: number }> {
  const dayJornadas = config?.horarios_por_dia?.[dayOfWeek];
  if (dayJornadas) {
    const { manana, tarde, noche } = dayJornadas;
    const ranges: Array<{ start: number; end: number }> = [];
    if (manana?.habilitado) ranges.push({ start: timeStrToMinutes(manana.inicio), end: timeStrToMinutes(manana.fin) });
    if (tarde?.habilitado)  ranges.push({ start: timeStrToMinutes(tarde.inicio),  end: timeStrToMinutes(tarde.fin)  });
    if (noche?.habilitado)  ranges.push({ start: timeStrToMinutes(noche.inicio),  end: timeStrToMinutes(noche.fin)  });
    if (ranges.length > 0) return ranges;
  }
  // fall back to global jornadas
  return getSlotRanges(config);
}

function timeStrToMinutes(timeStr: string): number {
  // "HH:MM" or "HH:MM:SS" -> minutes from midnight
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function isoTimeToMinutes(isoStr: string): number {
  // "2026-05-11T10:00:00" -> 600
  const timePart = isoStr.slice(11, 16);
  return timeStrToMinutes(timePart);
}

function generateSlots(
  durationMinutes: number,
  startMinutes: number,
  endMinutes: number
): string[] {
  const slots: string[] = [];
  for (let start = startMinutes; start + durationMinutes <= endMinutes; start += durationMinutes) {
    const h = Math.floor(start / 60);
    const m = start % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

function isAllowedDay(dateStr: string, allowedDays: number[]): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dt = new Date(year, month - 1, day);
  return allowedDays.includes(dt.getDay());
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dt = new Date(year, month - 1, day + days);
  return dt.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getSpecialistIds(
  supabase: SupabaseClient,
  idnegocios: number
): Promise<number[]> {
  const { data: links } = await supabase
    .from("negociousuario")
    .select("idusuario")
    .eq("idnegocios", idnegocios);

  const userIds = (links ?? []).map((l: { idusuario: number }) => l.idusuario);
  if (userIds.length === 0) return [];

  const { data: rolData } = await supabase
    .from("rolpermisos")
    .select("idusuario")
    .eq("idrol", 3)
    .in("idusuario", userIds);

  return (rolData ?? []).map((r: { idusuario: number }) => r.idusuario);
}

export async function getAvailableSlots(
  supabase: SupabaseClient,
  idnegocios: number,
  especialistaId: number | null,
  fecha: string,
  durationMinutes: number
): Promise<string[]> {
  const config = await fetchBotConfig(supabase, idnegocios);

  const [year, month, day] = fecha.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const ranges = getSlotRangesForDay(config, String(dayOfWeek));
  const allSlots = ranges.flatMap((r) => generateSlots(durationMinutes, r.start, r.end));

  if (allSlots.length === 0) return [];

  if (especialistaId !== null) {
    // Especialista específico: verificar solo sus citas
    const { data } = await supabase
      .from("cita")
      .select("fechahorainicio, fechahorafin")
      .eq("idnegocios", idnegocios)
      .eq("idusuario", especialistaId)
      .neq("idestadocita", 3)
      .gte("fechahorainicio", `${fecha}T00:00:00`)
      .lt("fechahorainicio", `${fecha}T24:00:00`);

    const occupied = ((data ?? []) as { fechahorainicio: string; fechahorafin: string }[]).map(
      (a) => ({ startMin: isoTimeToMinutes(a.fechahorainicio), endMin: isoTimeToMinutes(a.fechahorafin) })
    );

    return allSlots.filter((slot) => {
      const s = timeStrToMinutes(slot);
      const e = s + durationMinutes;
      return !occupied.some((o) => o.startMin < e && o.endMin > s);
    });
  }

  // Sin preferencia de especialista: un slot está disponible si al menos uno está libre
  const specialistIds = await getSpecialistIds(supabase, idnegocios);

  if (specialistIds.length === 0) return allSlots;

  const { data: apptData } = await supabase
    .from("cita")
    .select("fechahorainicio, fechahorafin, idusuario")
    .eq("idnegocios", idnegocios)
    .neq("idestadocita", 3)
    .gte("fechahorainicio", `${fecha}T00:00:00`)
    .lt("fechahorainicio", `${fecha}T24:00:00`);

  type ApptRow = { fechahorainicio: string; fechahorafin: string; idusuario: number | null };
  const appointments = (apptData ?? []) as ApptRow[];

  return allSlots.filter((slot) => {
    const s = timeStrToMinutes(slot);
    const e = s + durationMinutes;
    return specialistIds.some((espId) => {
      const espAppts = appointments.filter((a) => a.idusuario === espId);
      return !espAppts.some((a) =>
        isoTimeToMinutes(a.fechahorainicio) < e && isoTimeToMinutes(a.fechahorafin) > s
      );
    });
  });
}

async function fetchBlockedDates(
  supabase: SupabaseClient,
  idnegocios: number
): Promise<Set<string>> {
  const { data } = await supabase
    .from("diasbloqueados")
    .select("fecha")
    .eq("idnegocios", idnegocios);
  return new Set((data ?? []).map((r: { fecha: string }) => r.fecha));
}

export type CustomDateValidation =
  | { valid: true }
  | { valid: false; reason: "day_of_week"; allowedDays: number[] }
  | { valid: false; reason: "blocked" };

export async function validateCustomDate(
  supabase: SupabaseClient,
  idnegocios: number,
  fecha: string
): Promise<CustomDateValidation> {
  const config = await fetchBotConfig(supabase, idnegocios);
  const allowedDays = config?.dias_disponibles ?? DEFAULT_DAYS;

  if (!isAllowedDay(fecha, allowedDays)) {
    return { valid: false, reason: "day_of_week", allowedDays };
  }

  const blocked = await fetchBlockedDates(supabase, idnegocios);
  if (blocked.has(fecha)) {
    return { valid: false, reason: "blocked" };
  }

  return { valid: true };
}

export async function getAvailableDates(
  supabase: SupabaseClient,
  idnegocios: number,
  especialistaId: number | null,
  durationMinutes: number
): Promise<string[]> {
  const config = await fetchBotConfig(supabase, idnegocios);
  const allowedDays = config?.dias_disponibles ?? DEFAULT_DAYS;
  const blocked = await fetchBlockedDates(supabase, idnegocios);

  const dates: string[] = [];
  let cursor = addDays(todayStr(), 1);
  let checked = 0;

  while (dates.length < 7 && checked < 30) {
    if (isAllowedDay(cursor, allowedDays) && !blocked.has(cursor)) {
      const slots = await getAvailableSlots(supabase, idnegocios, especialistaId, cursor, durationMinutes);
      if (slots.length > 0) dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
    checked++;
  }

  return dates;
}
