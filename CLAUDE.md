# NovaAgendas — CLAUDE.md

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

- Variable: `VITE_CALENDAR_API` = OAuth2 Client ID
- Flujo: GIS token client (popup OAuth en primer uso, token cacheado en localStorage)
- Se crea el evento en el calendar primario del admin autorizado (`novagendamiento@gmail.com`)
- Invitados: email del cliente + email del especialista
- Recordatorios: email 24h antes + popup 30 min antes
- Se llama en `Agenda.jsx → handleSubmit` solo al crear (no al editar)
- Fallo es silencioso (no bloquea el guardado de la cita)

**Para activar:** el administrador debe autorizar con la cuenta `novagendamiento@gmail.com` en el popup que aparece la primera vez que crea una cita.

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
VITE_CALENDAR_API=          # Google OAuth2 Client ID
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
