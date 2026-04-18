import React, { useState, useEffect } from 'react';

export default function ThemeToggle({ className, style }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('novagendas_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('novagendas_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <button
      onClick={toggleTheme}
      className={`btn-ghost ${className || ''}`}
      title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: '50%',
        border: 'none',
        background: theme === 'light' ? 'var(--surface-2)' : 'var(--surface)',
        color: 'var(--text)',
        cursor: 'pointer',
        transition: 'transform 0.2s var(--ease), background 0.2s var(--ease)',
        zIndex: 100,
        fontSize: '1.25rem',
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.background = 'var(--surface-overlay)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.background = theme === 'light' ? 'var(--surface-2)' : 'var(--surface)';
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
