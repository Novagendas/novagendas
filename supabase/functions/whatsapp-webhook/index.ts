import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleIncomingMessage } from "./bot-engine.ts";

const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") ?? "";
const META_VERIFY_TOKEN_2 = Deno.env.get("META_VERIFY_TOKEN_2") ?? "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_APP_SECRET_2 = Deno.env.get("META_APP_SECRET_2") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const url = new URL(req.url);

  // GET — Meta webhook verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const validToken = (META_VERIFY_TOKEN && token === META_VERIFY_TOKEN) ||
                       (META_VERIFY_TOKEN_2 && token === META_VERIFY_TOKEN_2);
    if (mode === "subscribe" && validToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // POST — Incoming messages
  if (req.method === "POST") {
    const body = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (signature) {
      const valid1 = META_APP_SECRET && await verifySignature(body, signature, META_APP_SECRET);
      const valid2 = META_APP_SECRET_2 && await verifySignature(body, signature, META_APP_SECRET_2);
      if (!valid1 && !valid2) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    // Always respond 200 quickly so Meta doesn't retry
    if (payload.object !== "whatsapp_business_account") {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process in background so we return 200 before processing completes
    processEntries(supabase, payload).catch(console.error);

    return new Response("OK", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});

async function processEntries(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>
): Promise<void> {
  const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];

    for (const change of changes) {
      if (change.field !== "messages") continue;

      const value = change.value as Record<string, unknown>;
      const phoneNumberId = (value.metadata as { phone_number_id: string })?.phone_number_id;
      const messages = (value.messages as Array<Record<string, unknown>>) ?? [];

      if (!phoneNumberId || messages.length === 0) continue;

      const { data: integration } = await supabase
        .from("whatsapp_integrations")
        .select("idnegocios, phone_number_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .eq("status", true)
        .maybeSingle();

      if (!integration) continue;

      for (const message of messages) {
        await handleIncomingMessage(supabase, integration, message).catch(console.error);
      }
    }
  }
}

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const expected = signature.replace("sha256=", "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === expected;
}
