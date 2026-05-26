import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Services from './Services';
import { supabase } from '../../Supabase/supabaseClient';

vi.mock('../../Supabase/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
  insertLog: vi.fn(),
}));

describe('Services Component Smoke Test', () => {
  const mockTenant = { id: 1, name: 'Test Tenant' };
  const mockUser = { id: 1, idusuario: 1, nombre: 'Test', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock response: Empty lists
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

  it('renders loading state initially and then empty state', async () => {
    render(<Services tenant={mockTenant} user={mockUser} />);
    
    // Should show title
    expect(screen.getByText('Catálogo de Procedimientos')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Sin categorías/i)).toBeInTheDocument();
    });
  });

  it('opens category modal when clicking Edit Categories', async () => {
    render(<Services tenant={mockTenant} user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Sin categorías/i)).toBeInTheDocument();
    });

    const editBtn = screen.getByText('Editar Categorías');
    fireEvent.click(editBtn);

    expect(screen.getByText('Gestiona las familias de servicios.')).toBeInTheDocument();
  });
});
