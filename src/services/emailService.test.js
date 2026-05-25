import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, getAdminEmails } from './emailService';
import { supabase } from '../Supabase/supabaseClient';

// Mock Supabase
vi.mock('../Supabase/supabaseClient', () => {
  const selectMock = vi.fn();
  const eqMock1 = vi.fn();
  const eqMock2 = vi.fn();
  const isMock = vi.fn();
  
  selectMock.mockReturnValue({ eq: eqMock1 });
  eqMock1.mockReturnValue({ eq: eqMock2 });
  eqMock2.mockReturnValue({ is: isMock });

  return {
    supabase: {
      functions: {
        invoke: vi.fn()
      },
      from: vi.fn(() => ({
        select: selectMock
      }))
    }
  };
});

// Capture console.error to keep test output clean
const originalConsoleError = console.error;
beforeEach(() => {
  vi.clearAllMocks();
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('emailService', () => {
  describe('sendEmail', () => {
    it('returns early if email is invalid or missing', async () => {
      await sendEmail('template', '', {});
      expect(supabase.functions.invoke).not.toHaveBeenCalled();

      await sendEmail('template', 'notanemail', {});
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('invokes supabase function send-email with correct parameters', async () => {
      supabase.functions.invoke.mockResolvedValueOnce({ error: null });

      await sendEmail('welcome', 'test@test.com', { name: 'Test' });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: { template: 'welcome', to: 'test@test.com', data: { name: 'Test' } }
      });
    });

    it('logs error if invoke returns an error', async () => {
      supabase.functions.invoke.mockResolvedValueOnce({ error: 'invoke error' });

      await sendEmail('welcome', 'test@test.com', {});
      expect(console.error).toHaveBeenCalledWith('[sendEmail]', 'welcome', '->', 'test@test.com', 'invoke error');
    });

    it('catches and logs error if invoke throws an exception', async () => {
      const error = new Error('Network fail');
      supabase.functions.invoke.mockRejectedValueOnce(error);

      await sendEmail('welcome', 'test@test.com', {});
      expect(console.error).toHaveBeenCalledWith('[sendEmail] invoke failed:', 'welcome', error);
    });
  });

  describe('getAdminEmails', () => {
    it('fetches admin emails for a business', async () => {
      // Setup the chain mocks
      const mockData = [
        { email: 'admin1@test.com' },
        { email: 'admin2@test.com' },
        { email: null } // should be filtered out
      ];

      // Re-mock specifically for this test
      const isMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const eqMock2 = vi.fn().mockReturnValue({ is: isMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });
      
      supabase.from.mockReturnValue({ select: selectMock });

      const emails = await getAdminEmails(123);

      expect(supabase.from).toHaveBeenCalledWith('usuario');
      expect(selectMock).toHaveBeenCalledWith('email');
      expect(eqMock1).toHaveBeenCalledWith('idnegocios', 123);
      expect(eqMock2).toHaveBeenCalledWith('rol', 'admin');
      expect(isMock).toHaveBeenCalledWith('deleted_at', null);
      
      expect(emails).toEqual(['admin1@test.com', 'admin2@test.com']);
    });

    it('returns empty array if an error is thrown', async () => {
      const isMock = vi.fn().mockRejectedValue(new Error('DB Error'));
      const eqMock2 = vi.fn().mockReturnValue({ is: isMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });
      
      supabase.from.mockReturnValue({ select: selectMock });

      const emails = await getAdminEmails(123);
      expect(emails).toEqual([]);
    });

    it('returns empty array if data is null', async () => {
      const isMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const eqMock2 = vi.fn().mockReturnValue({ is: isMock });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });
      
      supabase.from.mockReturnValue({ select: selectMock });

      const emails = await getAdminEmails(123);
      expect(emails).toEqual([]);
    });
  });
});
