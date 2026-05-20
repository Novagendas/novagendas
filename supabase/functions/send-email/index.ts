import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "notificaciones@novagendas.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const TEMPLATES: Record<string, { subject: string; html: string }> = {
  "cuenta-creada": {
    subject: "ACCION REQUERIDA: Tu cuenta ha sido creada — {{negocio}}",
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a {{negocio}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(108,99,255,0.10);max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff 0%,#5a52d5 100%);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">{{negocio}}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Tu cuenta ha sido creada</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;color:#2d2d3a;font-size:16px;line-height:1.6;">Hola, <strong>{{nombre}}</strong>!</p>
              <p style="margin:0 0 28px;color:#555566;font-size:15px;line-height:1.7;">
                Tu cuenta en <strong>{{negocio}}</strong> ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0eeff;border-radius:10px;border-left:4px solid #6c63ff;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px;color:#6c63ff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Credenciales de acceso</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#888899;font-size:13px;padding-bottom:6px;padding-right:16px;">Correo electrónico</td>
                        <td style="color:#2d2d3a;font-size:14px;font-weight:600;padding-bottom:6px;">{{email}}</td>
                      </tr>
                      <tr>
                        <td style="color:#888899;font-size:13px;padding-right:16px;">Contraseña temporal</td>
                        <td style="color:#2d2d3a;font-size:14px;font-weight:600;font-family:monospace;letter-spacing:1px;">{{contrasena_temporal}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdecea;border-radius:8px;border-left:4px solid #d32f2f;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;color:#b71c1c;font-size:14px;font-weight:700;">ACCION REQUERIDA</p>
                    <p style="margin:0;color:#7a1c1c;font-size:14px;line-height:1.6;">
                      Esta es una <strong>contraseña temporal</strong>. Debes cambiarla en tu primer inicio de sesión de forma inmediata. No compartas esta contraseña con nadie.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#555566;font-size:14px;line-height:1.7;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p style="margin:0;color:#555566;font-size:14px;line-height:1.7;">
                Bienvenido al equipo,<br>
                <strong style="color:#2d2d3a;">{{negocio}}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f8;padding:24px 40px;text-align:center;border-top:1px solid #eeeef5;">
              <p style="margin:0;color:#aaaabc;font-size:12px;line-height:1.6;">
                Este correo fue enviado automáticamente por {{negocio}}.<br>
                Si no esperabas este mensaje, puedes ignorarlo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  "cita-confirmada": {
    subject: "Cita confirmada — {{negocio}}",
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cita confirmada — {{negocio}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(108,99,255,0.10);max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff 0%,#5a52d5 100%);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:16px;">&#10003;</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Cita confirmada!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">{{negocio}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 28px;color:#2d2d3a;font-size:16px;line-height:1.6;">
                Hola, <strong>{{nombre_cliente}}</strong>. Tu cita ha sido agendada con éxito. Aquí están los detalles:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0eeff;border-radius:10px;border-left:4px solid #6c63ff;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;color:#6c63ff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Detalles de tu cita</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#888899;font-size:13px;padding-bottom:10px;padding-right:16px;white-space:nowrap;">Servicio</td>
                        <td style="color:#2d2d3a;font-size:15px;font-weight:600;padding-bottom:10px;">{{servicio}}</td>
                      </tr>
                      <tr>
                        <td style="color:#888899;font-size:13px;padding-bottom:10px;padding-right:16px;white-space:nowrap;">Fecha</td>
                        <td style="color:#2d2d3a;font-size:15px;font-weight:600;padding-bottom:10px;">{{fecha}}</td>
                      </tr>
                      <tr>
                        <td style="color:#888899;font-size:13px;padding-bottom:10px;padding-right:16px;white-space:nowrap;">Hora</td>
                        <td style="color:#2d2d3a;font-size:15px;font-weight:600;padding-bottom:10px;">{{hora}}</td>
                      </tr>
                      <tr>
                        <td style="color:#888899;font-size:13px;padding-right:16px;white-space:nowrap;">Especialista</td>
                        <td style="color:#2d2d3a;font-size:15px;font-weight:600;">{{especialista}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-radius:8px;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#2e7d32;font-size:14px;line-height:1.6;">
                      Recuerda llegar con 10 minutos de anticipacion. Si necesitas cancelar o reprogramar, contactanos con al menos 24 horas de anticipacion.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#555566;font-size:14px;line-height:1.7;">
                Nos vemos pronto!<br>
                <strong style="color:#2d2d3a;">{{negocio}}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f8;padding:24px 40px;text-align:center;border-top:1px solid #eeeef5;">
              <p style="margin:0;color:#aaaabc;font-size:12px;line-height:1.6;">
                Este correo fue enviado automaticamente por {{negocio}}.<br>
                Si no agendaste esta cita, por favor contactanos de inmediato.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
};

function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

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

  let body: { template: string; to: string; data: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { template: templateName, to, data } = body;

  if (!templateName || !to || !data) {
    return json({ success: false, error: "Missing required fields: template, to, data" }, 400);
  }

  if (!to.includes('@') || !to.includes('.')) {
    return json({ success: false, error: 'Invalid email address' }, 400);
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    return json({ success: false, error: `Unknown template: ${templateName}` }, 400);
  }

  const subject = interpolate(template.subject, data);
  const html = interpolate(template.html, data);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend error:", resendRes.status, errBody);
    return json({ success: false, error: `Resend error: ${resendRes.status}` }, 502);
  }

  return json({ success: true });
});
