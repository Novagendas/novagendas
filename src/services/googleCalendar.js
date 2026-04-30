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
