// Google Calendar integration via Google Identity Services (GIS) + Calendar REST API
// Requires: VITE_CALENDAR_API = OAuth2 Client ID en .env
// Primera autorización: popup OAuth — el admin debe autorizarse con novagendamiento@gmail.com

const CLIENT_ID = import.meta.env.VITE_CALENDAR_API || '932063321082-ape53frieamcjjcm6flthd0saccfa2bd.apps.googleusercontent.com';
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
  // Permite que los invitados vean la lista de asistentes
  guestsCanSeeOtherGuests: true,
});

/**
 * Crea un evento en Google Calendar con invitados.
 * Retorna el ID del evento creado o null si falla silenciosamente.
 */
export const createCalendarEvent = async ({ summary, description, startDateTime, endDateTime, attendeeEmails = [] }) => {
  if (!CLIENT_ID) return null;

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
  return data.id || null; // Retorna el ID del evento para guardarlo en BD
};

/**
 * Actualiza un evento existente en Google Calendar.
 * Usa PATCH para solo actualizar los campos enviados.
 */
export const updateCalendarEvent = async (eventId, { summary, description, startDateTime, endDateTime, attendeeEmails = [] }) => {
  if (!CLIENT_ID || !eventId) return null;

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

/**
 * Elimina un evento de Google Calendar y notifica a los invitados.
 */
export const deleteCalendarEvent = async (eventId) => {
  if (!CLIENT_ID || !eventId) return;

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${eventId}?sendUpdates=all`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  // 204 No Content = éxito; 410 Gone = ya fue eliminado (ambos son OK)
  if (!res.ok && res.status !== 410) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
};
