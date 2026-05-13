import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage } from "./send.ts";
import {
  buildMenu, buildServiceList, buildSpecialistList, buildDateList,
  buildTimeList, buildConfirmation, buildAppointmentList,
  buildCancelConfirmation, buildText,
} from "./messages.ts";
import { getAvailableDates, getAvailableSlots } from "./availability.ts";
import { getClientByPhone, createAppointment, getUpcomingAppointments, cancelAppointment } from "./appointment.ts";

type Step =
  | "MENU"
  | "SELECT_SERVICE"
  | "SELECT_SPECIALIST"
  | "SELECT_DATE"
  | "SELECT_TIME"
  | "CONFIRM_APPOINTMENT"
  | "VIEW_APPOINTMENTS"
  | "CANCEL_SELECT"
  | "CANCEL_CONFIRM";

interface ConvData {
  servicio_id?: number;
  servicio_nombre?: string;
  servicio_duracion?: number;
  especialista_id?: number | null;
  especialista_nombre?: string;
  fecha?: string;
  hora?: string;
  cancel_cita_id?: number;
  cancel_fecha?: string;
  cancel_hora?: string;
  cancel_servicio?: string;
}

interface Conversation {
  id: string;
  idnegocios: number;
  client_phone: string;
  step: Step;
  data: ConvData;
  updated_at: string;
}

interface Integration {
  idnegocios: number;
  phone_number_id: string;
  access_token: string;
}

interface MessageContent {
  value: string;
}

const TIMEOUT_MS = 30 * 60 * 1000; // 30 min

function extractContent(message: Record<string, unknown>): MessageContent | null {
  if (message.type === "text") {
    const body = (message.text as { body: string })?.body?.trim();
    return body ? { value: body } : null;
  }
  if (message.type === "interactive") {
    const inter = message.interactive as Record<string, unknown>;
    if (inter.type === "button_reply") {
      return { value: (inter.button_reply as { id: string }).id };
    }
    if (inter.type === "list_reply") {
      return { value: (inter.list_reply as { id: string }).id };
    }
  }
  return null;
}

export async function handleIncomingMessage(
  supabase: SupabaseClient,
  integration: Integration,
  message: Record<string, unknown>
): Promise<void> {
  const from = message.from as string;
  if (!from) return;

  const content = extractContent(message);
  if (!content) return;

  const { data: negocio } = await supabase
    .from("negocios")
    .select("nombre")
    .eq("id", integration.idnegocios)
    .single();
  const businessName = (negocio as { nombre: string } | null)?.nombre ?? "NovaAgendas";

  const send = (msg: Record<string, unknown>) =>
    sendMessage(integration.phone_number_id, integration.access_token, from, msg);

  let { data: conv } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("idnegocios", integration.idnegocios)
    .eq("client_phone", from)
    .maybeSingle();

  const isExpired = conv && Date.now() - new Date(conv.updated_at).getTime() > TIMEOUT_MS;

  if (!conv || isExpired) {
    const { data: fresh } = await supabase
      .from("whatsapp_conversations")
      .upsert(
        { idnegocios: integration.idnegocios, client_phone: from, step: "MENU", data: {}, updated_at: new Date().toISOString() },
        { onConflict: "idnegocios,client_phone" }
      )
      .select()
      .single();
    conv = fresh;
  }

  if (!conv) return;

  await processStep(supabase, conv as Conversation, content.value, integration, businessName, send);
}

async function save(supabase: SupabaseClient, conv: Conversation, step: Step, data: ConvData): Promise<void> {
  await supabase
    .from("whatsapp_conversations")
    .update({ step, data, updated_at: new Date().toISOString() })
    .eq("id", conv.id);
}

async function processStep(
  supabase: SupabaseClient,
  conv: Conversation,
  v: string,
  integration: Integration,
  businessName: string,
  send: (msg: Record<string, unknown>) => Promise<void>
): Promise<void> {
  const idnegocios = integration.idnegocios;

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (conv.step === "MENU" || (!isKnownAction(v, conv.step))) {
    await save(supabase, conv, "MENU", {});
    await send(buildMenu(businessName));
    return;
  }

  // ── MENU_AGENDAR ──────────────────────────────────────────────────────────
  if (v === "MENU_AGENDAR") {
    const { data: svcs } = await supabase
      .from("servicios")
      .select("idservicios, nombre, precio, duracion")
      .eq("idnegocios", idnegocios)
      .is("deleted_at", null)
      .neq("idestado", 2);

    if (!svcs || svcs.length === 0) {
      await send(buildText("No hay servicios disponibles. Por favor contáctanos directamente."));
      return;
    }
    await save(supabase, conv, "SELECT_SERVICE", {});
    await send(buildServiceList(svcs));
    return;
  }

  // ── MENU_VER ──────────────────────────────────────────────────────────────
  if (v === "MENU_VER") {
    const client = await getClientByPhone(supabase, idnegocios, conv.client_phone);
    if (!client) {
      await send(buildText("No encontramos un paciente registrado con este número. Por favor regístrate en la clínica."));
      await save(supabase, conv, "MENU", {});
      return;
    }
    const appts = await getUpcomingAppointments(supabase, idnegocios, client.idcliente);
    if (appts.length === 0) {
      await send(buildText("No tienes citas próximas registradas. 📭"));
    } else {
      const list = appts.map((a, i) => `${i + 1}. 📅 ${a.fecha} ${a.hora} — ${a.servicio}`).join("\n");
      await send(buildText(`Tus próximas citas:\n\n${list}`));
    }
    await save(supabase, conv, "MENU", {});
    await send(buildMenu(businessName));
    return;
  }

  // ── MENU_CANCELAR ─────────────────────────────────────────────────────────
  if (v === "MENU_CANCELAR") {
    const client = await getClientByPhone(supabase, idnegocios, conv.client_phone);
    if (!client) {
      await send(buildText("No encontramos un paciente registrado con este número. Por favor regístrate en la clínica."));
      await save(supabase, conv, "MENU", {});
      return;
    }
    const appts = await getUpcomingAppointments(supabase, idnegocios, client.idcliente);
    if (appts.length === 0) {
      await send(buildText("No tienes citas próximas para cancelar. 📭"));
      await save(supabase, conv, "MENU", {});
      await send(buildMenu(businessName));
      return;
    }
    await save(supabase, conv, "CANCEL_SELECT", {});
    await send(buildAppointmentList(appts));
    return;
  }

  // ── SELECT_SERVICE → SVC_{id} ─────────────────────────────────────────────
  if (conv.step === "SELECT_SERVICE" && v.startsWith("SVC_")) {
    const idservicios = parseInt(v.slice(4), 10);
    const { data: svc } = await supabase
      .from("servicios")
      .select("idservicios, nombre, precio, duracion")
      .eq("idservicios", idservicios)
      .single();

    if (!svc) {
      await send(buildText("Servicio no encontrado. Por favor intenta de nuevo."));
      return;
    }

    const { data: links } = await supabase
      .from("negociousuario")
      .select("idusuario")
      .eq("idnegocios", idnegocios);
    const userIds = (links ?? []).map((l: { idusuario: number }) => l.idusuario);

    type SpecRow = { idusuario: number; nombre: string; apellido: string; deleted_at: string | null };
    let specialists: SpecRow[] = [];
    if (userIds.length > 0) {
      const { data: rolData } = await supabase
        .from("rolpermisos")
        .select("idusuario, usuario:idusuario (idusuario, nombre, apellido, deleted_at)")
        .eq("idrol", 3)
        .in("idusuario", userIds);

      specialists = (rolData ?? [])
        .map((r: unknown) => (r as { usuario: SpecRow }).usuario)
        .filter((u) => u && !u.deleted_at);
    }

    const newData: ConvData = {
      servicio_id: (svc as { idservicios: number }).idservicios,
      servicio_nombre: (svc as { nombre: string }).nombre,
      servicio_duracion: (svc as { duracion: number }).duracion,
    };
    await save(supabase, conv, "SELECT_SPECIALIST", newData);
    await send(buildSpecialistList(specialists));
    return;
  }

  // ── SELECT_SPECIALIST → ESP_{id} | ESP_ANY ────────────────────────────────
  if (conv.step === "SELECT_SPECIALIST" && (v.startsWith("ESP_"))) {
    const especialistaId = v === "ESP_ANY" ? null : parseInt(v.slice(4), 10);
    let especialistaNombre = "Sin preferencia";

    if (especialistaId) {
      const { data: esp } = await supabase
        .from("usuario")
        .select("nombre, apellido")
        .eq("idusuario", especialistaId)
        .single();
      if (esp) {
        const u = esp as { nombre: string; apellido: string };
        especialistaNombre = `${u.nombre} ${u.apellido}`;
      }
    }

    const duracion = conv.data.servicio_duracion ?? 30;
    const newData: ConvData = { ...conv.data, especialista_id: especialistaId, especialista_nombre: especialistaNombre };

    await send(buildText("Buscando fechas disponibles... ⏳"));
    const dates = await getAvailableDates(supabase, idnegocios, especialistaId, duracion);

    if (dates.length === 0) {
      await send(buildText("No hay fechas disponibles en los próximos 30 días. Por favor contáctanos directamente."));
      await save(supabase, conv, "MENU", {});
      return;
    }

    await save(supabase, conv, "SELECT_DATE", newData);
    await send(buildDateList(dates));
    return;
  }

  // ── SELECT_DATE → DATE_{YYYY-MM-DD} ──────────────────────────────────────
  if (conv.step === "SELECT_DATE" && v.startsWith("DATE_")) {
    const fecha = v.slice(5);
    const duracion = conv.data.servicio_duracion ?? 30;
    const especialistaId = conv.data.especialista_id ?? null;

    const slots = await getAvailableSlots(supabase, idnegocios, especialistaId, fecha, duracion);
    if (slots.length === 0) {
      await send(buildText("No hay horarios disponibles para ese día. Elige otra fecha."));
      const dates = await getAvailableDates(supabase, idnegocios, especialistaId, duracion);
      await send(buildDateList(dates));
      return;
    }

    await save(supabase, conv, "SELECT_TIME", { ...conv.data, fecha });
    await send(buildTimeList(slots));
    return;
  }

  // ── SELECT_TIME → TIME_{HH:MM} ────────────────────────────────────────────
  if (conv.step === "SELECT_TIME" && v.startsWith("TIME_")) {
    const hora = v.slice(5);
    const newData: ConvData = { ...conv.data, hora };
    await save(supabase, conv, "CONFIRM_APPOINTMENT", newData);
    await send(buildConfirmation(
      conv.data.servicio_nombre ?? "",
      conv.data.especialista_nombre ?? "Sin preferencia",
      conv.data.fecha ?? "",
      hora
    ));
    return;
  }

  // ── CONFIRM_APPOINTMENT ───────────────────────────────────────────────────
  if (conv.step === "CONFIRM_APPOINTMENT") {
    if (v === "CONFIRM_NO") {
      await save(supabase, conv, "MENU", {});
      await send(buildText("Cita no confirmada."));
      await send(buildMenu(businessName));
      return;
    }

    if (v === "CONFIRM_YES") {
      const client = await getClientByPhone(supabase, idnegocios, conv.client_phone);
      if (!client) {
        await send(buildText("No encontramos tu número en nuestros registros. Por favor regístrate en la clínica para agendar por WhatsApp."));
        await save(supabase, conv, "MENU", {});
        return;
      }

      const { fecha, hora, servicio_id, servicio_duracion, especialista_id } = conv.data;
      if (!fecha || !hora || !servicio_id) {
        await send(buildText("Ocurrió un error. Por favor inicia de nuevo."));
        await save(supabase, conv, "MENU", {});
        return;
      }

      const duracion = servicio_duracion ?? 30;
      const start = `${fecha}T${hora}:00`;
      const endMs = new Date(start).getTime() + duracion * 60_000;
      const end = new Date(endMs).toISOString().slice(0, 19);

      const idcita = await createAppointment(
        supabase, idnegocios, client.idcliente,
        especialista_id ?? null, servicio_id, start, end
      );

      if (!idcita) {
        await send(buildText("No pudimos agendar la cita. Por favor intenta de nuevo o contáctanos directamente."));
        await save(supabase, conv, "MENU", {});
        return;
      }

      const [year, month, day] = fecha.split("-").map(Number);
      const dt = new Date(year, month - 1, day);
      const fechaLabel = dt.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
      await send(buildText(`✅ ¡Cita agendada con éxito!\n\nTe esperamos el *${fechaLabel}* a las *${hora}*.\n\nHasta pronto 👋`));
      await save(supabase, conv, "MENU", {});
      return;
    }
  }

  // ── CANCEL_SELECT → CANCEL_{idcita} ───────────────────────────────────────
  if (conv.step === "CANCEL_SELECT" && v.startsWith("CANCEL_") && !v.startsWith("CANCEL_CONFIRM")) {
    const idcita = parseInt(v.slice(7), 10);

    const { data: appt } = await supabase
      .from("cita")
      .select(`idcita, fechahorainicio, citaservicios ( servicios:idservicios ( nombre ) )`)
      .eq("idcita", idcita)
      .eq("idnegocios", idnegocios)
      .single();

    if (!appt) {
      await send(buildText("Cita no encontrada. Por favor intenta de nuevo."));
      return;
    }

    const a = appt as {
      idcita: number;
      fechahorainicio: string;
      citaservicios: Array<{ servicios: { nombre: string } }>;
    };
    const iso = a.fechahorainicio;
    const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
    const dt = new Date(year, month - 1, day);
    const fecha = dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    const hora = iso.slice(11, 16);
    const servicio = a.citaservicios?.[0]?.servicios?.nombre ?? "Servicio";

    await save(supabase, conv, "CANCEL_CONFIRM", {
      ...conv.data,
      cancel_cita_id: idcita,
      cancel_fecha: fecha,
      cancel_hora: hora,
      cancel_servicio: servicio,
    });
    await send(buildCancelConfirmation(fecha, hora, servicio));
    return;
  }

  // ── CANCEL_CONFIRM ────────────────────────────────────────────────────────
  if (conv.step === "CANCEL_CONFIRM") {
    if (v === "CANCEL_CONFIRM_NO") {
      await save(supabase, conv, "MENU", {});
      await send(buildText("De acuerdo, la cita no fue cancelada."));
      await send(buildMenu(businessName));
      return;
    }

    if (v === "CANCEL_CONFIRM_YES") {
      const { cancel_cita_id } = conv.data;
      if (!cancel_cita_id) {
        await send(buildText("Error al cancelar. Por favor intenta de nuevo."));
        await save(supabase, conv, "MENU", {});
        return;
      }

      const ok = await cancelAppointment(supabase, cancel_cita_id, idnegocios);
      if (ok) {
        await send(buildText(`✅ Cita cancelada correctamente.\n\n${conv.data.cancel_fecha} ${conv.data.cancel_hora} — ${conv.data.cancel_servicio}\n\nHasta pronto 👋`));
      } else {
        await send(buildText("No pudimos cancelar la cita. Por favor contáctanos directamente."));
      }
      await save(supabase, conv, "MENU", {});
      return;
    }
  }

  // Fallback
  await save(supabase, conv, "MENU", {});
  await send(buildMenu(businessName));
}

function isKnownAction(v: string, step: Step): boolean {
  if (v === "MENU_AGENDAR" || v === "MENU_VER" || v === "MENU_CANCELAR") return true;
  if (step === "SELECT_SERVICE" && v.startsWith("SVC_")) return true;
  if (step === "SELECT_SPECIALIST" && v.startsWith("ESP_")) return true;
  if (step === "SELECT_DATE" && v.startsWith("DATE_")) return true;
  if (step === "SELECT_TIME" && v.startsWith("TIME_")) return true;
  if (step === "CONFIRM_APPOINTMENT" && (v === "CONFIRM_YES" || v === "CONFIRM_NO")) return true;
  if (step === "CANCEL_SELECT" && v.startsWith("CANCEL_")) return true;
  if (step === "CANCEL_CONFIRM" && (v === "CANCEL_CONFIRM_YES" || v === "CANCEL_CONFIRM_NO")) return true;
  return false;
}
