import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GCAL_BASE =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getRefreshedToken(
  supabase: ReturnType<typeof createClient>,
  integration: { idnegocios: number; refresh_token: string }
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: integration.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("No se pudo renovar el token de Google");
  const { access_token, expires_in } = await res.json();
  const expiry_date = Date.now() + (expires_in - 60) * 1000;
  await supabase
    .from("google_integrations")
    .update({ access_token, expiry_date, updated_at: new Date().toISOString() })
    .eq("idnegocios", integration.idnegocios);
  return access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const { idnegocios, action, eventId, eventData } = await req.json();

  if (!idnegocios || !action) {
    return json({ success: false, error: "Faltan parámetros requeridos" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: integration, error: fetchErr } = await supabase
    .from("google_integrations")
    .select("*")
    .eq("idnegocios", idnegocios)
    .single();

  if (fetchErr || !integration) {
    return json(
      { success: false, error: "Google Calendar no conectado para este negocio" },
      404
    );
  }

  let access_token: string = integration.access_token;

  if (Date.now() >= integration.expiry_date - 60_000) {
    access_token = await getRefreshedToken(supabase, integration);
  }

  const headers = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  };

  if (action === "create") {
    const res = await fetch(`${GCAL_BASE}?sendUpdates=all`, {
      method: "POST",
      headers,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    const data = await res.json();
    return json({ success: true, eventId: data.id });
  }

  if (action === "update") {
    if (!eventId)
      return json({ success: false, error: "eventId requerido para update" }, 400);
    const res = await fetch(`${GCAL_BASE}/${eventId}?sendUpdates=all`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    return json({ success: true, eventId });
  }

  if (action === "delete") {
    if (!eventId)
      return json({ success: false, error: "eventId requerido para delete" }, 400);
    const res = await fetch(`${GCAL_BASE}/${eventId}?sendUpdates=all`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok && res.status !== 410) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    return json({ success: true });
  }

  return json({ success: false, error: `Acción desconocida: ${action}` }, 400);
});
