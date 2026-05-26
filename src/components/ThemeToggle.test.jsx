import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders with light theme by default', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('🌙'); // Light mode shows moon to switch to dark
    expect(btn).toHaveAttribute('title', 'Modo Oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles theme when clicked', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    
    // Switch to dark
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('☀️'); // Dark mode shows sun to switch to light
    expect(btn).toHaveAttribute('title', 'Modo Claro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('novagendas_theme')).toBe('dark');

    // Switch back to light
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('🌙');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('novagendas_theme')).toBe('light');
  });

  it('loads initial theme from localStorage', () => {
    localStorage.setItem('novagendas_theme', 'dark');
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('☀️');
  });

  it('applies custom className', () => {
    render(<ThemeToggle className="custom-class" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('theme-toggle-btn');
    expect(btn).toHaveClass('custom-class');
  });
});
