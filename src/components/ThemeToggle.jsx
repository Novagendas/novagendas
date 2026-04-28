import React, { useState, useEffect } from 'react';

export default function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('novagendas_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('novagendas_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className || ''}`}
      title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
