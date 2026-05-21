import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "notificaciones@novagendas.com";
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

const RESET_HTML = (resetLink: string) => `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Recupera tu contraseña — Novagendas</title>
  <style>
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f1f5f9;padding:40px 16px 56px;">
    <tr>
      <td align="center">
        <div style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;">
          Solicitud de recuperación de contraseña en Novagendas.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;margin-bottom:18px;">
          <tr>
            <td align="center">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">
                Novagendas &nbsp;·&nbsp; Plataforma de Agendamiento
              </span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 48px rgba(15,23,42,0.13),0 2px 8px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:linear-gradient(145deg,#1e40af 0%,#1e3a8a 60%,#172554 100%);padding:48px 40px 56px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;">
                <tr>
                  <td style="width:80px;height:80px;background:#ffffff;border-radius:20px;text-align:center;vertical-align:middle;box-shadow:0 4px 24px rgba(0,0,0,0.28);">
                    <img src="https://aulddrljywoigivxugqf.supabase.co/storage/v1/object/public/Imagen%20logo/logoclaro.jpeg"
                      alt="Novagendas" width="62"
                      style="display:block;width:62px;height:62px;border-radius:14px;object-fit:cover;margin:9px auto;" />
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.15;">
                Novagendas
              </h1>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:0.1em;text-transform:uppercase;">
                Plataforma Profesional de Agendamiento
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px auto 0;">
                <tr>
                  <td style="width:36px;height:2px;background:rgba(139,92,246,0.35);border-radius:1px;"></td>
                  <td style="width:8px;"></td>
                  <td style="width:10px;height:6px;background:#8b5cf6;border-radius:3px;"></td>
                  <td style="width:8px;"></td>
                  <td style="width:36px;height:2px;background:rgba(139,92,246,0.35);border-radius:1px;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:-30px auto 0;">
                <tr>
                  <td style="width:58px;height:58px;background:#ffffff;border:3px solid #e2e8f0;border-radius:50%;text-align:center;vertical-align:middle;box-shadow:0 4px 18px rgba(15,23,42,0.12);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="#1e40af" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                      style="display:block;margin:0 auto;">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 44px 16px;">
              <h2 style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">
                Recupera tu contraseña
              </h2>
              <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#475569;line-height:1.75;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Novagendas.
                Haz clic en el botón para crear una nueva contraseña. <strong>El enlace expira en 1 hora.</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px 36px;text-align:center;">
              <a href="${resetLink}"
                style="display:inline-block;background:linear-gradient(135deg,#1e40af,#1e3a8a);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.01em;box-shadow:0 4px 14px rgba(30,64,175,0.35);">
                Crear nueva contraseña
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#fef9ec;border-radius:14px;border:1px solid #f6d860;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:12px;padding-top:1px;width:26px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                            fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </td>
                        <td>
                          <p style="margin:0 0 3px;font-family:Helvetica,Arial,sans-serif;font-size:12.5px;font-weight:700;color:#b45309;line-height:1.4;">
                            ¿No solicitaste esto?
                          </p>
                          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12.5px;color:#92400e;font-weight:500;line-height:1.6;">
                            Si no pediste cambiar tu contraseña, ignora este correo. Tu cuenta sigue segura.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background:#e2e8f0;"></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 44px 26px;border-radius:0 0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:30px;height:30px;background:linear-gradient(135deg,#1e40af,#1e3a8a);border-radius:8px;text-align:center;vertical-align:middle;">
                                <span style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:900;color:#8b5cf6;letter-spacing:-0.02em;line-height:30px;display:block;">NA</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0 0 2px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#0f172a;">Novagendas</p>
                          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#94a3b8;">Para negocios de salud y bienestar</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#94a3b8;font-weight:500;">
                      © ${new Date().getFullYear()} Novagendas
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;margin-top:20px;">
          <tr>
            <td align="center" style="padding:0 20px;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#94a3b8;line-height:1.7;text-align:center;">
                Este correo fue enviado desde una dirección no monitoreada. Por favor no respondas a este mensaje.<br/>
                Si tienes preguntas, contacta a tu administrador de Novagendas.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  if (!RESEND_API_KEY) {
    return json({ success: false, error: "RESEND_API_KEY not configured" }, 500);
  }

  let body: { email: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { email, redirectTo } = body;

  if (!email || !email.includes("@")) {
    return json({ success: false, error: "Email requerido" }, 400);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Validar que el correo existe en la tabla usuario (auth custom)
  const { data: usuarioData } = await supabaseAdmin
    .from("usuario")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!usuarioData) {
    return json({ success: false, error: "Correo no encontrado o no registrado" }, 400);
  }

  // Intentar generar link de recuperación
  let { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: redirectTo ?? "https://novagendas.com" },
  });

  // Si el usuario no existe en auth.users, crearlo y reintentar
  if (linkError) {
    console.log("generateLink falló, intentando crear usuario en auth.users:", linkError.message);

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (createError && !createError.message?.includes("already been registered")) {
      console.error("createUser error:", createError);
      return json({ success: false, error: "Error preparando usuario para recuperación" }, 500);
    }

    const retry = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: redirectTo ?? "https://novagendas.com" },
    });

    data = retry.data;
    linkError = retry.error;
  }

  if (linkError || !data?.properties?.action_link) {
    console.error("generateLink error final:", linkError);
    return json({ success: false, error: "Error generando enlace de recuperación" }, 500);
  }

  const resetLink = data.properties.action_link;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Novagendas <${FROM_EMAIL}>`,
      to: [email],
      subject: "Recupera tu contraseña — Novagendas",
      html: RESET_HTML(resetLink),
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend error:", resendRes.status, errBody);
    return json({ success: false, error: `Error enviando correo: ${resendRes.status}` }, 502);
  }

  return json({ success: true });
});
