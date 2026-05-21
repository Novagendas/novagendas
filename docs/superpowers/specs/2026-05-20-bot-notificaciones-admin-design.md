# Bot WhatsApp — Notificaciones al Admin + Flujo Editar Cita

**Fecha:** 2026-05-20  
**Rama:** bot_templates_resend  
**Alcance:** Notificaciones por email al administrador cuando el bot crea/edita/cancela citas, flujo de edición de cita en el bot, y campo de teléfono de contacto en bot_config.

---

## 1. Base de datos

### Migración `bot_config`

```sql
ALTER TABLE bot_config
  ADD COLUMN IF NOT EXISTS email_notificaciones TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT DEFAULT NULL;
```

**Comportamiento:**
- `email_notificaciones`: vacío → no se envía correo. Con valor → se envía notificación al admin tras cada acción del bot.
- `telefono_contacto`: vacío → el bot usa "contáctanos directamente". Con valor → el bot dice "contáctanos al *+57 XXX*".

---

## 2. Email al admin — Template `bot-actividad-admin`

### Ubicación
`supabase/functions/send-email/index.ts` — nuevo entry en `TEMPLATES`.

### Variables dinámicas
| Variable | Ejemplo |
|---|---|
| `{{accion}}` | "Creó una cita" / "Editó una cita" / "Canceló una cita" |
| `{{nombre_cliente}}` | "María López" |
| `{{servicio}}` | "Limpieza facial" |
| `{{fecha}}` | "martes, 27 de mayo" |
| `{{hora}}` | "10:30" |
| `{{especialista}}` | "Dr. Juan Pérez" / "Sin preferencia" |
| `{{negocio}}` | "Clínica Bella" |

### Subject
`"Bot WhatsApp — {{accion}} · {{negocio}}"`

### Diseño
- Mismo estilo visual que templates existentes (gradiente azul, logo, tipografía Helvetica)
- Badge "🤖 Bot WhatsApp" en el body destacando la acción
- Tabla de detalles de cita (servicio, fecha, hora, especialista, cliente)
- Sin botones CTA — solo informativo

### Función `notifyAdmin()` en `bot-engine.ts`
```ts
async function notifyAdmin(
  supabase: SupabaseClient,
  idnegocios: number,
  accion: string,
  detalles: { nombre_cliente, servicio, fecha, hora, especialista, negocio }
): Promise<void>
```
- Lee `email_notificaciones` de `bot_config`
- Si vacío → return silencioso
- Si tiene valor → llama `send-email` con template `bot-actividad-admin`
- Fallo silencioso con `console.warn` — no interrumpe el flujo del bot

**Se llama después de:**
- Cita creada exitosamente (`CONFIRM_YES`)
- Cita editada exitosamente (`EDIT_CONFIRM_YES`)
- Cita cancelada exitosamente (`CANCEL_CONFIRM_YES`)

---

## 3. Flujo de edición de cita en el bot

### Nuevos steps
```
EDIT_SELECT    → lista de citas próximas para elegir cuál editar
EDIT_DATE      → elige nueva fecha (reutiliza disponibilidad del mismo especialista)
EDIT_JORNADA   → elige jornada si hay varias disponibles
EDIT_TIME      → elige nueva hora
EDIT_CONFIRM   → confirma el cambio (muestra fecha/hora anterior vs nueva)
```

### Nuevos campos en `ConvData`
```ts
edit_cita_id?: number;
edit_servicio_nombre?: string;
edit_especialista_id?: number | null;
edit_especialista_nombre?: string;
edit_duracion?: number;
edit_fecha_anterior?: string;
edit_hora_anterior?: string;
```

### Función `updateAppointment()` en `appointment.ts`
```ts
export async function updateAppointment(
  supabase: SupabaseClient,
  idcita: number,
  idnegocios: number,
  fechahorainicio: string,
  fechahorafin: string
): Promise<boolean>
```
Hace `UPDATE cita SET fechahorainicio, fechahorafin WHERE idcita AND idnegocios`.

### Menú
Agrega botón **"Editar cita"** (`MENU_EDITAR`) — el menú pasa de 3 a 4 opciones (agendar, editar, ver, cancelar). El menú WhatsApp soporta hasta 3 botones en `button` type; si se excede, se migra a tipo `list` con una sola sección.

### `telefono_contacto`
- Se carga junto al nombre del negocio al inicio de `handleIncomingMessage()`
- Se pasa como parámetro a `buildText` / mensajes donde se menciona "contáctanos directamente"
- Nuevo helper `buildContactSuffix(telefono: string | null): string` → retorna `"\n\nPara comunicarte directamente: *{{tel}}*"` o `""` si es null

---

## 4. Logs en `logsnegocio`

Insert directo desde `bot-engine.ts` después de cada acción exitosa del bot:

```ts
await supabase.from("logsnegocio").insert([{
  accion: "CREAR" | "EDITAR" | "CANCELAR",
  entidad: "cita",
  descripcion: `Bot WhatsApp: ${accion} cita #${idcita} — ${cliente} · ${servicio} ${fecha} ${hora}`,
  idusuario: null,
  idnegocios,
}]);
```

---

## 5. Frontend — BotConfig.jsx

Dos nuevos campos en el formulario de configuración del bot:

| Campo | Label | Placeholder | Validación |
|---|---|---|---|
| `email_notificaciones` | Correo de notificaciones al admin | `admin@miclinica.com` | Formato email si no está vacío |
| `telefono_contacto` | Teléfono de contacto directo | `+57 310 000 0000` | Texto libre |

- Guardado junto al resto de la configuración del bot (mismo `upsert` existente)
- Si `email_notificaciones` tiene valor inválido → `showSnack()` de error antes de guardar

---

## 6. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/scriptsBD/bot_config_migration.sql` | Agregar `ALTER TABLE` para los 2 nuevos campos |
| `supabase/functions/send-email/index.ts` | Agregar template `bot-actividad-admin` |
| `supabase/functions/whatsapp-webhook/appointment.ts` | Agregar `updateAppointment()` |
| `supabase/functions/whatsapp-webhook/bot-engine.ts` | Flujo EDITAR, `notifyAdmin()`, logs, `telefono_contacto` en mensajes |
| `supabase/functions/whatsapp-webhook/messages.ts` | Nuevo builder para menú con 4 opciones (tipo list), `buildContactSuffix()`, builders para flujo editar |
| `src/features/bot/BotConfig.jsx` | Nuevos campos `email_notificaciones` y `telefono_contacto` |
| `src/features/bot/BotConfig.css` | Estilos si se necesitan para los nuevos campos |
