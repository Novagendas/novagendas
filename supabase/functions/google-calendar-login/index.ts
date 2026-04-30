import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const CALLBACK_URI =
  "https://aulddrljywoigivxugqf.supabase.co/functions/v1/google-calendar-callback";
const SCOPE = "https://www.googleapis.com/auth/calendar";

serve((req) => {
  const url = new URL(req.url);
  const idnegocios = url.searchParams.get("idnegocios");

  if (!idnegocios || isNaN(parseInt(idnegocios, 10))) {
    return new Response("idnegocios inválido", { status: 400 });
  }

  const state = btoa(
    JSON.stringify({ idnegocios: parseInt(idnegocios, 10), ts: Date.now() })
  );

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", CALLBACK_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
});
