import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Clients from './Clients';
import { supabase } from '../../Supabase/supabaseClient';

vi.mock('../../Supabase/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
  insertLog: vi.fn(),
}));

describe('Clients Component Smoke Test', () => {
  const mockTenant = { id: 1, name: 'Test Tenant' };
  const mockUser = { id: 1, idusuario: 1, nombre: 'Test', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase to return empty arrays
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    });
    
    supabase.from.mockReturnValue({
      select: mockSelect
    });
  });

  it('renders header and search bar correctly', async () => {
    render(<Clients tenant={mockTenant} user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar paciente/i)).toBeInTheDocument();
    });
  });

  it('updates search input value correctly', async () => {
    render(<Clients tenant={mockTenant} user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar paciente/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar paciente/i);
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    
    expect(searchInput.value).toBe('Juan');
  });

  it('opens register modal when clicking Nuevo Paciente', async () => {
    render(<Clients tenant={mockTenant} user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Nuevo Paciente')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Nuevo Paciente'));
    
    expect(screen.getByRole('heading', { name: /Nuevo Paciente/i })).toBeInTheDocument();
  });
});
