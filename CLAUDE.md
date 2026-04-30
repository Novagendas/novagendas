# Novagendas — CLAUDE.md

Plataforma SaaS de agendamiento para clínicas estéticas y de salud. Multi-tenant por subdominio.

## Stack

- **Frontend:** React 19 + Vite 8, JavaScript (sin TypeScript)
- **Backend:** Supabase (PostgreSQL + Auth + SMTP)
- **Estilos:** CSS custom properties + inline styles (sin librería UI)
- **Idioma UI:** Español (es-CO), moneda COP

## Estructura

```
src/
  features/
    agenda/Agenda.jsx          # Calendario principal (vistas día/semana/mes, D&D)
    auth/Login.jsx             # Login con RPC custom
    auth/ForgotPassword.jsx    # Solicitud de recuperación (Supabase Auth)
    auth/ResetPassword.jsx     # Nueva contraseña (token desde URL)
    clients/Clients.jsx
    dashboard/Dashboard.jsx
    payments/Payments.jsx
    services/Services.jsx
    inventory/Inventory.jsx
    users/Users.jsx + Profile.jsx
    audit/AuditLogs.jsx
    superadmin/SuperAdminPortal.jsx
    landing/LandingPage.jsx
  services/
    googleCalendar.js          # Google Calendar REST API via GIS OAuth2
  components/
    layout/Layout.jsx + Sidebar.jsx
    SuggestionInput.jsx        # Autocomplete temático
    ParticleBackground.jsx
    ThemeToggle.jsx
  Supabase/supabaseClient.js   # Cliente + helper insertLog()
  context/GlobalState.jsx
  App.jsx                      # Router por estado + detección de tenant + LoadingScreen
```

## Multi-tenancy

- Subdominio → tabla `negocios` (`dominio`, `idestadoapp = 1`)
- Cada query lleva `.eq('idnegocios', tenant.id)`
- Sesión en localStorage con expiración de 24h (`novagendas_user`)

## Auth

- Login: RPC `login_usuario(p_email, p_password, p_idnegocios)` — NO usa Supabase Auth
- Recuperación de contraseña: `supabase.auth.resetPasswordForEmail()` → requiere que el usuario exista en `auth.users`
- Reset page: detecta `?code=` (PKCE) o `#access_token=...&type=recovery` (implicit) en URL
- Después del reset también actualiza `usuario.contrasena` para sincronizar con auth custom

## Roles

| DB              | App          | Restricciones                          |
|-----------------|--------------|----------------------------------------|
| `admin`         | `admin`      | Acceso total                           |
| `profesional`   | `especialista` | Solo Agenda y Clients propios         |
| `recepcionista` | `recepcion`  | Sin Payments ni Users                  |

## Google Calendar

Integración server-side via Supabase Edge Functions. **No usa GIS/popup de browser.**

### Arquitectura

- Flujo: Authorization Code OAuth2 → tokens almacenados en DB por `idnegocios`
- El token es del negocio (no del usuario), guardado en `google_integrations`
- Refresh automático en el servidor cuando el token expira (con buffer de 60s)

### Edge Functions (proyecto `aulddrljywoigivxugqf`)

| Función | Ruta | JWT | Qué hace |
|---|---|---|---|
| `google-calendar-login` | `/functions/v1/google-calendar-login?idnegocios=N` | No | Redirige a Google OAuth consent |
| `google-calendar-callback` | `/functions/v1/google-calendar-callback` | No | Recibe `?code=&state=`, guarda tokens en DB, redirige a `dominio.novagendas.com?google_connected=true` |
| `google-calendar-event` | `/functions/v1/google-calendar-event` (POST) | No | CRUD de eventos en Google Calendar con auto-refresh |

### Tabla DB

```sql
google_integrations (id, idnegocios UNIQUE FK→negocios, access_token, refresh_token, expiry_date BIGINT, created_at, updated_at)
-- RLS habilitado, solo service_role accede directamente
-- RPCs para frontend: has_google_integration(p_idnegocios), disconnect_google_integration(p_idnegocios)
```

### Frontend (`src/services/googleCalendar.js`)

```js
connectCalendar(idnegocios)          // window.location.href → google-calendar-login
isCalendarConnected(idnegocios)      // supabase.rpc('has_google_integration')
clearCalendarAuth(idnegocios)        // supabase.rpc('disconnect_google_integration')
createCalendarEvent(idnegocios, eventArgs)
updateCalendarEvent(idnegocios, eventId, eventArgs)
deleteCalendarEvent(idnegocios, eventId)
```

### Comportamiento en Agenda.jsx

- Al cargar: `isCalendarConnected(tenant.id)` → `setCalConnected`
- Detecta `?google_connected=true` / `?google_error=` en URL → snack + `replaceState` para limpiar URL
- Crear cita: llama `createCalendarEvent(tenant.id, {...})` — fallo es silencioso
- Editar cita: llama `updateCalendarEvent` si `form.gcalEventId` existe
- Eliminar cita: llama `deleteCalendarEvent` si `gcalEventId` existe

### Secrets en Edge Functions (Supabase Dashboard)

- `GOOGLE_CLIENT_ID` — OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` — OAuth2 Client Secret

### Redirect URI autorizado en Google Cloud

```
https://aulddrljywoigivxugqf.supabase.co/functions/v1/google-calendar-callback
```

### Eventos creados

- Invitados: email del cliente + email del especialista
- Recordatorios: email 24h antes + popup 30 min antes
- `sendUpdates=all` en create/update/delete

## Tablas principales

```
negocios         — tenants
usuario          — usuarios del sistema (auth custom)
cliente          — pacientes
cita             — citas (fechahorainicio, fechahorafin ISO)
citaservicios    — junction cita ↔ servicios (M:N)
servicios        — catálogo de servicios con duración y precio
metodopago       — métodos de pago disponibles
pagos            — transacciones
producto         — inventario
historialclinico — notas médicas por paciente
logsnegocio      — auditoría (INSERT via insertLog())
```

## Patrones de código

- Componentes funcionales con hooks (`useState`, `useEffect`, `useRef`)
- Validaciones explícitas antes del submit + `showSnack()` para feedback
- `setSaving(true/false)` en operaciones async
- Siempre filtrar por `idnegocios` en todas las queries
- `insertLog()` después de cada CREATE/UPDATE/DELETE exitoso

## Variables de entorno (.env)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# VITE_CALENDAR_API ya no se usa — Google OAuth es server-side via Edge Functions
```

## Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
```

## Notas importantes

- Subdominio `admin` / `superadmin` → SuperAdminPortal (bypasa login de tenant)
- El loading screen inicial está en `App.jsx` como componente `LoadingScreen`
- `SearchableSelect` en Agenda y `ClientSearchSelect` en Payments son componentes locales similares — si se necesita reutilizar más, extraer a `src/components/`
- La contraseña en la tabla `usuario` se actualiza en texto plano en el reset — considerar hashear con bcrypt en producción
