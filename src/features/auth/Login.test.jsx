import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';
import { supabase } from '../../Supabase/supabaseClient';

// Mocks
vi.mock('../../Supabase/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
  }
}));

vi.mock('../../components/ParticleBackground', () => ({
  default: () => <div data-testid="particle-bg" />
}));

vi.mock('../../components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle" />
}));

describe('Login Component', () => {
  const mockOnLogin = vi.fn();
  const mockOnForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // mock window.location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'test.novagendas.com' },
      writable: true
    });
  });

  it('renders login form correctly', () => {
    render(<Login tenant={{ name: 'Test Tenant' }} onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    
    expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    expect(screen.getByText('Test Tenant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@empresa.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('shows error if email is missing @', () => {
    render(<Login onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    
    const emailInput = screen.getByPlaceholderText('admin@empresa.com');
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Incluye un signo "@"/i)).toBeInTheDocument();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('shows error if password is empty', () => {
    render(<Login onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    
    const emailInput = screen.getByPlaceholderText('admin@empresa.com');
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Por favor ingresa tu contraseña.')).toBeInTheDocument();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('calls supabase rpc and onLogin upon successful authentication', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: [{
        idusuario: 1,
        nombre: 'John',
        apellido: 'Doe',
        email: 'test@test.com',
        rol_nombre: 'admin',
        idnegocios: 123,
        foto_perfil: ''
      }],
      error: null
    });

    render(<Login onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@empresa.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('login_usuario', {
        p_email: 'test@test.com',
        p_password: 'password123',
        p_subdominio: 'test'
      });
      expect(mockOnLogin).toHaveBeenCalledWith({
        id: 1,
        name: 'John Doe',
        email: 'test@test.com',
        role: 'admin',
        tenant_id: 123,
        foto_perfil: ''
      });
    });
  });

  it('shows error if supabase returns no data or error', async () => {
    // console.error is called in this branch, mock it to keep console clean
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    supabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('Invalid') });

    render(<Login onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@empresa.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas o no perteneces a este negocio.')).toBeInTheDocument();
    });

    errSpy.mockRestore();
  });

  it('toggles password visibility', () => {
    render(<Login onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    const passInput = screen.getByPlaceholderText('••••••••');
    const toggleBtn = screen.getByRole('button', { name: '👁️' });

    expect(passInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '🙈' })).toBeInTheDocument();
  });

  it('calls onForgotPassword when forgot password link is clicked', () => {
    render(<Login onLogin={mockOnLogin} onForgotPassword={mockOnForgotPassword} />);
    
    fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
    expect(mockOnForgotPassword).toHaveBeenCalled();
  });
});
