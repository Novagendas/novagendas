import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const META_APP_ID = Deno.env.get("META_APP_ID_2") ?? Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET_2") ?? Deno.env.get("META_APP_SECRET")!;
const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v18.0";
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN_2") ?? Deno.env.get("META_VERIFY_TOKEN")!;
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

async function exchangeCodeForToken(code: string): Promise<string> {
  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Code exchange failed: ${JSON.stringify(err)}`);
  }

  const { access_token } = await res.json();
  return access_token as string;
}

async function exchangeForLongLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${JSON.stringify(err)}`);
  }

  const { access_token } = await res.json();
  return access_token as string;
}

async function subscribeWabaToWebhook(wabaId: string, accessToken: string): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/subscribed_apps`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Webhook subscription failed: ${JSON.stringify(err)}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { idnegocios: number; waba_id: string; phone_number_id: string; code: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { idnegocios, waba_id, phone_number_id, code } = body;

  if (!idnegocios || !waba_id || !phone_number_id || !code) {
    return json({ error: "Faltan parámetros: idnegocios, waba_id, phone_number_id, code" }, 400);
  }

  let shortToken: string;
  try {
    shortToken = await exchangeCodeForToken(code);
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }

  let longLivedToken: string;
  try {
    longLivedToken = await exchangeForLongLivedToken(shortToken);
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }

  try {
    await subscribeWabaToWebhook(waba_id, longLivedToken);
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.from("whatsapp_integrations").upsert(
    {
      idnegocios,
      waba_id,
      phone_number_id,
      access_token: longLivedToken,
      verify_token: META_VERIFY_TOKEN,
      status: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "idnegocios" }
  );

  if (error) return json({ error: "DB error: " + error.message }, 500);

  return json({ success: true });
});
