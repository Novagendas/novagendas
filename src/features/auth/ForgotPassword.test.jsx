import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from './ForgotPassword';
import { supabase } from '../../Supabase/supabaseClient';

vi.mock('../../Supabase/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    }
  }
}));

vi.mock('../../components/ParticleBackground', () => ({
  default: () => <div data-testid="particle-bg" />
}));

vi.mock('../../components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle" />
}));

describe('ForgotPassword Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forgot password form initially', () => {
    render(<ForgotPassword onBack={mockOnBack} />);
    
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
  });

  it('shows error for invalid email', () => {
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const emailInput = screen.getByPlaceholderText('tu@correo.com');
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/i }));
    
    expect(screen.getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('calls supabase send-reset-email function on valid submit', async () => {
    supabase.functions.invoke.mockResolvedValueOnce({ error: null });
    
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const emailInput = screen.getByPlaceholderText('tu@correo.com');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/i }));
    
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-reset-email', {
        body: { email: 'test@test.com', redirectTo: window.location.origin }
      });
      // Should show success screen
      expect(screen.getByText('¡Revisa tu correo!')).toBeInTheDocument();
    });
  });

  it('shows error if supabase invocation fails', async () => {
    supabase.functions.invoke.mockResolvedValueOnce({ error: new Error('Function failed') });
    
    render(<ForgotPassword onBack={mockOnBack} />);
    
    const emailInput = screen.getByPlaceholderText('tu@correo.com');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/i }));
    
    await waitFor(() => {
      expect(screen.getByText('No se pudo enviar el correo. Verifica que el correo esté registrado.')).toBeInTheDocument();
      // Should not show success screen
      expect(screen.queryByText('¡Revisa tu correo!')).not.toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked in form', () => {
    render(<ForgotPassword onBack={mockOnBack} />);
    fireEvent.click(screen.getByText('← Volver al inicio de sesión'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('calls onBack when back button is clicked in success screen', async () => {
    supabase.functions.invoke.mockResolvedValueOnce({ error: null });
    render(<ForgotPassword onBack={mockOnBack} />);
    
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/i }));
    
    await waitFor(() => {
      expect(screen.getByText('¡Revisa tu correo!')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Volver al inicio de sesión'));
    expect(mockOnBack).toHaveBeenCalled();
  });
});
