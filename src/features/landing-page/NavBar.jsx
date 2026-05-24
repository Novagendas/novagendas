import { useState, useEffect } from 'react';
import { NAV_LINKS } from './data';
import { ArrowRight, MenuIcon, CloseIcon } from './icons';
import './NavBar.css';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
      <div className="lp-container lp-nav-inner">
        <div className="lp-nav-brand">
          <img src="/logoclaro.jpeg" alt="Novagendas" className="lp-nav-logo" />
          <span className="lp-nav-name">Novagendas</span>
        </div>

        <div className="lp-nav-links">
          {NAV_LINKS.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="lp-nav-link">{label}</a>
          ))}
        </div>

        <div className="lp-nav-actions">
          <a href="mailto:sanabria3210@gmail.com" className="lp-btn-primary lp-btn-sm">
            Contactar <ArrowRight />
          </a>
          <button
            className="lp-nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lp-mobile-menu" role="dialog" aria-label="Menú de navegación">
          <button className="lp-mobile-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar">✕</button>
          {NAV_LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setMenuOpen(false)}
              className="lp-mobile-link"
            >
              {label}
            </a>
          ))}
          <a href="mailto:sanabria3210@gmail.com" className="lp-btn-primary" style={{ marginTop: '1rem' }}>
            Contactar <ArrowRight />
          </a>
        </div>
      )}
    </nav>
  );
}
