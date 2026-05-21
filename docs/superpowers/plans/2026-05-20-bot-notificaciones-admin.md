# Bot WhatsApp — Notificaciones Admin + Flujo Editar Cita — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar notificaciones por email al admin (Resend) cuando el bot crea/edita/cancela citas, implementar flujo de edición de fecha/hora de cita en el bot, y agregar `email_notificaciones` + `telefono_contacto` a `bot_config`.

**Architecture:** Cuatro áreas de cambio: (1) migración SQL agrega dos columnas a `bot_config`; (2) `send-email` edge function recibe template `bot-actividad-admin`; (3) la webhook de WhatsApp agrega flujo EDITAR, helpers `notifyAdmin()` e `insertBotLog()`, y usa `telefono_contacto` en mensajes de error; (4) `BotConfig.jsx` agrega dos campos al formulario. Los campos de notificación se cargan una vez por mensaje al inicio de `handleIncomingMessage()` y se pasan a `processStep()`.

**Tech Stack:** Deno + TypeScript (Edge Functions), Supabase (PostgreSQL), Resend (email), React 19 + CSS

---

## File Map

| Archivo | Cambio |
|---|---|
| `src/scriptsBD/bot_config_migration.sql` | Agregar columnas `email_notificaciones` y `telefono_contacto` |
| `supabase/functions/send-email/index.ts` | Agregar template `bot-actividad-admin` |
| `supabase/functions/whatsapp-webhook/appointment.ts` | Agregar `updateAppointment()` |
| `supabase/functions/whatsapp-webhook/messages.ts` | Agregar `buildEditAppointmentList()`, `buildEditConfirmation()`, fila "Editar cita" en menú |
| `supabase/functions/whatsapp-webhook/bot-engine.ts` | Tipos, helpers, firma de `processStep()`, flujo EDITAR, logs y notificaciones en crear/cancelar |
| `src/features/bot/BotConfig.jsx` | Dos nuevos campos en el formulario |
| `src/features/bot/BotConfig.css` | Estilos para los nuevos campos |

---

## Task 1: Migración SQL — bot_config

**Files:**
- Modify: `src/scriptsBD/bot_config_migration.sql`

- [ ] **Step 1: Agregar las dos columnas al archivo de migración**

Al final del archivo `src/scriptsBD/bot_config_migration.sql`, agregar:

```sql
-- Notificaciones del bot al administrador
ALTER TABLE bot_config
  ADD COLUMN IF NOT EXISTS email_notificaciones TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT DEFAULT NULL;
```

- [ ] **Step 2: Ejecutar en Supabase**

En el SQL Editor de Supabase Dashboard, ejecutar:
```sql
ALTER TABLE bot_config
  ADD COLUMN IF NOT EXISTS email_notificaciones TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT DEFAULT NULL;
```

Verificar con:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'bot_config'
  AND column_name IN ('email_notificaciones', 'telefono_contacto');
```
Expected: 2 filas.

- [ ] **Step 3: Commit**

```bash
git add src/scriptsBD/bot_config_migration.sql
git commit -m "feat: agregar email_notificaciones y telefono_contacto a bot_config"
```

---

## Task 2: appointment.ts — updateAppointment()

**Files:**
- Modify: `supabase/functions/whatsapp-webhook/appointment.ts`

- [ ] **Step 1: Agregar `updateAppointment()` al final del archivo**

```typescript
export async function updateAppointment(
  supabase: SupabaseClient,
  idcita: number,
  idnegocios: number,
  fechahorainicio: string,
  fechahorafin: string
): Promise<boolean> {
  const { error } = await supabase
    .from("cita")
    .update({ fechahorainicio, fechahorafin })
    .eq("idcita", idcita)
    .eq("idnegocios", idnegocios);

  return !error;
}
```

- [ ] **Step 2: Verificar que el archivo compila**

```bash
cd supabase/functions/whatsapp-webhook
deno check appointment.ts
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/whatsapp-webhook/appointment.ts
git commit -m "feat: agregar updateAppointment en appointment.ts"
```

---

## Task 3: messages.ts — builders para flujo EDITAR + menú actualizado

**Files:**
- Modify: `supabase/functions/whatsapp-webhook/messages.ts`

- [ ] **Step 1: Agregar fila "Editar cita" al menú**

Reemplazar el bloque `rows` dentro de `buildMenu()`:

```typescript
rows: [
  { id: "MENU_AGENDAR",   title: "📅 Agendar cita",   description: "Reserva una nueva cita" },
  { id: "MENU_EDITAR",    title: "✏️ Editar cita",    description: "Cambia fecha u hora" },
  { id: "MENU_VER",       title: "🗓 Ver mis citas",   description: "Consulta tus próximas citas" },
  { id: "MENU_CANCELAR",  title: "❌ Cancelar cita",   description: "Cancela una cita existente" },
  { id: "MENU_SERVICIOS", title: "💆 Ver servicios",   description: "Precios, duración y categorías" },
],
```

- [ ] **Step 2: Agregar `buildEditAppointmentList()` al final del archivo**

```typescript
export function buildEditAppointmentList(
  appointments: Array<{ idcita: number; fecha: string; hora: string; servicio: string }>
): Record<string, unknown> {
  const rows = appointments.slice(0, 10).map((a) => ({
    id: `EDIT_${a.idcita}`,
    title: trunc(`${a.fecha} ${a.hora}`, 24),
    description: trunc(a.servicio, 72),
  }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "Selecciona la cita que deseas editar:" },
      action: { button: "Ver citas", sections: [{ title: "Mis citas", rows }] },
    },
  };
}
```

- [ ] **Step 3: Agregar `buildEditConfirmation()` al final del archivo**

```typescript
export function buildEditConfirmation(
  serviceName: string,
  fechaAnterior: string,
  horaAnterior: string,
  fechaNueva: string,
  horaNueva: string
): Record<string, unknown> {
  const parseDate = (d: string): string => {
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `✏️ *Editar cita*\n\n` +
          `🏥 Servicio: ${serviceName}\n\n` +
          `📅 Antes: ${parseDate(fechaAnterior)} a las ${horaAnterior}\n` +
          `📅 Nueva: ${parseDate(fechaNueva)} a las ${horaNueva}\n\n` +
          `¿Confirmas el cambio?`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "EDIT_CONFIRM_YES", title: "✅ Confirmar" } },
          { type: "reply", reply: { id: "EDIT_CONFIRM_NO",  title: "❌ Cancelar"  } },
        ],
      },
    },
  };
}
```

- [ ] **Step 4: Verificar que compila**

```bash
deno check supabase/functions/whatsapp-webhook/messages.ts
```
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/whatsapp-webhook/messages.ts
git commit -m "feat: agregar builders EDITAR y opcion editar en menu del bot"
```

---

## Task 4: send-email — template bot-actividad-admin

**Files:**
- Modify: `supabase/functions/send-email/index.ts`

- [ ] **Step 1: Agregar el template al objeto `TEMPLATES`**

Después del cierre del template `"cita-confirmada"` (antes del cierre de `TEMPLATES`), agregar:

```typescript
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
```

- [ ] **Step 2: Verificar que el servidor compila**

```bash
deno check supabase/functions/send-email/index.ts
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "feat: agregar template bot-actividad-admin en send-email"
```

---

## Task 5: bot-engine.ts — tipos, helpers y firma de processStep

**Files:**
- Modify: `supabase/functions/whatsapp-webhook/bot-engine.ts`

- [ ] **Step 1: Actualizar el import desde `appointment.ts`**

Reemplazar la línea de import de `appointment.ts`:

```typescript
import {
  getClientByCedula, createAppointment, updateAppointment,
  getUpcomingAppointments, cancelAppointment,
} from "./appointment.ts";
```

- [ ] **Step 2: Actualizar el import desde `messages.ts`**

Reemplazar la línea de import de `messages.ts`:

```typescript
import {
  buildMenu, buildServiceList, buildServiceCatalog, buildSpecialistList,
  buildDateList, buildTimeList, buildJornadaSelector, buildConfirmation,
  buildAppointmentList, buildCancelConfirmation, buildText,
  buildEditAppointmentList, buildEditConfirmation,
} from "./messages.ts";
```

- [ ] **Step 3: Ampliar el tipo `Step`**

Reemplazar la definición actual de `type Step`:

```typescript
type Step =
  | "MENU"
  | "ASK_CEDULA"
  | "SELECT_SERVICE"
  | "SELECT_SPECIALIST"
  | "SELECT_DATE"
  | "SELECT_JORNADA"
  | "SELECT_TIME"
  | "CONFIRM_APPOINTMENT"
  | "CANCEL_SELECT"
  | "CANCEL_CONFIRM"
  | "EDIT_SELECT"
  | "EDIT_DATE"
  | "EDIT_JORNADA"
  | "EDIT_TIME"
  | "EDIT_CONFIRM";
```

- [ ] **Step 4: Ampliar `ConvData` con los campos del flujo EDITAR**

Reemplazar la definición actual de `interface ConvData`:

```typescript
interface ConvData {
  pending_action?: "AGENDAR" | "VER" | "CANCELAR" | "EDITAR";
  idcliente?: number;
  client_nombre?: string;
  client_email?: string | null;
  servicio_id?: number;
  servicio_nombre?: string;
  servicio_duracion?: number;
  especialista_id?: number | null;
  especialista_nombre?: string;
  especialista_email?: string | null;
  fecha?: string;
  hora?: string;
  cancel_cita_id?: number;
  cancel_fecha?: string;
  cancel_hora?: string;
  cancel_servicio?: string;
  edit_cita_id?: number;
  edit_servicio_nombre?: string;
  edit_especialista_id?: number | null;
  edit_duracion?: number;
  edit_fecha_anterior?: string;
  edit_hora_anterior?: string;
}
```

- [ ] **Step 5: Agregar helpers `contactSuffix`, `insertBotLog` y `notifyAdmin`**

Después de la función `syncToGoogleCalendar` (alrededor de línea 100), agregar:

```typescript
function contactSuffix(tel: string | null): string {
  return tel
    ? `\n\nPara comunicarte directamente: *${tel}*`
    : "\n\nContáctanos directamente.";
}

async function insertBotLog(
  supabase: SupabaseClient,
  idnegocios: number,
  accion: "CREAR" | "EDITAR" | "CANCELAR",
  detalle: string
): Promise<void> {
  const { error } = await supabase.from("logsnegocio").insert([{
    accion,
    entidad: "cita",
    descripcion: `Bot WhatsApp: ${accion} ${detalle}`,
    idusuario: null,
    idnegocios,
  }]);
  if (error) console.warn("insertBotLog failed:", error.message);
}

async function notifyAdmin(
  emailNotificaciones: string | null,
  accion: string,
  detalles: {
    nombre_cliente: string;
    servicio: string;
    fecha: string;
    hora: string;
    especialista: string;
    negocio: string;
  }
): Promise<void> {
  if (!emailNotificaciones?.trim()) return;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return;

  fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: "bot-actividad-admin",
      to: emailNotificaciones,
      data: { accion, ...detalles },
    }),
  }).catch((e: Error) => console.warn("notifyAdmin failed:", e.message));
}
```

- [ ] **Step 6: Actualizar `handleIncomingMessage` para cargar los nuevos campos**

Reemplazar el bloque que carga el nombre del negocio (actualmente solo consulta `negocios`):

```typescript
  const [{ data: negocio }, { data: botCfgNotif }] = await Promise.all([
    supabase
      .from("negocios")
      .select("nombre")
      .eq("idnegocios", integration.idnegocios)
      .single(),
    supabase
      .from("bot_config")
      .select("telefono_contacto, email_notificaciones")
      .eq("idnegocios", integration.idnegocios)
      .maybeSingle(),
  ]);
  const businessName = (negocio as { nombre: string } | null)?.nombre ?? "NovaAgendas";
  const telefonoContacto =
    (botCfgNotif as { telefono_contacto: string | null } | null)?.telefono_contacto ?? null;
  const emailNotificaciones =
    (botCfgNotif as { email_notificaciones: string | null } | null)?.email_notificaciones ?? null;
```

- [ ] **Step 7: Actualizar la llamada a `processStep` al final de `handleIncomingMessage`**

```typescript
  await processStep(
    supabase,
    conv as Conversation,
    content.value,
    integration,
    businessName,
    telefonoContacto,
    emailNotificaciones,
    send
  );
```

- [ ] **Step 8: Actualizar la firma de `processStep`**

Reemplazar la firma actual de la función `processStep`:

```typescript
async function processStep(
  supabase: SupabaseClient,
  conv: Conversation,
  v: string,
  integration: Integration,
  businessName: string,
  telefonoContacto: string | null,
  emailNotificaciones: string | null,
  send: (msg: Record<string, unknown>) => Promise<void>
): Promise<void> {
```

- [ ] **Step 9: Actualizar los mensajes de "contáctanos directamente" en processStep**

Dentro de `processStep`, localizar y reemplazar los 4 mensajes con texto de contacto estático:

**a)** "No hay servicios disponibles":
```typescript
      await send(
        buildText(
          "No hay servicios disponibles en este momento." +
          contactSuffix(telefonoContacto)
        )
      );
```

**b)** "No hay fechas disponibles":
```typescript
      await send(
        buildText(
          "No hay fechas disponibles en los próximos 30 días." +
          contactSuffix(telefonoContacto)
        )
      );
```

**c)** "No pudimos agendar":
```typescript
      await send(
        buildText(
          "No pudimos agendar la cita. Por favor intenta de nuevo." +
          contactSuffix(telefonoContacto)
        )
      );
```

**d)** "No pudimos cancelar":
```typescript
      await send(
        buildText(
          "No pudimos cancelar la cita." +
          contactSuffix(telefonoContacto)
        )
      );
```

- [ ] **Step 10: Verificar que compila**

```bash
deno check supabase/functions/whatsapp-webhook/bot-engine.ts
```
Expected: sin errores.

- [ ] **Step 11: Commit**

```bash
git add supabase/functions/whatsapp-webhook/bot-engine.ts
git commit -m "feat: tipos EDITAR, helpers notifyAdmin/insertBotLog/contactSuffix en bot-engine"
```

---

## Task 6: bot-engine.ts — flujo EDITAR completo

**Files:**
- Modify: `supabase/functions/whatsapp-webhook/bot-engine.ts`

- [ ] **Step 1: Agregar `MENU_EDITAR` en processStep**

Después del bloque `if (v === "MENU_CANCELAR")` y antes de `MENU_SERVICIOS`, agregar:

```typescript
  // ── MENU_EDITAR ───────────────────────────────────────────────────────────
  if (v === "MENU_EDITAR") {
    await save(supabase, conv, "ASK_CEDULA", { pending_action: "EDITAR" });
    await send(buildText("Para continuar, escribe tu número de cédula:"));
    return;
  }
```

- [ ] **Step 2: Agregar caso EDITAR en el bloque `ASK_CEDULA`**

Dentro del bloque `if (conv.step === "ASK_CEDULA")`, después del bloque `if (conv.data.pending_action === "CANCELAR")` y antes del `await save(supabase, conv, "MENU", {})` del fallback, agregar:

```typescript
    // ── Flujo EDITAR ──────────────────────────────────────────────────────
    if (conv.data.pending_action === "EDITAR") {
      const appts = await getUpcomingAppointments(supabase, idnegocios, client.idcliente);
      if (appts.length === 0) {
        await send(
          buildText(`Hola *${client.nombre}*, no tienes citas próximas para editar. 📭`)
        );
        await save(supabase, conv, "MENU", {});
        await send(buildMenu(businessName));
        return;
      }
      await save(supabase, conv, "EDIT_SELECT", baseData);
      await send(buildText(`Hola *${client.nombre}*, selecciona la cita que deseas editar:`));
      await send(buildEditAppointmentList(appts));
      return;
    }
```

- [ ] **Step 3: Agregar handler `EDIT_SELECT`**

Después del bloque de `SELECT_SERVICE` y antes del bloque de `SELECT_SPECIALIST`, agregar:

```typescript
  // ── EDIT_SELECT → EDIT_{idcita} ───────────────────────────────────────────
  if (conv.step === "EDIT_SELECT" && v.startsWith("EDIT_")) {
    const idcita = parseInt(v.slice(5), 10);

    const { data: appt } = await supabase
      .from("cita")
      .select(`
        idcita, fechahorainicio, idusuario,
        citaservicios ( idservicios, servicios:idservicios ( nombre, duracion ) )
      `)
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
      idusuario: number | null;
      citaservicios: Array<{ idservicios: number; servicios: { nombre: string; duracion: number } }>;
    };

    const iso = a.fechahorainicio;
    const svcData = a.citaservicios?.[0]?.servicios;
    const duracion = svcData?.duracion ?? 30;

    const newData: ConvData = {
      ...conv.data,
      edit_cita_id: idcita,
      edit_servicio_nombre: svcData?.nombre ?? "Servicio",
      edit_especialista_id: a.idusuario,
      edit_duracion: duracion,
      edit_fecha_anterior: iso.slice(0, 10),
      edit_hora_anterior: iso.slice(11, 16),
    };

    await send(buildText("Buscando fechas disponibles... ⏳"));
    const dates = await getAvailableDates(supabase, idnegocios, a.idusuario, duracion);

    if (dates.length === 0) {
      await send(
        buildText("No hay fechas disponibles en los próximos 30 días." + contactSuffix(telefonoContacto))
      );
      await save(supabase, conv, "MENU", {});
      await send(buildMenu(businessName));
      return;
    }

    await save(supabase, conv, "EDIT_DATE", newData);
    await send(buildDateList(dates));
    return;
  }
```

- [ ] **Step 4: Agregar handler `EDIT_DATE`**

Después del handler de `EDIT_SELECT`, agregar:

```typescript
  // ── EDIT_DATE → DATE_{YYYY-MM-DD} ─────────────────────────────────────────
  if (conv.step === "EDIT_DATE" && v.startsWith("DATE_")) {
    const fecha = v.slice(5);
    const duracion = conv.data.edit_duracion ?? 30;
    const especialistaId = conv.data.edit_especialista_id ?? null;

    const slots = await getAvailableSlots(supabase, idnegocios, especialistaId, fecha, duracion);

    if (slots.length === 0) {
      await send(buildText("No hay horarios disponibles para ese día. Elige otra fecha."));
      const dates = await getAvailableDates(supabase, idnegocios, especialistaId, duracion);
      await send(buildDateList(dates));
      return;
    }

    const hasManana = slots.some((t) => parseInt(t, 10) < 12);
    const hasTarde  = slots.some((t) => { const h = parseInt(t, 10); return h >= 12 && h < 17; });
    const hasNoche  = slots.some((t) => parseInt(t, 10) >= 17);

    const jornadas: Array<"mañana" | "tarde" | "noche"> = [
      ...(hasManana ? ["mañana" as const] : []),
      ...(hasTarde  ? ["tarde"  as const] : []),
      ...(hasNoche  ? ["noche"  as const] : []),
    ];

    if (jornadas.length === 1) {
      await save(supabase, conv, "EDIT_TIME", { ...conv.data, fecha });
      await send(buildTimeList(slots, jornadas[0]));
      return;
    }

    await save(supabase, conv, "EDIT_JORNADA", { ...conv.data, fecha });
    await send(buildJornadaSelector(jornadas));
    return;
  }
```

- [ ] **Step 5: Agregar handler `EDIT_JORNADA`**

Después del handler de `EDIT_DATE`, agregar:

```typescript
  // ── EDIT_JORNADA → JORNADA_{...} ──────────────────────────────────────────
  if (conv.step === "EDIT_JORNADA" && v.startsWith("JORNADA_")) {
    const fecha = conv.data.fecha ?? "";
    const duracion = conv.data.edit_duracion ?? 30;
    const especialistaId = conv.data.edit_especialista_id ?? null;

    const allSlots = await getAvailableSlots(supabase, idnegocios, especialistaId, fecha, duracion);

    const jornadaLabel =
      v === "JORNADA_MANANA" ? "mañana" :
      v === "JORNADA_TARDE"  ? "tarde"  : "noche";

    const filtered =
      v === "JORNADA_MANANA" ? allSlots.filter((t) => parseInt(t, 10) < 12) :
      v === "JORNADA_TARDE"  ? allSlots.filter((t) => { const h = parseInt(t, 10); return h >= 12 && h < 17; }) :
                               allSlots.filter((t) => parseInt(t, 10) >= 17);

    if (filtered.length === 0) {
      await send(buildText("No hay horarios disponibles en esa jornada. Elige otra:"));
      const hasManana = allSlots.some((t) => parseInt(t, 10) < 12);
      const hasTarde  = allSlots.some((t) => { const h = parseInt(t, 10); return h >= 12 && h < 17; });
      const hasNoche  = allSlots.some((t) => parseInt(t, 10) >= 17);
      const jornadas: Array<"mañana" | "tarde" | "noche"> = [
        ...(hasManana ? ["mañana" as const] : []),
        ...(hasTarde  ? ["tarde"  as const] : []),
        ...(hasNoche  ? ["noche"  as const] : []),
      ];
      await send(buildJornadaSelector(jornadas));
      return;
    }

    await save(supabase, conv, "EDIT_TIME", conv.data);
    await send(buildTimeList(filtered, jornadaLabel));
    return;
  }
```

- [ ] **Step 6: Agregar handler `EDIT_TIME`**

Después del handler de `EDIT_JORNADA`, agregar:

```typescript
  // ── EDIT_TIME → TIME_{HH:MM} ───────────────────────────────────────────────
  if (conv.step === "EDIT_TIME" && v.startsWith("TIME_")) {
    const hora = v.slice(5);
    await save(supabase, conv, "EDIT_CONFIRM", { ...conv.data, hora });
    await send(
      buildEditConfirmation(
        conv.data.edit_servicio_nombre ?? "",
        conv.data.edit_fecha_anterior ?? "",
        conv.data.edit_hora_anterior ?? "",
        conv.data.fecha ?? "",
        hora
      )
    );
    return;
  }
```

- [ ] **Step 7: Agregar handler `EDIT_CONFIRM`**

Después del handler de `EDIT_TIME`, agregar:

```typescript
  // ── EDIT_CONFIRM ───────────────────────────────────────────────────────────
  if (conv.step === "EDIT_CONFIRM") {
    if (v === "EDIT_CONFIRM_NO") {
      await save(supabase, conv, "MENU", {});
      await send(buildText("Edición cancelada. ¿Deseas hacer algo más?"));
      await send(buildMenu(businessName));
      return;
    }

    if (v === "EDIT_CONFIRM_YES") {
      const {
        edit_cita_id, edit_servicio_nombre, edit_duracion,
        hora, fecha, client_nombre,
        edit_fecha_anterior, edit_hora_anterior,
      } = conv.data;

      if (!edit_cita_id || !fecha || !hora) {
        await send(buildText("Ocurrió un error. Por favor inicia de nuevo."));
        await save(supabase, conv, "MENU", {});
        return;
      }

      const duracion = edit_duracion ?? 30;
      const start = `${fecha}T${hora}:00`;
      const endMs = new Date(start).getTime() + duracion * 60_000;
      const end = new Date(endMs).toISOString().slice(0, 19);

      const ok = await updateAppointment(supabase, edit_cita_id, idnegocios, start, end);

      if (!ok) {
        await send(
          buildText("No pudimos editar la cita." + contactSuffix(telefonoContacto))
        );
        await save(supabase, conv, "MENU", {});
        return;
      }

      await insertBotLog(
        supabase, idnegocios, "EDITAR",
        `cita #${edit_cita_id} — ${client_nombre ?? "Cliente"} · ${edit_servicio_nombre ?? "Servicio"} ${fecha} ${hora}`
      );

      const [year, month, day] = fecha.split("-").map(Number);
      const fechaLabel = new Date(year, month - 1, day).toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long",
      });

      await notifyAdmin(emailNotificaciones, "Editó una cita", {
        nombre_cliente: client_nombre ?? "Cliente",
        servicio: edit_servicio_nombre ?? "Servicio",
        fecha: fechaLabel,
        hora: hora ?? "",
        especialista: "—",
        negocio: businessName,
      });

      const anteriorLabel = (() => {
        if (!edit_fecha_anterior) return "";
        const [y, m, d] = edit_fecha_anterior.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
      })();

      await send(
        buildText(
          `✅ ¡Cita actualizada!\n\n` +
          `Antes: ${anteriorLabel} a las ${edit_hora_anterior ?? ""}\n` +
          `Ahora: *${fechaLabel}* a las *${hora}*\n\n` +
          `Hasta pronto 👋`
        )
      );
      await save(supabase, conv, "MENU", {});
      return;
    }
  }
```

- [ ] **Step 8: Actualizar `isKnownAction` con los nuevos steps y acciones**

Reemplazar la función completa `isKnownAction`:

```typescript
function isKnownAction(v: string, step: Step): boolean {
  if (
    v === "MENU_AGENDAR" ||
    v === "MENU_VER" ||
    v === "MENU_CANCELAR" ||
    v === "MENU_EDITAR" ||
    v === "MENU_SERVICIOS"
  )
    return true;
  if (step === "ASK_CEDULA") return true;
  if (step === "SELECT_SERVICE"  && v.startsWith("SVC_"))    return true;
  if (step === "SELECT_SPECIALIST" && v.startsWith("ESP_"))  return true;
  if (step === "SELECT_DATE"     && v.startsWith("DATE_"))   return true;
  if (step === "SELECT_JORNADA"  && v.startsWith("JORNADA_")) return true;
  if (step === "SELECT_TIME"     && v.startsWith("TIME_"))   return true;
  if (step === "CONFIRM_APPOINTMENT" && (v === "CONFIRM_YES" || v === "CONFIRM_NO")) return true;
  if (step === "CANCEL_SELECT"   && v.startsWith("CANCEL_")) return true;
  if (step === "CANCEL_CONFIRM"  && (v === "CANCEL_CONFIRM_YES" || v === "CANCEL_CONFIRM_NO")) return true;
  if (step === "EDIT_SELECT"     && v.startsWith("EDIT_"))   return true;
  if (step === "EDIT_DATE"       && v.startsWith("DATE_"))   return true;
  if (step === "EDIT_JORNADA"    && v.startsWith("JORNADA_")) return true;
  if (step === "EDIT_TIME"       && v.startsWith("TIME_"))   return true;
  if (step === "EDIT_CONFIRM"    && (v === "EDIT_CONFIRM_YES" || v === "EDIT_CONFIRM_NO")) return true;
  return false;
}
```

- [ ] **Step 9: Verificar que compila**

```bash
deno check supabase/functions/whatsapp-webhook/bot-engine.ts
```
Expected: sin errores.

- [ ] **Step 10: Commit**

```bash
git add supabase/functions/whatsapp-webhook/bot-engine.ts
git commit -m "feat: flujo EDITAR cita en bot WhatsApp"
```

---

## Task 7: bot-engine.ts — log y notifyAdmin en crear y cancelar

**Files:**
- Modify: `supabase/functions/whatsapp-webhook/bot-engine.ts`

- [ ] **Step 1: Agregar log + notifyAdmin después de crear cita exitosa**

En el bloque `CONFIRM_YES`, después del bloque que envía el email al cliente y antes del `await send(buildText("✅ ¡Cita agendada..."))`, agregar:

```typescript
      await insertBotLog(
        supabase, idnegocios, "CREAR",
        `cita #${idcita} — ${client_nombre ?? "Cliente"} · ${servicio_nombre ?? "Servicio"} ${fecha} ${hora}`
      );

      await notifyAdmin(emailNotificaciones, "Creó una cita", {
        nombre_cliente: client_nombre ?? "Cliente",
        servicio: servicio_nombre ?? "Servicio",
        fecha: fechaLabel,
        hora: hora ?? "",
        especialista: conv.data.especialista_nombre ?? "Sin preferencia",
        negocio: businessName,
      });
```

Nota: `fechaLabel` ya está calculado unas líneas antes en ese mismo bloque.

- [ ] **Step 2: Agregar log + notifyAdmin después de cancelar cita exitosa**

En el bloque `CANCEL_CONFIRM_YES`, dentro del `if (ok)`, después del `await send(buildText("✅ Cita cancelada..."))`, agregar:

```typescript
        await insertBotLog(
          supabase, idnegocios, "CANCELAR",
          `cita #${cancel_cita_id} — ${conv.data.client_nombre ?? "Cliente"} · ${conv.data.cancel_servicio ?? "Servicio"} ${conv.data.cancel_fecha ?? ""} ${conv.data.cancel_hora ?? ""}`
        );

        await notifyAdmin(emailNotificaciones, "Canceló una cita", {
          nombre_cliente: conv.data.client_nombre ?? "Cliente",
          servicio: conv.data.cancel_servicio ?? "Servicio",
          fecha: conv.data.cancel_fecha ?? "",
          hora: conv.data.cancel_hora ?? "",
          especialista: "—",
          negocio: businessName,
        });
```

- [ ] **Step 3: Verificar que compila**

```bash
deno check supabase/functions/whatsapp-webhook/bot-engine.ts
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/whatsapp-webhook/bot-engine.ts
git commit -m "feat: log y notificacion al admin en crear y cancelar cita por bot"
```

---

## Task 8: BotConfig.jsx + BotConfig.css — nuevos campos

**Files:**
- Modify: `src/features/bot/BotConfig.jsx`
- Modify: `src/features/bot/BotConfig.css`

- [ ] **Step 1: Actualizar `DEFAULT_CONFIG`**

Reemplazar la constante `DEFAULT_CONFIG`:

```javascript
const DEFAULT_CONFIG = {
  dias_disponibles: [1, 2, 3, 4, 5, 6],
  jornadas: DEFAULT_JORNADAS,
  servicios_excluidos: [],
  mostrar_precios: true,
  email_notificaciones: '',
  telefono_contacto: '',
};
```

- [ ] **Step 2: Actualizar `fetchData` para leer los nuevos campos**

En el bloque `if (configResult.data)`, reemplazar `setConfig(...)`:

```javascript
    if (configResult.data) {
      const raw = configResult.data;
      setConfig({
        dias_disponibles: raw.dias_disponibles ?? DEFAULT_CONFIG.dias_disponibles,
        jornadas: raw.jornadas ?? DEFAULT_JORNADAS,
        servicios_excluidos: raw.servicios_excluidos ?? DEFAULT_CONFIG.servicios_excluidos,
        mostrar_precios: raw.mostrar_precios ?? DEFAULT_CONFIG.mostrar_precios,
        email_notificaciones: raw.email_notificaciones ?? '',
        telefono_contacto: raw.telefono_contacto ?? '',
      });
    }
```

- [ ] **Step 3: Agregar validación de email en `handleSave`**

Después de la validación de jornadas activas y antes de `setSaving(true)`, agregar:

```javascript
    if (
      config.email_notificaciones &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email_notificaciones.trim())
    ) {
      showSnack('El correo de notificaciones no tiene un formato válido', 'error');
      return;
    }
```

- [ ] **Step 4: Agregar los nuevos campos al payload en `handleSave`**

Reemplazar la constante `payload`:

```javascript
    const payload = {
      idnegocios: tenant.id,
      dias_disponibles: config.dias_disponibles,
      jornadas: config.jornadas,
      servicios_excluidos: config.servicios_excluidos,
      mostrar_precios: config.mostrar_precios,
      email_notificaciones: config.email_notificaciones?.trim() || null,
      telefono_contacto: config.telefono_contacto?.trim() || null,
      updated_at: new Date().toISOString(),
    };
```

- [ ] **Step 5: Agregar la sección de UI antes del footer**

Antes del bloque `{/* Footer */}`, agregar:

```jsx
        {/* Notificaciones y contacto */}
        <div className="card bot-config-card">
          <div className="bot-config-card-header">
            <div className="bot-config-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h3 className="bot-config-card-title">Notificaciones y contacto</h3>
              <p className="bot-config-card-desc">
                Recibe avisos cuando el bot gestione citas, y muestra un número de contacto a tus pacientes
              </p>
            </div>
          </div>
          <div className="bot-config-notif-fields">
            <div className="bot-config-field-group">
              <label className="bot-config-field-label">
                Correo de notificaciones al admin
              </label>
              <input
                type="email"
                className="input-field"
                value={config.email_notificaciones}
                onChange={e => setConfig(prev => ({ ...prev, email_notificaciones: e.target.value }))}
                placeholder="admin@miclinica.com"
              />
              <p className="bot-config-field-hint">
                Si está vacío, no se enviarán correos al crear, editar o cancelar citas por bot.
              </p>
            </div>
            <div className="bot-config-field-group">
              <label className="bot-config-field-label">
                Teléfono de contacto directo
              </label>
              <input
                type="text"
                className="input-field"
                value={config.telefono_contacto}
                onChange={e => setConfig(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="+57 310 000 0000"
              />
              <p className="bot-config-field-hint">
                Si está vacío, el bot no mostrará número de contacto en mensajes de error.
              </p>
            </div>
          </div>
        </div>
```

- [ ] **Step 6: Agregar los estilos en BotConfig.css**

Al final de `src/features/bot/BotConfig.css`, agregar:

```css
.bot-config-notif-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.bot-config-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.bot-config-field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-2);
}

.bot-config-field-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-4);
  line-height: 1.5;
}
```

- [ ] **Step 7: Verificar en el navegador**

```bash
npm run dev
```

1. Abrir la sección **Configuración del Bot** en el panel
2. Verificar que aparece la nueva sección "Notificaciones y contacto" con los dos inputs
3. Escribir un email inválido → guardar → debe mostrar snack de error
4. Escribir un email válido + teléfono → guardar → debe mostrar snack de éxito
5. Recargar la página → los valores deben persistir (verificar en Supabase que el row de `bot_config` tiene los nuevos valores)

- [ ] **Step 8: Commit**

```bash
git add src/features/bot/BotConfig.jsx src/features/bot/BotConfig.css
git commit -m "feat: campos email_notificaciones y telefono_contacto en BotConfig"
```

---

## Verificación final — deploy

- [ ] **Step 1: Deploy de las edge functions modificadas**

```bash
supabase functions deploy send-email
supabase functions deploy whatsapp-webhook
```

- [ ] **Step 2: Smoke test en WhatsApp**

1. Enviar un mensaje al bot → verificar que el menú ahora muestra "✏️ Editar cita"
2. Agendar una cita por el bot → verificar que llega el correo al admin (si `email_notificaciones` está configurado)
3. Editar la cita por el bot → verificar que llega el correo + registro en `logsnegocio` con `accion='EDITAR'`
4. Cancelar la cita por el bot → verificar que llega el correo + registro en `logsnegocio` con `accion='CANCELAR'`

- [ ] **Step 3: Verificar logs en Supabase**

```sql
SELECT accion, entidad, descripcion, idusuario, idnegocios, created_at
FROM logsnegocio
WHERE descripcion LIKE 'Bot WhatsApp:%'
ORDER BY created_at DESC
LIMIT 10;
```

Expected: filas con `idusuario = null` y `descripcion` comenzando con `Bot WhatsApp:`.
