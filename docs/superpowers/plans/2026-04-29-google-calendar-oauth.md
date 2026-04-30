# Google Calendar OAuth Multi-tenant — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el popup OAuth de GIS (roto) por un flujo server-side con Supabase Edge Functions que almacena tokens por negocio, los refresca automáticamente, y sincroniza todas las citas al Google Calendar del admin.

**Architecture:** Tres Edge Functions en Deno manejan login→callback→eventos. El frontend deja de llamar a Google directamente; llama a las funciones. Los tokens viven en la tabla `google_integrations` con refresh automático server-side.

**Tech Stack:** Supabase Edge Functions (Deno), Google OAuth2 REST, Google Calendar REST v3, React + Supabase JS client

---

## File Map

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `supabase/functions/google-calendar-login/index.ts` | Crear | Redirige al admin a Google OAuth |
| `supabase/functions/google-calendar-callback/index.ts` | Crear | Recibe callback de Google, guarda tokens, redirige al tenant |
| `supabase/functions/google-calendar-event/index.ts` | Crear | CRUD de eventos con refresh automático de token |
| `src/services/googleCalendar.js` | Reescribir | API del frontend hacia las Edge Functions |
| `src/features/agenda/Agenda.jsx` | Modificar | Líneas 6, 68, 80, 92, 292, 580, 583 |
| Supabase DB (MCP) | SQL | Tabla `google_integrations` + RPCs auxiliares |

---

### Task 1: Tabla `google_integrations` y RPCs auxiliares en Supabase

**Files:**
- DB: tabla `google_integrations` via Supabase MCP

- [ ] **Step 1: Ejecutar el SQL en Supabase**

Usar el MCP de Supabase (`execute_postgresql`) con:

```sql
CREATE TABLE IF NOT EXISTS public.google_integrations (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  idnegocios    INT     NOT NULL UNIQUE REFERENCES negocios(id) ON DELETE CASCADE,
  access_token  TEXT    NOT NULL,
  refresh_token TEXT    NOT NULL,
  expiry_date   BIGINT  NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_google_integration(p_idnegocios INT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM google_integrations WHERE idnegocios = p_idnegocios);
$$;

CREATE OR REPLACE FUNCTION public.disconnect_google_integration(p_idnegocios INT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM google_integrations WHERE idnegocios = p_idnegocios;
$$;
```

- [ ] **Step 2: Verificar la tabla**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'google_integrations';
```

Esperado: 1 fila con `google_integrations`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add google_integrations table and helper RPCs"
```

---

### Task 2: Edge Function `google-calendar-login`

**Files:**
- Crear: `supabase/functions/google-calendar-login/index.ts`

- [ ] **Step 1: Crear la función con CLI**

```bash
cd /Users/danielsanabria/Desktop/novaGendas/novagendas
supabase functions new google-calendar-login
```

- [ ] **Step 2: Escribir el código**

Reemplazar el contenido autogenerado de `supabase/functions/google-calendar-login/index.ts` con:

```typescript
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
```

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy google-calendar-login --project-ref aulddrljywoigivxugqf
```

Esperado en consola: `Done: google-calendar-login`

- [ ] **Step 4: Verificar abriendo en el navegador**

```
https://aulddrljywoigivxugqf.supabase.co/functions/v1/google-calendar-login?idnegocios=1
```

Esperado: redirige a `accounts.google.com/o/oauth2/v2/auth?...`
Si llega a Google con el formulario de permisos → OK

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/google-calendar-login/
git commit -m "feat: add google-calendar-login edge function"
```

---

### Task 3: Edge Function `google-calendar-callback`

**Files:**
- Crear: `supabase/functions/google-calendar-callback/index.ts`

- [ ] **Step 1: Crear la función**

```bash
supabase functions new google-calendar-callback
```

- [ ] **Step 2: Escribir el código**

Contenido de `supabase/functions/google-calendar-callback/index.ts`:

```typescript
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
    .eq("id", idnegocios)
    .single();

  const subdomain = negocio?.dominio ?? "app";
  return Response.redirect(
    `https://${subdomain}.novagendas.com?google_connected=true`,
    302
  );
});
```

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy google-calendar-callback --project-ref aulddrljywoigivxugqf
```

Esperado: `Done: google-calendar-callback`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/google-calendar-callback/
git commit -m "feat: add google-calendar-callback edge function"
```

---

### Task 4: Edge Function `google-calendar-event`

**Files:**
- Crear: `supabase/functions/google-calendar-event/index.ts`

- [ ] **Step 1: Crear la función**

```bash
supabase functions new google-calendar-event
```

- [ ] **Step 2: Escribir el código**

Contenido de `supabase/functions/google-calendar-event/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GCAL_BASE =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getRefreshedToken(
  supabase: ReturnType<typeof createClient>,
  integration: { idnegocios: number; refresh_token: string }
) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: integration.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("No se pudo renovar el token de Google");
  const { access_token, expires_in } = await res.json();
  const expiry_date = Date.now() + (expires_in - 60) * 1000;
  await supabase
    .from("google_integrations")
    .update({ access_token, expiry_date, updated_at: new Date().toISOString() })
    .eq("idnegocios", integration.idnegocios);
  return access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const { idnegocios, action, eventId, eventData } = await req.json();

  if (!idnegocios || !action) {
    return json({ success: false, error: "Faltan parámetros requeridos" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: integration, error: fetchErr } = await supabase
    .from("google_integrations")
    .select("*")
    .eq("idnegocios", idnegocios)
    .single();

  if (fetchErr || !integration) {
    return json(
      { success: false, error: "Google Calendar no conectado para este negocio" },
      404
    );
  }

  let access_token: string = integration.access_token;

  if (Date.now() >= integration.expiry_date - 60_000) {
    access_token = await getRefreshedToken(supabase, integration);
  }

  const headers = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  };

  if (action === "create") {
    const res = await fetch(`${GCAL_BASE}?sendUpdates=all`, {
      method: "POST",
      headers,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    const data = await res.json();
    return json({ success: true, eventId: data.id });
  }

  if (action === "update") {
    if (!eventId)
      return json({ success: false, error: "eventId requerido para update" }, 400);
    const res = await fetch(`${GCAL_BASE}/${eventId}?sendUpdates=all`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    return json({ success: true, eventId });
  }

  if (action === "delete") {
    if (!eventId)
      return json({ success: false, error: "eventId requerido para delete" }, 400);
    const res = await fetch(`${GCAL_BASE}/${eventId}?sendUpdates=all`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok && res.status !== 410) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    return json({ success: true });
  }

  return json({ success: false, error: `Acción desconocida: ${action}` }, 400);
});
```

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy google-calendar-event --project-ref aulddrljywoigivxugqf
```

Esperado: `Done: google-calendar-event`

- [ ] **Step 4: Verificar con curl (sin integración conectada — debe responder 404)**

```bash
curl -s -X POST \
  'https://aulddrljywoigivxugqf.supabase.co/functions/v1/google-calendar-event' \
  -H 'Authorization: Bearer sb_publishable_kRI9Xe0UXW9Ma0ecTdQWZQ_6uba91Cm' \
  -H 'Content-Type: application/json' \
  -d '{"idnegocios": 9999, "action": "create"}'
```

Esperado: `{"success":false,"error":"Google Calendar no conectado para este negocio"}`

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/google-calendar-event/
git commit -m "feat: add google-calendar-event edge function with auto token refresh"
```

---

### Task 5: Reescribir `src/services/googleCalendar.js`

**Files:**
- Reescribir: `src/services/googleCalendar.js`

- [ ] **Step 1: Reemplazar todo el contenido del archivo**

```javascript
import { supabase } from '../Supabase/supabaseClient';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const connectCalendar = (idnegocios) => {
  window.location.href = `${FUNCTIONS_URL}/google-calendar-login?idnegocios=${idnegocios}`;
};

export const isCalendarConnected = async (idnegocios) => {
  const { data, error } = await supabase.rpc('has_google_integration', { p_idnegocios: idnegocios });
  return !error && data === true;
};

export const clearCalendarAuth = async (idnegocios) => {
  await supabase.rpc('disconnect_google_integration', { p_idnegocios: idnegocios });
};

const callEventFunction = async (payload) => {
  const res = await fetch(`${FUNCTIONS_URL}/google-calendar-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const buildEvent = ({ summary, description, startDateTime, endDateTime, attendeeEmails = [] }) => ({
  summary,
  description,
  start: { dateTime: startDateTime, timeZone: 'America/Bogota' },
  end: { dateTime: endDateTime, timeZone: 'America/Bogota' },
  attendees: attendeeEmails.filter(Boolean).map(email => ({ email })),
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },
      { method: 'popup', minutes: 30 },
    ],
  },
  guestsCanSeeOtherGuests: true,
});

export const createCalendarEvent = async (idnegocios, eventArgs) => {
  const { eventId } = await callEventFunction({
    idnegocios,
    action: 'create',
    eventData: buildEvent(eventArgs),
  });
  return eventId ?? null;
};

export const updateCalendarEvent = async (idnegocios, eventId, eventArgs) => {
  await callEventFunction({
    idnegocios,
    action: 'update',
    eventId,
    eventData: buildEvent(eventArgs),
  });
  return eventId;
};

export const deleteCalendarEvent = async (idnegocios, eventId) => {
  await callEventFunction({ idnegocios, action: 'delete', eventId });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/googleCalendar.js
git commit -m "feat: rewrite googleCalendar service to use Edge Functions"
```

---

### Task 6: Actualizar `src/features/agenda/Agenda.jsx`

**Files:**
- Modificar: `src/features/agenda/Agenda.jsx` (líneas 6, 68, 72-97, 292, 580, 583)

- [ ] **Step 1: Cambiar estado inicial de `calConnected` (línea 68)**

De:
```javascript
const [calConnected, setCalConnected] = useState(() => isCalendarConnected());
```

A:
```javascript
const [calConnected, setCalConnected] = useState(false);
```

- [ ] **Step 2: Agregar `useEffect` para cargar estado y manejar params de redirect**

Agregar justo después de la línea donde están los estados de Google Calendar (`showGcalDisconnectModal`):

```javascript
useEffect(() => {
  isCalendarConnected(tenant.id).then(setCalConnected);
  const params = new URLSearchParams(window.location.search);
  if (params.get('google_connected') === 'true') {
    setCalConnected(true);
    showSnack('¡Google Calendar conectado correctamente!', 'success');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (params.get('google_error')) {
    showSnack('Error al conectar Google Calendar', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Reemplazar `confirmConnectGcal` (línea ~80)**

De:
```javascript
const confirmConnectGcal = async () => {
  setShowGcalConnectModal(false);
  try {
    await connectCalendar();
    setCalConnected(true);
    showSnack('¡Google Calendar conectado correctamente!', 'success');
  } catch (err) {
    setCalConnected(false);
    showSnack('Error al conectar: ' + (err.message || 'No se pudo conectar'), 'error');
  }
};
```

A:
```javascript
const confirmConnectGcal = () => {
  setShowGcalConnectModal(false);
  connectCalendar(tenant.id);
};
```

- [ ] **Step 4: Reemplazar `confirmDisconnectGcal` (línea ~92)**

De:
```javascript
const confirmDisconnectGcal = () => {
  clearCalendarAuth();
  setCalConnected(false);
  setShowGcalDisconnectModal(false);
  showSnack('Desconectado de Google Calendar');
};
```

A:
```javascript
const confirmDisconnectGcal = async () => {
  await clearCalendarAuth(tenant.id);
  setCalConnected(false);
  setShowGcalDisconnectModal(false);
  showSnack('Desconectado de Google Calendar');
};
```

- [ ] **Step 5: Actualizar `deleteCalendarEvent` (línea 292)**

De:
```javascript
await deleteCalendarEvent(gcalEventId);
```

A:
```javascript
await deleteCalendarEvent(tenant.id, gcalEventId);
```

- [ ] **Step 6: Actualizar `updateCalendarEvent` y `createCalendarEvent` (líneas 580 y 583)**

De:
```javascript
await updateCalendarEvent(form.gcalEventId, calArgs);
```
```javascript
const newEventId = await createCalendarEvent(calArgs);
```

A:
```javascript
await updateCalendarEvent(tenant.id, form.gcalEventId, calArgs);
```
```javascript
const newEventId = await createCalendarEvent(tenant.id, calArgs);
```

- [ ] **Step 7: Commit**

```bash
git add src/features/agenda/Agenda.jsx
git commit -m "feat: wire Agenda.jsx to server-side Google Calendar OAuth"
```

---

### Task 7: Prueba end-to-end

- [ ] **Step 1: Levantar servidor de desarrollo**

```bash
npm run dev
```

- [ ] **Step 2: Flujo de conexión**

1. Login como admin en `http://localhost:5173`
2. Ir a **Agenda** → click en el botón de Google Calendar (ícono en la barra superior)
3. Confirmar en el modal → el navegador redirige a `accounts.google.com`
4. Autorizar con la cuenta del negocio (`novagendamiento@gmail.com`)
5. Google redirige a la Edge Function callback → guarda tokens → redirige a `<subdominio>.novagendas.com?google_connected=true`

> **Nota local dev:** el redirect final apunta al subdominio de producción. Para probar localmente, visitar manualmente `http://localhost:5173?google_connected=true` o desplegar en staging.

- [ ] **Step 3: Verificar tokens en Supabase**

```sql
SELECT idnegocios, expiry_date, updated_at FROM google_integrations;
```

Esperado: 1 fila con el `idnegocios` del negocio autorizado y un `expiry_date` futuro.

- [ ] **Step 4: Crear una cita de prueba**

1. Con Google Calendar conectado, crear una nueva cita en Agenda
2. Verificar en Google Calendar de `novagendamiento@gmail.com` que aparece el evento
3. Verificar en Supabase que `cita.gcal_event_id` tiene un ID de evento

- [ ] **Step 5: Flujo de desconexión**

1. Click en el botón de sincronización (verde) → modal de desconexión → confirmar
2. Verificar snack "Desconectado de Google Calendar"
3. Verificar en Supabase: `SELECT * FROM google_integrations WHERE idnegocios = <id>;` → 0 filas
