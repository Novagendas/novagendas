// Google Calendar integration via Google Identity Services (GIS) + Calendar REST API
// Requires: VITE_CALENDAR_API = OAuth2 Client ID in .env
// First use triggers an OAuth popup — the admin must authorize with novagendamiento@gmail.com

const CLIENT_ID = import.meta.env.VITE_CALENDAR_API;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const STORAGE_KEY = 'ng_gcal_token';

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

const requestToken = () =>
  new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services no cargado'));
      return;
    }
    window.google.accounts.oauth2
      .initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          if (r.error) { reject(new Error(r.error_description || r.error)); return; }
          cache(r.access_token, r.expires_in);
          resolve(r.access_token);
        },
      })
      .requestAccessToken({ prompt: '' });
  });

const getToken = async () => {
  if (isValid()) return _token;
  if (loadCached()) return _token;
  return requestToken();
};

export const clearCalendarAuth = () => {
  _token = null;
  _expiry = 0;
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Crea un evento en Google Calendar con invitados.
 * @param {object} opts
 * @param {string} opts.summary - Título del evento
 * @param {string} opts.description - Descripción detallada
 * @param {string} opts.startDateTime - ISO string (ej. "2024-04-20T10:00:00")
 * @param {string} opts.endDateTime - ISO string
 * @param {string[]} opts.attendeeEmails - Correos de invitados (cliente + especialista)
 * @returns {Promise<object|null>} Evento creado o null si falla silenciosamente
 */
export const createCalendarEvent = async ({ summary, description, startDateTime, endDateTime, attendeeEmails = [] }) => {
  if (!CLIENT_ID) return null;

  const token = await getToken();

  const event = {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone: 'America/Bogota' },
    end: { dateTime: endDateTime, timeZone: 'America/Bogota' },
    attendees: attendeeEmails.filter(Boolean).map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
};
