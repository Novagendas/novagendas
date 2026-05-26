import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Agenda from './Agenda';
import { supabase } from '../../Supabase/supabaseClient';

vi.mock('../../Supabase/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
  insertLog: vi.fn(),
  isDevEnvironment: false,
}));

vi.mock('../../services/googleCalendar', () => ({
  isCalendarConnected: vi.fn().mockResolvedValue(false),
  createCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  clearCalendarAuth: vi.fn(),
  connectCalendar: vi.fn(),
}));

vi.mock('../../services/emailService', () => ({
  sendEmail: vi.fn(),
  getAdminEmails: vi.fn().mockResolvedValue([]),
}));

describe('Agenda Component Smoke Test', () => {
  const mockTenant = { id: 1, name: 'Test Tenant' };
  const mockUser = { id: 1, idusuario: 1, nombre: 'Test', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockPromise = Promise.resolve({ data: [], error: null });
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      then: mockPromise.then.bind(mockPromise),
      catch: mockPromise.catch.bind(mockPromise),
      finally: mockPromise.finally.bind(mockPromise)
    };
    
    supabase.from.mockReturnValue(mockQueryBuilder);
  });

  it('renders correctly without crashing (Smoke Test)', async () => {
    render(<Agenda tenant={mockTenant} user={mockUser} />);
    
    // Should show today button or similar calendar controls
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    
    // Wait for the loading to finish and component to settle
    await waitFor(() => {
      expect(screen.getByText(/Todos los Especialistas/i)).toBeInTheDocument();
    });
  });
});
