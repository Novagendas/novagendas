import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v18.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { idnegocios, to, message } = await req.json();

  if (!idnegocios || !to || !message) {
    return json({ error: "Faltan parámetros: idnegocios, to, message" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: integration, error } = await supabase
    .from("whatsapp_integrations")
    .select("phone_number_id, access_token")
    .eq("idnegocios", idnegocios)
    .eq("status", true)
    .single();

  if (error || !integration) {
    return json({ error: "WhatsApp no conectado para este negocio" }, 404);
  }

  const int = integration as { phone_number_id: string; access_token: string };

  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${int.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${int.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", to, ...message }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return json({ error: err }, 500);
  }

  return json({ success: true });
});
