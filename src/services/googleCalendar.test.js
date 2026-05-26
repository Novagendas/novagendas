import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  connectCalendar,
  isCalendarConnected,
  clearCalendarAuth,
  createCalendarEvent,
  deleteCalendarEvent
} from './googleCalendar';
import { supabase } from '../Supabase/supabaseClient';

vi.mock('../Supabase/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
  }
}));

describe('googleCalendar service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('connectCalendar', () => {
    it('redirects to the google calendar login edge function', () => {
      connectCalendar(123);
      expect(window.location.href).toContain('/functions/v1/google-calendar-login?idnegocios=123');
    });
  });

  describe('isCalendarConnected', () => {
    it('returns true if the integration exists', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: true, error: null });
      const result = await isCalendarConnected(123);
      expect(supabase.rpc).toHaveBeenCalledWith('has_google_integration', { p_idnegocios: 123 });
      expect(result).toBe(true);
    });

    it('returns false if there is an error or no integration', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: false, error: null });
      expect(await isCalendarConnected(123)).toBe(false);

      supabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('db error') });
      expect(await isCalendarConnected(123)).toBe(false);
    });
  });

  describe('clearCalendarAuth', () => {
    it('calls disconnect RPC', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      await clearCalendarAuth(123);
      expect(supabase.rpc).toHaveBeenCalledWith('disconnect_google_integration', { p_idnegocios: 123 });
    });
  });

  describe('createCalendarEvent', () => {
    it('calls fetch and returns the eventId on success', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, eventId: 'mock-event-id' })
      });

      const eventArgs = {
        summary: 'Test Event',
        description: 'Test Desc',
        startDateTime: '2023-10-15T10:00:00Z',
        endDateTime: '2023-10-15T11:00:00Z',
        attendeeEmails: ['test@test.com']
      };

      const result = await createCalendarEvent(123, eventArgs);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toContain('/functions/v1/google-calendar-event');
      expect(callArgs[1].method).toBe('POST');
      
      const body = JSON.parse(callArgs[1].body);
      expect(body.action).toBe('create');
      expect(body.idnegocios).toBe(123);
      expect(body.eventData.summary).toBe('Test Event');
      expect(result).toBe('mock-event-id');
    });

    it('throws error if the fetch response has success false', async () => {
      global.fetch.mockResolvedValueOnce({
        status: 400,
        json: async () => ({ success: false, error: 'Bad Request' })
      });

      await expect(createCalendarEvent(123, {})).rejects.toThrow('Bad Request');
    });
  });

  describe('deleteCalendarEvent', () => {
    it('calls delete action through fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true })
      });

      await deleteCalendarEvent(123, 'mock-event-id');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.action).toBe('delete');
      expect(body.eventId).toBe('mock-event-id');
    });
  });
});
