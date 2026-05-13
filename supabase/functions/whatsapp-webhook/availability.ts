import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUSINESS_START = 8 * 60;  // 8:00 AM in minutes
const BUSINESS_END = 20 * 60;   // 8:00 PM in minutes

function timeStrToMinutes(timeStr: string): number {
  // "HH:MM" -> minutes from midnight
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function isoTimeToMinutes(isoStr: string): number {
  // "2026-05-11T10:00:00" -> 600
  const timePart = isoStr.slice(11, 16);
  return timeStrToMinutes(timePart);
}

function generateSlots(durationMinutes: number): string[] {
  const slots: string[] = [];
  for (let start = BUSINESS_START; start + durationMinutes <= BUSINESS_END; start += durationMinutes) {
    const h = Math.floor(start / 60);
    const m = start % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

function isBusinessDay(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dt = new Date(year, month - 1, day);
  const dow = dt.getDay(); // 0=Sun, 6=Sat
  return dow >= 1 && dow <= 6; // Mon-Sat
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

  const { data: existing } = await query;

  const occupied = (existing ?? []).map((a: { fechahorainicio: string; fechahorafin: string }) => ({
    startMin: isoTimeToMinutes(a.fechahorainicio),
    endMin: isoTimeToMinutes(a.fechahorafin),
  }));

  return generateSlots(durationMinutes).filter((slot) => {
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
  const dates: string[] = [];
  let cursor = addDays(todayStr(), 1);
  let checked = 0;

  while (dates.length < 7 && checked < 30) {
    if (isBusinessDay(cursor)) {
      const slots = await getAvailableSlots(supabase, idnegocios, especialistaId, cursor, durationMinutes);
      if (slots.length > 0) dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
    checked++;
  }

  return dates;
}
