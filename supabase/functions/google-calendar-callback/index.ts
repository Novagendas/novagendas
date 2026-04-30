import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CALLBACK_URI =
  "https://aulddrljywoigivxugqf.supabase.co/functions/v1/google-calendar-callback";

const errorRedirect = (msg: string) =>
  Response.redirect(
    `https://novagendas.com?google_error=${encodeURIComponent(msg)}`,
    302
  );

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return errorRedirect("missing_params");

  let idnegocios: number;
  try {
    const decoded = JSON.parse(atob(state));
    idnegocios = parseInt(decoded.idnegocios, 10);
    if (isNaN(idnegocios)) throw new Error("invalid");
  } catch {
    return errorRedirect("invalid_state");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: CALLBACK_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return errorRedirect("token_exchange_failed");

  const { access_token, refresh_token, expires_in } = await tokenRes.json();
  const expiry_date = Date.now() + (expires_in - 60) * 1000;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.from("google_integrations").upsert(
    {
      idnegocios,
      access_token,
      refresh_token,
      expiry_date,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "idnegocios" }
  );

  if (error) return errorRedirect("db_error");

  const { data: negocio } = await supabase
    .from("negocios")
    .select("dominio")
    .eq("idnegocios", idnegocios)
    .single();

  const subdomain = negocio?.dominio ?? "app";
  return Response.redirect(
    `https://${subdomain}.novagendas.com?google_connected=true`,
    302
  );
});
