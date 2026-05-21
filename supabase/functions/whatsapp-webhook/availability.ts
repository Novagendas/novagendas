import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_START_MINUTES = 8 * 60;   // 8:00 AM
const DEFAULT_END_MINUTES   = 20 * 60;  // 8:00 PM
const DEFAULT_DAYS          = [1, 2, 3, 4, 5, 6]; // Mon-Sat

interface JornadaBlock {
  habilitado: boolean;
  inicio: string; // "HH:MM"
  fin: string;    // "HH:MM"
}

interface BotConfig {
  dias_disponibles: number[];
  hora_inicio: string;  // "HH:MM:SS" — legacy fallback
  hora_fin: string;     // "HH:MM:SS" — legacy fallback
  jornadas: {
    manana: JornadaBlock;
    tarde: JornadaBlock;
    noche: JornadaBlock;
  } | null;
}

async function fetchBotConfig(
  supabase: SupabaseClient,
  idnegocios: number
): Promise<BotConfig | null> {
  const { data } = await supabase
    .from("bot_config")
    .select("dias_disponibles, hora_inicio, hora_fin, jornadas")
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

export async function getAvailableSlots(
  supabase: SupabaseClient,
  idnegocios: number,
  especialistaId: number | null,
  fecha: string,
  durationMinutes: number
): Promise<string[]> {
  const [config, existingResult] = await Promise.all([
    fetchBotConfig(supabase, idnegocios),
    (() => {
      let query = supabase
        .from("cita")
        .select("fechahorainicio, fechahorafin")
        .eq("idnegocios", idnegocios)
        .neq("idestadocita", 3)
        .gte("fechahorainicio", `${fecha}T00:00:00`)
        .lt("fechahorainicio", `${fecha}T24:00:00`);

      if (especialistaId) {
        query = query.eq("idusuario", especialistaId);
      }

      return query;
    })(),
  ]);

  const occupied = ((existingResult.data ?? []) as { fechahorainicio: string; fechahorafin: string }[]).map(
    (a) => ({
      startMin: isoTimeToMinutes(a.fechahorainicio),
      endMin: isoTimeToMinutes(a.fechahorafin),
    })
  );

  const ranges = getSlotRanges(config);
  const allSlots = ranges.flatMap((r) => generateSlots(durationMinutes, r.start, r.end));

  return allSlots.filter((slot) => {
    const slotStart = timeStrToMinutes(slot);
    const slotEnd = slotStart + durationMinutes;
    return !occupied.some((o) => o.startMin < slotEnd && o.endMin > slotStart);
  });
}

export async function getAvailableDates(
  supabase: SupabaseClient,
  idnegocios: number,
  especialistaId: number | null,
  durationMinutes: number
): Promise<string[]> {
  const config = await fetchBotConfig(supabase, idnegocios);
  const allowedDays = config?.dias_disponibles ?? DEFAULT_DAYS;

  const dates: string[] = [];
  let cursor = addDays(todayStr(), 1);
  let checked = 0;

  while (dates.length < 7 && checked < 30) {
    if (isAllowedDay(cursor, allowedDays)) {
      const slots = await getAvailableSlots(supabase, idnegocios, especialistaId, cursor, durationMinutes);
      if (slots.length > 0) dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
    checked++;
  }

  return dates;
}
