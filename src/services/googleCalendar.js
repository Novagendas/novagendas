// Google Calendar integration via GIS Token Client (popup, no redirect)
// Requires VITE_CALENDAR_API = OAuth2 Client ID with calendar.events scope
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const STORAGE_KEY = 'ng_gcal_token';
const BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const CLIENT_ID = import.meta.env.VITE_CALENDAR_API;

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

export const clearCalendarAuth = () => {
  _token = null;
  _expiry = 0;
  localStorage.removeItem(STORAGE_KEY);
};

export const isCalendarConnected = () => isValid() || loadCached();

// Carga el script de GIS una sola vez
const loadGIS = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.oauth2) { resolve(); return; }
  const existing = document.getElementById('gis-script');
  if (existing) {
    existing.addEventListener('load', resolve);
    existing.addEventListener('error', reject);
    return;
  }
  const script = document.createElement('script');
  script.id = 'gis-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = resolve;
  script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
  document.head.appendChild(script);
});

// Abre popup de consentimiento de Calendar (sin redirect, sin sesión Supabase)
export const connectCalendar = () => new Promise(async (resolve, reject) => {
  try {
    await loadGIS();
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        cache(response.access_token, response.expires_in || 3600);
        resolve(true);
      },
      error_callback: (err) => {
        reject(new Error(err.message || 'Permiso denegado'));
      },
    });
    client.requestToken();
  } catch (err) {
    reject(err);
  }
});

const getToken = async () => {
  if (isValid()) return _token;
  if (loadCached()) return _token;
  throw new Error('No token disponible. Conecta Google Calendar primero.');
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
