// Google Calendar integration via Supabase Auth OAuth + Calendar REST API
// Requires: Supabase Provider (Google) configured with calendar.events scope
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const STORAGE_KEY = 'ng_gcal_token';
const BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

let _token = null;
let _expiry = 0;

const isValid = () => _token && Date.now() < _expiry;

const loadCached = () => {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (s && Date.now() < s.expiry) {
      _token = s.token;
      _expiry = s.expiry;
      return true;
    }
  } catch { }
  return false;
};

const cache = (token, expiresIn) => {
  _token = token;
  _expiry = Date.now() + (parseInt(expiresIn) - 60) * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: _token, expiry: _expiry }));
};

const getToken = async () => {
  if (isValid()) return _token;
  if (loadCached()) return _token;
  throw new Error('No token disponible. Conecta Google Calendar primero.');
};

export const clearCalendarAuth = () => {
  _token = null;
  _expiry = 0;
  localStorage.removeItem(STORAGE_KEY);
};

export const isCalendarConnected = () => isValid() || loadCached();

// Captura el provider_token después del OAuth redirect desde Supabase
export const captureProviderToken = async (supabase) => {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (session?.provider_token) {
      cache(session.provider_token, session.expires_in || 3600);
      // Desconectar sesión Supabase para que no interfiera con login custom
      await supabase.auth.signOut({ scope: 'local' }).catch(() => null);
      return true;
    }
  } catch (error) {
    console.warn('No provider_token en sesión:', error);
  }
  return false;
};

// Inicia el flujo OAuth vía Supabase Auth
export const connectCalendar = async (supabase) => {
  const redirectPath = window.location.pathname + '?gcal=connected';
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: SCOPE,
      redirectTo: `${window.location.origin}${redirectPath}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
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

export const createCalendarEvent = async ({ summary, description, startDateTime, endDateTime, attendeeEmails = [] }) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}?sendUpdates=all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEvent({ summary, description, startDateTime, endDateTime, attendeeEmails })),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.id || null;
};

export const updateCalendarEvent = async (eventId, { summary, description, startDateTime, endDateTime, attendeeEmails = [] }) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${eventId}?sendUpdates=all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEvent({ summary, description, startDateTime, endDateTime, attendeeEmails })),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return eventId;
};

export const deleteCalendarEvent = async (eventId) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${eventId}?sendUpdates=all`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 410) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
};
