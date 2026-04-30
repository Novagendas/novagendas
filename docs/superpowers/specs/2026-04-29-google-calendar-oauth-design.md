# Google Calendar OAuth Multi-tenant — Design Spec
Date: 2026-04-29

## Problem

The current GIS Token Client popup (`initTokenClient(...).requestToken`) fails with runtime errors and stores short-lived tokens in localStorage with no refresh capability. Every admin must re-authorize every hour.

## Goal

Server-side OAuth flow: one admin authorizes per business (`idnegocios`), tokens live in the database, refresh happens automatically, all tenants supported without manual intervention.

## Architecture

```
Admin browser
  └─ click "Conectar Google Calendar"
       └─ redirect → google-calendar-login?idnegocios=X
            └─ redirect → Google OAuth consent
                 └─ callback → google-calendar-callback?code=...&state=...
                      └─ upsert google_integrations
                           └─ redirect → <subdominio>.novagendas.com?google_connected=true

Agenda.jsx creates a cita
  └─ calls google-calendar-event Edge Function { action, idnegocios, eventData }
       └─ reads google_integrations
            └─ refreshes token if expired
                 └─ calls Google Calendar API
                      └─ returns { eventId }
```

## Database

```sql
CREATE TABLE google_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idnegocios    INT  NOT NULL UNIQUE REFERENCES negocios(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date   BIGINT NOT NULL,  -- Unix ms
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: service_role only (Edge Functions use service role key)
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
```

## Edge Functions

### 1. `google-calendar-login`
- **Input:** `?idnegocios=<int>`
- **Action:** encode state = base64(JSON { idnegocios, ts }), build Google OAuth URL, HTTP 302 redirect
- **Scopes:** `https://www.googleapis.com/auth/calendar`
- **Params:** `access_type=offline`, `prompt=consent`, `response_type=code`

### 2. `google-calendar-callback`
- **Input:** `?code=<str>&state=<base64>`
- **Action:** decode state → idnegocios, POST to Google token endpoint, upsert `google_integrations`, redirect to dashboard
- **Error handling:** redirect to dashboard with `?google_error=true` on failure

### 3. `google-calendar-event`
- **Input:** `{ idnegocios, action: "create"|"update"|"delete", eventId?, eventData? }`
- **Action:** load tokens, refresh if `expiry_date < now + 60s`, call Google Calendar REST API
- **Returns:** `{ success, eventId? }`

## Frontend Changes

### `src/services/googleCalendar.js` (rewrite)
- `connectCalendar(idnegocios)` → `window.location.href` to login Edge Function
- `isCalendarConnected(idnegocios)` → query `google_integrations` table via Supabase client
- `createCalendarEvent(idnegocios, data)` → POST to event Edge Function
- `updateCalendarEvent(idnegocios, eventId, data)` → POST to event Edge Function
- `deleteCalendarEvent(idnegocios, eventId)` → POST to event Edge Function
- Remove all GIS script loading, localStorage token caching

### `src/features/agenda/Agenda.jsx` (minimal changes)
- `confirmConnectGcal`: pass `tenant.id` to `connectCalendar()`
- On mount: check `?google_connected=true` in URL → show success snack, clean URL
- `isCalendarConnected` becomes async (await Supabase query)

## Environment Variables

| Name | Where | Value |
|------|-------|-------|
| `GOOGLE_CLIENT_ID` | Supabase Secrets | `763662841129-...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Supabase Secrets | from Google Cloud Console |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets (auto) | auto-injected |
| `SUPABASE_URL` | Supabase Secrets (auto) | auto-injected |

## Security
- State param validated on callback (must decode cleanly, `idnegocios` must be int)
- Tokens never sent to frontend
- All Edge Functions callable without auth header (login/callback are public redirects; event function validated by `idnegocios` match against caller's session)
- RLS on `google_integrations`: only service_role can read/write

## Deployment
```bash
supabase functions new google-calendar-login
supabase functions new google-calendar-callback
supabase functions new google-calendar-event
supabase functions deploy google-calendar-login --project-ref aulddrljywoigivxugqf
supabase functions deploy google-calendar-callback --project-ref aulddrljywoigivxugqf
supabase functions deploy google-calendar-event --project-ref aulddrljywoigivxugqf
```
