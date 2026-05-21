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
    subject: "Acción requerida: Tu cuenta ha sido creada en {{negocio}}",
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Tu cuenta ha sido creada — {{negocio}}</title>
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
          Tu cuenta en {{negocio}} fue creada. Aquí están tus credenciales de acceso.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 44px 16px;">
              <h2 style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">
                ¡Bienvenido, {{nombre}}!
              </h2>
              <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#475569;line-height:1.75;">
                Tu cuenta en <strong style="color:#1e40af;font-weight:700;">{{negocio}}</strong> ha sido creada exitosamente.
              </p>
              <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#475569;line-height:1.75;">
                A continuación encontrarás tus credenciales de acceso para ingresar a la plataforma.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#eff6ff;border-radius:14px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;">
                      Credenciales de acceso
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:8px;padding-right:20px;font-weight:500;">Correo electrónico</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:8px;">{{email}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-right:20px;font-weight:500;">Contraseña temporal</td>
                        <td style="font-family:'Courier New',Courier,monospace;color:#0f172a;font-size:14px;font-weight:700;letter-spacing:1px;">{{contrasena_temporal}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px 36px;">
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
                            Acción requerida — Contraseña temporal
                          </p>
                          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12.5px;color:#92400e;font-weight:500;line-height:1.6;">
                            Debes cambiar esta contraseña en tu primer inicio de sesión. No la compartas con nadie.
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
                      © 2025 Novagendas
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
</html>`,
  },

  "cita-confirmada": {
    subject: "Cita confirmada en {{negocio}} — {{fecha}}",
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Cita confirmada — {{negocio}}</title>
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
          Tu cita en {{negocio}} está confirmada para el {{fecha}} a las {{hora}}.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 44px 16px;">
              <h2 style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">
                ¡Tu cita está confirmada!
              </h2>
              <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#475569;line-height:1.75;">
                Hola, <strong style="color:#0f172a;">{{nombre_cliente}}</strong>. Tu cita en
                <strong style="color:#1e40af;font-weight:700;">{{negocio}}</strong> ha sido agendada con éxito.
                Aquí están todos los detalles:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#eff6ff;border-radius:14px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;">
                      Detalles de tu cita
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Servicio</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{servicio}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Fecha</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{fecha}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Hora</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{hora}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-right:20px;white-space:nowrap;font-weight:500;">Especialista</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">{{especialista}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#eff6ff;border-radius:14px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:12px;padding-top:1px;width:26px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                            fill="none" stroke="#1e40af" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </td>
                        <td>
                          <p style="margin:0 0 3px;font-family:Helvetica,Arial,sans-serif;font-size:12.5px;font-weight:700;color:#1e40af;line-height:1.4;">
                            Recuerda para tu cita
                          </p>
                          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12.5px;color:#1d4ed8;font-weight:500;line-height:1.6;">
                            Por favor llega con 10 minutos de anticipación. Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.
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
                      © 2025 Novagendas
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
</html>`,
  },

  "bot-actividad-admin": {
    subject: "Bot WhatsApp — {{accion}} · {{negocio}}",
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Bot WhatsApp — {{accion}} · {{negocio}}</title>
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
          El bot de WhatsApp {{accion}} en {{negocio}}.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;margin-bottom:18px;">
          <tr>
            <td align="center">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">
                Novagendas &nbsp;·&nbsp; Notificación interna del Bot
              </span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 48px rgba(15,23,42,0.13),0 2px 8px rgba(15,23,42,0.06);">
          <!-- HEADER -->
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
                Actividad del Bot de WhatsApp
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
          <!-- FLOATING ICON -->
          <tr>
            <td style="background:#ffffff;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:-30px auto 0;">
                <tr>
                  <td style="width:58px;height:58px;background:#ffffff;border:3px solid #e2e8f0;border-radius:50%;text-align:center;vertical-align:middle;box-shadow:0 4px 18px rgba(15,23,42,0.12);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="#1e40af" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                      style="display:block;margin:0 auto;">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:40px 44px 16px;">
              <h2 style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">
                🤖 El bot {{accion}}
              </h2>
              <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#475569;line-height:1.75;">
                Un paciente interactuó con el bot de WhatsApp de
                <strong style="color:#1e40af;font-weight:700;">{{negocio}}</strong>
                y se realizó la siguiente acción automáticamente.
              </p>
            </td>
          </tr>
          <!-- DETAILS TABLE -->
          <tr>
            <td style="padding:0 44px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#eff6ff;border-radius:14px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;">
                      Detalles de la cita
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Paciente</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{nombre_cliente}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Servicio</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{servicio}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Fecha</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{fecha}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Hora</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{hora}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-right:20px;white-space:nowrap;font-weight:500;">Especialista</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">{{especialista}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background:#e2e8f0;"></td></tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
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
                          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#94a3b8;">Notificación interna — no responder</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#94a3b8;font-weight:500;">
                      © 2025 Novagendas
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
                Este correo es una notificación automática interna de Novagendas. No responder.
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

  "bot-cliente-registrado": {
    subject: "Bot WhatsApp — Nuevo cliente registrado · {{negocio}}",
    html: `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Bot WhatsApp — Nuevo cliente registrado · {{negocio}}</title>
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
          El bot de WhatsApp registró un nuevo cliente en {{negocio}}.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;margin-bottom:18px;">
          <tr>
            <td align="center">
              <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">
                Novagendas &nbsp;·&nbsp; Notificación interna del Bot
              </span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 48px rgba(15,23,42,0.13),0 2px 8px rgba(15,23,42,0.06);">
          <!-- HEADER -->
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
                Actividad del Bot de WhatsApp
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
          <!-- FLOATING ICON -->
          <tr>
            <td style="background:#ffffff;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:-30px auto 0;">
                <tr>
                  <td style="width:58px;height:58px;background:#ffffff;border:3px solid #e2e8f0;border-radius:50%;text-align:center;vertical-align:middle;box-shadow:0 4px 18px rgba(15,23,42,0.12);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="#1e40af" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                      style="display:block;margin:0 auto;">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:40px 44px 16px;">
              <h2 style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">
                🤖 El bot registró un nuevo cliente
              </h2>
              <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#475569;line-height:1.75;">
                Un usuario se registró a través del bot de WhatsApp de
                <strong style="color:#1e40af;font-weight:700;">{{negocio}}</strong>
                y su perfil fue creado automáticamente.
              </p>
            </td>
          </tr>
          <!-- DETAILS TABLE -->
          <tr>
            <td style="padding:0 44px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#eff6ff;border-radius:14px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;">
                      Datos del cliente
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Nombre</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{nombre_cliente}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Documento</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{documento_cliente}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-bottom:10px;padding-right:20px;white-space:nowrap;font-weight:500;">Teléfono</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;padding-bottom:10px;">{{telefono_cliente}}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;padding-right:20px;white-space:nowrap;font-weight:500;">Email</td>
                        <td style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">{{email_cliente}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background:#e2e8f0;"></td></tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
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
                          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#94a3b8;">Notificación interna — no responder</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;color:#94a3b8;font-weight:500;">
                      © 2025 Novagendas
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
                Este correo es una notificación automática interna de Novagendas. No responder.
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
