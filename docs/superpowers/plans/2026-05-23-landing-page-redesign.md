# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescribir la landing page de Novagendas con un diseño Clean Light (Calendly-style), componentes separados por sección en `src/features/landing-page/`.

**Architecture:** Cada sección de la landing es un componente independiente con su propio JSX y CSS. Un `index.jsx` los ensambla. Design tokens y animaciones globales en `landing.css`. Constantes de datos en `data.js`.

**Tech Stack:** React 19, Vite, JavaScript (sin TypeScript), CSS custom properties

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/features/landing-page/landing.css` | Crear | Design tokens CSS, botones, animaciones, utilidades |
| `src/features/landing-page/data.js` | Crear | Constantes: FEATURES, SECTORES, NAV_LINKS, DIFF_ITEMS, etc. |
| `src/features/landing-page/icons.jsx` | Crear | SVG icons compartidos: ArrowRight, GCalIcon, CheckIcon |
| `src/features/landing-page/NavBar.jsx` | Crear | Nav sticky con scroll shadow, links, CTA, hamburger mobile |
| `src/features/landing-page/NavBar.css` | Crear | Estilos NavBar |
| `src/features/landing-page/HeroSection.jsx` | Crear | Hero split: texto + bento grid + parallax sutil |
| `src/features/landing-page/HeroSection.css` | Crear | Estilos HeroSection |
| `src/features/landing-page/SectoresSection.jsx` | Crear | Chips de sectores |
| `src/features/landing-page/SectoresSection.css` | Crear | Estilos SectoresSection |
| `src/features/landing-page/FeaturesSection.jsx` | Crear | Grid 3-col de features + card GCal wide |
| `src/features/landing-page/FeaturesSection.css` | Crear | Estilos FeaturesSection |
| `src/features/landing-page/DiffSection.jsx` | Crear | "Por qué elegirnos" — fondo claro, demo card |
| `src/features/landing-page/DiffSection.css` | Crear | Estilos DiffSection |
| `src/features/landing-page/CTASection.jsx` | Crear | Sección CTA centrada |
| `src/features/landing-page/CTASection.css` | Crear | Estilos CTASection |
| `src/features/landing-page/FooterSection.jsx` | Crear | Footer con logo, contacto, copyright |
| `src/features/landing-page/FooterSection.css` | Crear | Estilos FooterSection |
| `src/features/landing-page/index.jsx` | Crear | Entry point: monta todo, useReveal hook |
| `src/App.jsx` | Modificar | Cambiar import LandingPage → landing-page/index |
| `src/features/landing/LandingPage.jsx` | Eliminar | Obsoleto |
| `src/features/landing/LandingPage.css` | Eliminar | Obsoleto |

---

## Task 0: Design Tokens + Data + Icons

**Files:**
- Create: `src/features/landing-page/landing.css`
- Create: `src/features/landing-page/data.js`
- Create: `src/features/landing-page/icons.jsx`

- [ ] **Step 1: Crear `landing.css`**

```css
/* landing.css — Design tokens + utilidades globales */

:root {
  --lp-navy:        #0B3558;
  --lp-blue:        #006BFF;
  --lp-blue-dark:   #004EBA;
  --lp-blue-light:  #C1DEFE;
  --lp-blue-bg:     #F4F8FF;
  --lp-magenta:     #D946EF;
  --lp-slate:       #476788;

  --lp-bg:          #FFFFFF;
  --lp-bg-alt:      #F8F9FB;

  --lp-text:        #0A0A0A;
  --lp-text-2:      #476788;
  --lp-text-muted:  #A6BBD1;

  --lp-border:      #D4E0ED;
  --lp-border-2:    #E7EDF6;

  --lp-success:     #14AA51;

  --lp-shadow-sm:
    rgba(71, 103, 136, 0.04) 0px 4px 5px 0px,
    rgba(71, 103, 136, 0.03) 0px 8px 15px 0px,
    rgba(71, 103, 136, 0.06) 0px 15px 30px 0px;
  --lp-shadow-md:
    rgba(71, 103, 136, 0.04) 0px 4px 5px 0px,
    rgba(71, 103, 136, 0.03) 0px 8px 15px 0px,
    rgba(71, 103, 136, 0.08) 0px 30px 50px 0px;
  --lp-shadow-nav:  rgba(0, 0, 0, 0.04) 0px 4px 4px 0px;

  --lp-radius-card:    24px;
  --lp-radius-compact: 16px;
  --lp-radius-btn:     8px;
  --lp-radius-pill:    50px;

  --lp-font: 'Gilroy', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* ── Container ── */
.lp-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

/* ── Section chrome ── */
.lp-section-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lp-blue);
  background: var(--lp-blue-bg);
  border: 1px solid rgba(0, 107, 255, 0.15);
  border-radius: var(--lp-radius-pill);
  padding: 0.3rem 0.9rem;
  margin-bottom: 1rem;
}

.lp-section-h2 {
  font-family: var(--lp-font);
  font-size: clamp(1.9rem, 5vw, 2.8rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin: 0 0 1rem;
  color: var(--lp-navy);
}

.lp-section-sub {
  font-size: 1.05rem;
  color: var(--lp-text-2);
  line-height: 1.65;
  margin: 0 0 3rem;
  max-width: 640px;
}

.lp-gradient-text {
  background: linear-gradient(135deg, var(--lp-blue), var(--lp-magenta));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Buttons ── */
.lp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--lp-blue);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--lp-radius-btn);
  border: none;
  cursor: pointer;
  text-decoration: none;
  height: 44px;
  box-sizing: border-box;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
}
.lp-btn-primary::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}
.lp-btn-primary:hover {
  background: var(--lp-blue-dark);
  box-shadow: rgba(0, 107, 255, 0.15) 0px 4px 12px;
  transform: translateY(-1px);
}
.lp-btn-primary:hover::after { left: 100%; }

.lp-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  color: var(--lp-navy);
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--lp-radius-btn);
  border: 1px solid var(--lp-navy);
  cursor: pointer;
  text-decoration: none;
  height: 44px;
  box-sizing: border-box;
  white-space: nowrap;
  transition: background 0.2s, transform 0.2s;
}
.lp-btn-secondary:hover {
  background: var(--lp-bg-alt);
  transform: translateY(-1px);
}

/* ── Pills ── */
.lp-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--lp-bg-alt);
  color: var(--lp-text-2);
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-pill);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 5px 13px;
}
.lp-pill--primary {
  background: var(--lp-blue-bg);
  color: var(--lp-blue);
  border-color: rgba(0, 107, 255, 0.2);
}
.lp-pill--green {
  background: #dcfce7;
  color: #15803d;
  border-color: #86efac;
}

/* ── Pulse dot ── */
.lp-pulse-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
  animation: lp-pulse 2s ease-in-out infinite;
}
@keyframes lp-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

/* ── Event chips ── */
.lp-ev-blue   { background: #dbeafe; color: #2563eb; }
.lp-ev-green  { background: #dcfce7; color: #16a34a; }
.lp-ev-purple { background: #ede9fe; color: #7c3aed; }
.lp-ev-orange { background: #ffedd5; color: #ea580c; }
.lp-ev-pink   { background: #fce7f3; color: #db2777; }
.lp-ev-main   { background: var(--lp-blue); color: #fff; }

/* ── Animations ── */
.lp-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.lp-reveal-visible {
  opacity: 1;
  transform: translateY(0);
}
.lp-stagger-1 { transition-delay: 0.05s; }
.lp-stagger-2 { transition-delay: 0.13s; }
.lp-stagger-3 { transition-delay: 0.22s; }
.lp-stagger-4 { transition-delay: 0.32s; }
.lp-stagger-5 { transition-delay: 0.42s; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .lp-container { padding: 0 16px; }
  .lp-section-h2 { font-size: 1.8rem; }
}
```

- [ ] **Step 2: Crear `data.js`**

```js
// data.js — constantes de la landing page

export const NAV_LINKS = [
  { id: 'funciones', label: 'Funciones' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'sectores', label: 'Sectores' },
];

export const SECTORES = [
  { label: '🏥 Clínicas estéticas', highlight: true },
  { label: '🧖 Spas & bienestar' },
  { label: '🦷 Consultorios' },
  { label: '✂️ Barberías & salones' },
  { label: '🧠 Psicólogos' },
  { label: '💪 Centros deportivos' },
  { label: '🐾 Veterinarias' },
  { label: '+ Más' },
];

export const FEATURES = [
  {
    iconBg: '#EEF4FF',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Agenda drag & drop',
    desc: 'Vistas día, semana y mes. Arrastra citas para moverlas. Múltiples especialistas y detección automática de conflictos de horario.',
  },
  {
    iconBg: '#DBEAFE',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Gestión de clientes',
    desc: 'Historial completo por cliente, evolución por sesión, notas privadas y datos de contacto centralizados.',
  },
  {
    iconBg: '#DCFCE7',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Control de pagos',
    desc: 'Registro de cobros por cita: monto, método de pago y abonos parciales. Consulta ingresos por período.',
  },
  {
    iconBg: '#FFEDD5',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      </svg>
    ),
    title: 'Control de inventario',
    desc: 'Seguimiento de productos e insumos. Alertas de stock bajo. Registro de consumo por sesión.',
  },
  {
    iconBg: '#F0FDF4',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="5" height="9"/>
        <rect x="9" y="7" width="5" height="14"/>
        <rect x="15" y="3" width="5" height="18"/>
      </svg>
    ),
    title: 'Estadísticas y reportes',
    desc: 'Ingresos, citas por especialista, servicios más rentables y tendencias mes a mes en tiempo real.',
  },
  {
    iconBg: '#FCE7F3',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    title: 'Roles y permisos',
    desc: 'Admin, recepcionista y especialista. Cada usuario ve solo lo que le corresponde, con trazabilidad completa.',
  },
];

export const DIFF_ITEMS = [
  'Acceso desde cualquier dispositivo con navegador',
  'Multi-tenant: cada negocio en su propio subdominio',
  'Sincronización nativa con Google Calendar',
  'Días festivos y bloqueos de agenda configurables',
  'Registro de auditoría de cada acción del equipo',
];

export const DEMO_STATS = [
  { val: '24', label: 'Citas hoy' },
  { val: '8', label: 'Especialistas' },
  { val: '312', label: 'Clientes' },
];

export const DEMO_BARS = [
  ['Servicio A', 78],
  ['Servicio B', 63],
  ['Servicio C', 45],
];

export const BENTO_WEEK = [
  { day: 'LUN', events: [{ label: '09:00 · Cita', cls: 'lp-ev-blue' }, { label: '11:30', cls: 'lp-ev-purple' }] },
  { day: 'MAR', events: [{ label: '10:00 · Cita', cls: 'lp-ev-green' }] },
  { day: 'MIÉ', events: [{ label: '09:00 · Nueva', cls: 'lp-ev-main' }, { label: '14:00', cls: 'lp-ev-orange' }] },
  { day: 'JUE', events: [{ label: '📅 GCal', cls: 'lp-ev-pink' }, { label: '11:00', cls: 'lp-ev-blue' }] },
  { day: 'VIE', events: [{ label: '09:30', cls: 'lp-ev-green' }, { label: '15:00', cls: 'lp-ev-purple' }] },
];

export const BAR_HEIGHTS = [60, 80, 45, 95, 70, 85];
```

- [ ] **Step 3: Crear `icons.jsx`**

```jsx
// icons.jsx — SVG icons compartidos

export const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const GCalIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14AA51" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
```

- [ ] **Step 4: Verificar — abrir dev server y confirmar sin errores de compilación**

```bash
npm run dev
```
Esperado: servidor en http://localhost:5173 sin errores. Los archivos nuevos no están importados todavía, no hay efecto visible aún.

- [ ] **Step 5: Commit**

```bash
git add src/features/landing-page/landing.css src/features/landing-page/data.js src/features/landing-page/icons.jsx docs/
git commit -m "feat: add landing-page design tokens, data and icons"
```

---

## Task 1: NavBar

**Files:**
- Create: `src/features/landing-page/NavBar.jsx`
- Create: `src/features/landing-page/NavBar.css`

- [ ] **Step 1: Crear `NavBar.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { NAV_LINKS } from './data';
import { ArrowRight, MenuIcon, CloseIcon } from './icons';
import './NavBar.css';
import '../../../features/landing-page/landing.css';

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
```

- [ ] **Step 2: Crear `NavBar.css`**

```css
.lp-nav {
  position: sticky;
  top: 0;
  z-index: 200;
  background: #fff;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s, box-shadow 0.3s;
  font-family: var(--lp-font);
}
.lp-nav--scrolled {
  border-bottom-color: var(--lp-border);
  box-shadow: var(--lp-shadow-nav);
}
.lp-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.lp-nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.lp-nav-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: contain;
}
.lp-nav-name {
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--lp-navy);
}
.lp-nav-links {
  display: flex;
  gap: 2rem;
}
.lp-nav-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--lp-navy);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: var(--lp-radius-btn);
  transition: background 0.15s, color 0.15s;
}
.lp-nav-link:hover {
  background: var(--lp-bg-alt);
  color: var(--lp-blue);
}
.lp-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.lp-btn-sm {
  font-size: 0.875rem !important;
  padding: 8px 16px !important;
  height: 36px !important;
}
.lp-nav-hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--lp-navy);
  padding: 0.25rem;
  line-height: 1;
}
.lp-mobile-menu {
  position: fixed;
  inset: 0;
  background: #fff;
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}
.lp-mobile-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--lp-text-2);
}
.lp-mobile-link {
  font-size: 2rem;
  font-weight: 800;
  color: var(--lp-navy);
  text-decoration: none;
  letter-spacing: -0.04em;
}

@media (max-width: 768px) {
  .lp-nav-links { display: none; }
  .lp-nav-actions .lp-btn-primary { display: none; }
  .lp-nav-hamburger { display: flex; }
}
```

- [ ] **Step 3: Verificar visualmente**

Importar temporalmente en `index.jsx` (crear el archivo vacío si no existe) y confirmar en http://localhost:5173 que la nav es visible, sticky, y el hamburger aparece en mobile (< 768px).

- [ ] **Step 4: Commit**

```bash
git add src/features/landing-page/NavBar.jsx src/features/landing-page/NavBar.css
git commit -m "feat: add NavBar component"
```

---

## Task 2: HeroSection

**Files:**
- Create: `src/features/landing-page/HeroSection.jsx`
- Create: `src/features/landing-page/HeroSection.css`

- [ ] **Step 1: Crear `HeroSection.jsx`**

```jsx
import { useRef, useEffect } from 'react';
import { GCalIcon, ArrowRight } from './icons';
import { BENTO_WEEK, BAR_HEIGHTS } from './data';
import './HeroSection.css';

export default function HeroSection() {
  const bentoRef = useRef(null);

  useEffect(() => {
    let rafId;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (bentoRef.current) {
          const y = window.scrollY * 0.08;
          bentoRef.current.style.transform = `translateY(${y}px)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="lp-hero-wrap">
      <div className="lp-hero lp-container">

        {/* ── Left ── */}
        <div className="lp-hero-left">
          <div className="lp-pill-row lp-reveal lp-stagger-1">
            <span className="lp-pill lp-pill--primary">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Software de agendamiento
            </span>
            <span className="lp-pill lp-pill--green">✓ Google Calendar</span>
            <span className="lp-pill">Multi-usuario</span>
          </div>

          <h1 className="lp-hero-h1 lp-reveal lp-stagger-2">
            Agenda tu negocio.<br />
            <span className="lp-gradient-text">Sin caos. Sin papel.</span>
          </h1>

          <p className="lp-hero-sub lp-reveal lp-stagger-3">
            Novagendas centraliza citas, clientes, pagos e inventario en una sola plataforma.
            Para clínicas, spas, consultorios y cualquier negocio que trabaje con citas.
          </p>

          <div className="lp-gcal-badge lp-reveal lp-stagger-4">
            <GCalIcon size={20} />
            <span>Integración nativa con Google Calendar</span>
            <span className="lp-gcal-badge-sync">
              <span className="lp-pulse-dot" />
              Tiempo real
            </span>
          </div>

          <div className="lp-hero-ctas lp-reveal lp-stagger-5">
            <a href="#funciones" className="lp-btn-primary">
              Ver funcionalidades <ArrowRight />
            </a>
            <a href="#como-funciona" className="lp-btn-secondary">
              Cómo funciona
            </a>
          </div>
        </div>

        {/* ── Right — Bento ── */}
        <div className="lp-bento lp-reveal lp-stagger-2" ref={bentoRef}>

          <div className="lp-bento-card lp-bento-card--accent">
            <span className="lp-bento-label">Citas hoy</span>
            <div className="lp-bento-num">24</div>
            <span className="lp-bento-trend">↑ 3 vs ayer</span>
          </div>

          <div className="lp-bento-card lp-bento-card--dark">
            <div className="lp-gcal-sync-row">
              <span className="lp-pulse-dot" />
              <span className="lp-gcal-sync-text">Google Calendar activo</span>
            </div>
            <span className="lp-gcal-sync-sub">Último sync hace 2 min · 8 eventos</span>
            <div className="lp-gcal-sync-tag">
              <GCalIcon size={11} />
              novagendas ↔ tu calendario
            </div>
          </div>

          <div className="lp-bento-card lp-bento-card--wide">
            <div className="lp-bento-week-header">
              <span className="lp-bento-label">Agenda esta semana</span>
              <span className="lp-bento-new-btn">+ Nueva cita</span>
            </div>
            <div className="lp-bento-week">
              {BENTO_WEEK.map(({ day, events }) => (
                <div key={day} className="lp-week-col">
                  <span className="lp-week-hd">{day}</span>
                  {events.map((ev, i) => (
                    <div key={i} className={`lp-week-ev ${ev.cls}`}>{ev.label}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="lp-bento-card">
            <span className="lp-bento-label">Ingresos este mes</span>
            <div className="lp-bento-num lp-bento-num--sm">$4.2M</div>
            <div className="lp-mini-bars">
              {BAR_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className={`lp-mini-bar${i === 3 ? ' lp-mini-bar--accent' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="lp-bento-card">
            <span className="lp-bento-label">Módulos activos</span>
            <div className="lp-fpills">
              <span className="lp-fpill lp-fpill-blue">📅 Agenda</span>
              <span className="lp-fpill lp-fpill-green">💰 Pagos</span>
              <span className="lp-fpill lp-fpill-purple">👥 Clientes</span>
              <span className="lp-fpill lp-fpill-orange">📦 Inventario</span>
              <span className="lp-fpill lp-fpill-blue">📊 Reportes</span>
              <span className="lp-fpill lp-fpill-green">👤 Equipo</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `HeroSection.css`**

```css
/* ── Hero wrapper ── */
.lp-hero-wrap {
  background: #fff;
  border-bottom: 1px solid var(--lp-border);
  position: relative;
  overflow: hidden;
}
.lp-hero-wrap::before {
  content: '';
  position: absolute;
  top: -15%; left: -5%;
  width: 45vw; height: 45vw;
  background: radial-gradient(circle, rgba(0, 107, 255, 0.07) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}
.lp-hero-wrap::after {
  content: '';
  position: absolute;
  bottom: -10%; right: -5%;
  width: 35vw; height: 35vw;
  background: radial-gradient(circle, rgba(217, 70, 239, 0.05) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.lp-hero {
  position: relative;
  z-index: 1;
  padding: 5rem 40px 4.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

/* ── Left ── */
.lp-hero-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lp-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.lp-hero-h1 {
  margin: 0;
  font-family: var(--lp-font);
  font-size: clamp(2.6rem, 5vw, 3.8rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.03;
  color: var(--lp-navy);
}

.lp-hero-sub {
  margin: 0;
  font-size: 1.05rem;
  color: var(--lp-text-2);
  line-height: 1.68;
  max-width: 480px;
}

/* GCal badge */
.lp-gcal-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--lp-bg-alt);
  border: 1px solid var(--lp-border);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--lp-text);
  width: fit-content;
  flex-wrap: wrap;
}
.lp-gcal-badge-sync {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--lp-success);
  font-weight: 600;
}

.lp-hero-ctas {
  display: flex;
  gap: 0.875rem;
  flex-wrap: wrap;
}

/* ── Bento ── */
.lp-bento {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  will-change: transform;
}

.lp-bento-card {
  background: #fff;
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-card);
  padding: 1.25rem;
  box-shadow: var(--lp-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s;
}
.lp-bento-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--lp-shadow-md);
  border-color: rgba(0, 107, 255, 0.25);
}

.lp-bento-card--accent {
  background: var(--lp-blue-bg);
  border-color: rgba(0, 107, 255, 0.2);
}
.lp-bento-card--dark {
  background: #0f172a;
  border-color: #1e293b;
}
.lp-bento-card--wide { grid-column: span 2; }

.lp-bento-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.lp-bento-num {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--lp-navy);
  line-height: 1;
}
.lp-bento-num--sm { font-size: 1.7rem; }
.lp-bento-trend { font-size: 0.75rem; color: var(--lp-success); font-weight: 600; }

/* GCal dark card */
.lp-gcal-sync-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 7px 10px;
}
.lp-gcal-sync-text { font-size: 0.72rem; color: rgba(255,255,255,0.8); font-weight: 600; }
.lp-gcal-sync-sub  { font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 600; }
.lp-gcal-sync-tag  {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  color: rgba(255,255,255,0.55);
  font-weight: 700;
  margin-top: 2px;
}

/* Week mini calendar */
.lp-bento-week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.lp-bento-new-btn {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--lp-blue);
  background: var(--lp-blue-bg);
  border-radius: 6px;
  padding: 2px 8px;
}
.lp-bento-week {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.lp-week-col { display: flex; flex-direction: column; gap: 3px; }
.lp-week-hd {
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--lp-text-muted);
  text-align: center;
}
.lp-week-ev {
  font-size: 0.55rem;
  font-weight: 700;
  border-radius: 5px;
  padding: 3px 4px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
}

/* Mini bar chart */
.lp-mini-bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 48px;
  margin-top: 4px;
}
.lp-mini-bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  background: var(--lp-border-2);
}
.lp-mini-bar--accent {
  background: linear-gradient(180deg, var(--lp-blue), #4299e1);
}

/* Feature pills */
.lp-fpills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
.lp-fpill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--lp-radius-pill);
}
.lp-fpill-blue   { background: #dbeafe; color: #1d4ed8; }
.lp-fpill-green  { background: #dcfce7; color: #15803d; }
.lp-fpill-purple { background: #ede9fe; color: #6d28d9; }
.lp-fpill-orange { background: #ffedd5; color: #c2410c; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .lp-hero {
    grid-template-columns: 1fr;
    gap: 3rem;
    padding: 4rem 24px 3rem;
  }
}
@media (max-width: 768px) {
  .lp-hero { padding: 3.5rem 16px 3rem; }
  .lp-hero-h1 { font-size: 2.4rem; }
  .lp-hero-ctas { flex-direction: column; }
  .lp-bento { display: none; }
}
```

- [ ] **Step 3: Verificar visualmente** — confirmar en http://localhost:5173 que el hero muestra H1, pills, CTAs y bento grid. En desktop el bento tiene parallax al hacer scroll. En mobile el bento desaparece.

- [ ] **Step 4: Commit**

```bash
git add src/features/landing-page/HeroSection.jsx src/features/landing-page/HeroSection.css
git commit -m "feat: add HeroSection with bento grid and parallax"
```

---

## Task 3: SectoresSection

**Files:**
- Create: `src/features/landing-page/SectoresSection.jsx`
- Create: `src/features/landing-page/SectoresSection.css`

- [ ] **Step 1: Crear `SectoresSection.jsx`**

```jsx
import { SECTORES } from './data';
import './SectoresSection.css';

export default function SectoresSection() {
  return (
    <div id="sectores" className="lp-sectores">
      <div className="lp-container">
        <p className="lp-sectores-label">Para cualquier negocio que trabaje con citas</p>
        <div className="lp-sectores-chips">
          {SECTORES.map(({ label, highlight }) => (
            <div
              key={label}
              className={`lp-sector-chip${highlight ? ' lp-sector-chip--highlight' : ''}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `SectoresSection.css`**

```css
.lp-sectores {
  background: var(--lp-bg-alt);
  border-top: 1px solid var(--lp-border);
  border-bottom: 1px solid var(--lp-border);
  padding: 3rem 0;
}
.lp-sectores-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--lp-text-muted);
  text-align: center;
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.lp-sectores-chips {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.lp-sector-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-pill);
  padding: 8px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--lp-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.lp-sector-chip:hover {
  border-color: var(--lp-blue-light);
  box-shadow: 0 2px 8px rgba(0, 107, 255, 0.08);
}
.lp-sector-chip--highlight {
  background: var(--lp-blue-bg);
  border-color: rgba(0, 107, 255, 0.25);
  color: var(--lp-blue);
}

@media (max-width: 480px) {
  .lp-sector-chip { font-size: 0.8rem; padding: 6px 14px; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/landing-page/SectoresSection.jsx src/features/landing-page/SectoresSection.css
git commit -m "feat: add SectoresSection"
```

---

## Task 4: FeaturesSection

**Files:**
- Create: `src/features/landing-page/FeaturesSection.jsx`
- Create: `src/features/landing-page/FeaturesSection.css`

- [ ] **Step 1: Crear `FeaturesSection.jsx`**

```jsx
import { FEATURES } from './data';
import { GCalIcon } from './icons';
import './FeaturesSection.css';

export default function FeaturesSection() {
  return (
    <section id="funciones" className="lp-features-section">
      <div className="lp-container">
        <div className="lp-section-tag lp-reveal">Funcionalidades</div>
        <h2 className="lp-section-h2 lp-reveal lp-stagger-1">
          Todo lo que tu negocio <span className="lp-gradient-text">realmente necesita</span>
        </h2>
        <p className="lp-section-sub lp-reveal lp-stagger-2">
          Cada módulo fue construido para el flujo real de un negocio con citas. Sin funciones de relleno.
        </p>

        <div className="lp-features-grid">

          {/* GCal card — full width */}
          <div className="lp-feat-card lp-feat-card--gcal lp-reveal">
            <div className="lp-feat-gcal-content">
              <div className="lp-feat-icon" style={{ background: '#F0FDF4' }}>📅</div>
              <div className="lp-feat-title">Sincronización con Google Calendar</div>
              <p className="lp-feat-desc">
                Todas las citas se sincronizan automáticamente con Google Calendar de tu negocio.
                Tus clientes reciben invitaciones con recordatorios — tú ves todo desde un solo lugar.
              </p>
              <div className="lp-gcal-flow">
                <div className="lp-gcal-flow-node"><GCalIcon size={14} /> Google Calendar</div>
                <span className="lp-gcal-flow-arrow">⇄</span>
                <div className="lp-gcal-flow-node">📅 Novagendas</div>
                <span className="lp-gcal-flow-arrow">→</span>
                <div className="lp-gcal-flow-node">✉️ Invitación al cliente</div>
              </div>
            </div>
            <div className="lp-feat-gcal-visual">
              <div className="lp-feat-gcal-visual-label">Vista sincronizada</div>
              <div className="lp-gcal-mini-week">
                {[
                  { day: 'HOY',  evs: [{ label: '10:00 Cita', cls: 'lp-ev-main' }, { label: '📅 GCal', cls: 'lp-ev-pink' }] },
                  { day: 'MAÑ',  evs: [{ label: '09:30', cls: 'lp-ev-green' }, { label: '14:00', cls: 'lp-ev-blue' }] },
                  { day: 'JUE',  evs: [{ label: '11:00', cls: 'lp-ev-purple' }] },
                ].map(({ day, evs }) => (
                  <div key={day} className="lp-week-col">
                    <span className="lp-week-hd">{day}</span>
                    {evs.map((ev, i) => (
                      <div key={i} className={`lp-week-ev ${ev.cls}`}>{ev.label}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature cards */}
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="lp-feat-card lp-reveal"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="lp-feat-icon" style={{ background: f.iconBg }}>{f.icon}</div>
              <div className="lp-feat-title">{f.title}</div>
              <p className="lp-feat-desc">{f.desc}</p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `FeaturesSection.css`**

```css
.lp-features-section {
  padding: 6rem 0;
  background: var(--lp-bg);
  border-top: 1px solid var(--lp-border);
  border-bottom: 1px solid var(--lp-border);
}

.lp-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.lp-feat-card {
  background: #fff;
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-card);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  box-shadow: var(--lp-shadow-sm);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s;
}
.lp-feat-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--lp-shadow-md);
  border-color: rgba(0, 107, 255, 0.2);
}

.lp-feat-card--gcal {
  grid-column: span 3;
  flex-direction: row;
  align-items: center;
  gap: 2.5rem;
  background: linear-gradient(135deg, rgba(0,107,255,0.03), rgba(217,70,239,0.03));
  border-color: rgba(0, 107, 255, 0.2);
}
.lp-feat-gcal-content { flex: 1; }
.lp-feat-gcal-visual {
  flex-shrink: 0;
  background: var(--lp-bg-alt);
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-compact);
  padding: 1rem;
  width: 200px;
}
.lp-feat-gcal-visual-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--lp-text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.lp-gcal-mini-week {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.lp-feat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.lp-feat-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--lp-navy);
  margin: 0;
}
.lp-feat-desc {
  font-size: 0.875rem;
  color: var(--lp-text-2);
  line-height: 1.65;
  margin: 0;
}

.lp-gcal-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.lp-gcal-flow-node {
  background: var(--lp-bg-alt);
  border: 1px solid var(--lp-border);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--lp-text);
  display: flex;
  align-items: center;
  gap: 6px;
}
.lp-gcal-flow-arrow { color: var(--lp-text-muted); font-size: 1rem; }

@media (max-width: 1024px) {
  .lp-features-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-feat-card--gcal { grid-column: span 2; flex-direction: column; }
  .lp-feat-gcal-visual { width: 100%; }
}
@media (max-width: 768px) {
  .lp-features-section { padding: 4rem 0; }
  .lp-features-grid { grid-template-columns: 1fr; }
  .lp-feat-card--gcal { grid-column: span 1; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/landing-page/FeaturesSection.jsx src/features/landing-page/FeaturesSection.css
git commit -m "feat: add FeaturesSection with feature grid and GCal banner"
```

---

## Task 5: DiffSection

**Files:**
- Create: `src/features/landing-page/DiffSection.jsx`
- Create: `src/features/landing-page/DiffSection.css`

- [ ] **Step 1: Crear `DiffSection.jsx`**

```jsx
import { DIFF_ITEMS, DEMO_STATS, DEMO_BARS } from './data';
import { CheckIcon } from './icons';
import './DiffSection.css';

export default function DiffSection() {
  return (
    <section id="como-funciona" className="lp-diff-section">
      <div className="lp-container lp-diff-inner">

        <div className="lp-diff-text lp-reveal">
          <div className="lp-section-tag">Por qué elegirnos</div>
          <h2 className="lp-section-h2">
            No es solo software.<br />
            <span className="lp-gradient-text">Es tu socio operativo.</span>
          </h2>
          <p className="lp-section-sub" style={{ marginBottom: '1.5rem' }}>
            Novagendas se adapta a tu modelo de negocio, no al revés. Cada clínica, spa o consultorio
            tiene su propio subdominio, sus propios datos y su propia configuración.
          </p>
          <ul className="lp-diff-list">
            {DIFF_ITEMS.map((item, i) => (
              <li key={i} className="lp-diff-item">
                <div className="lp-diff-check"><CheckIcon /></div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-demo-card lp-reveal lp-stagger-2">
          <div className="lp-demo-header">
            <div className="lp-demo-avatar">TN</div>
            <div>
              <div className="lp-demo-name">Tu Negocio</div>
              <div className="lp-demo-url">tunegocio.novagendas.com</div>
            </div>
            <div className="lp-demo-badge">Activo</div>
          </div>

          <div className="lp-demo-stats">
            {DEMO_STATS.map(({ val, label }) => (
              <div key={label} className="lp-demo-stat">
                <div className="lp-demo-stat-val">{val}</div>
                <div className="lp-demo-stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="lp-demo-bars">
            <div className="lp-demo-bars-title">Servicios más solicitados</div>
            {DEMO_BARS.map(([name, pct]) => (
              <div key={name} className="lp-demo-bar-row">
                <span className="lp-demo-bar-name">{name}</span>
                <div className="lp-demo-bar-track">
                  <div className="lp-demo-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="lp-demo-bar-pct">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `DiffSection.css`**

```css
.lp-diff-section {
  background: var(--lp-bg-alt);
  padding: 7rem 0;
  border-top: 1px solid var(--lp-border);
  border-bottom: 1px solid var(--lp-border);
}
.lp-diff-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}
.lp-diff-text {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.lp-diff-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.lp-diff-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--lp-text);
}
.lp-diff-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(20, 170, 81, 0.1);
  border: 1px solid rgba(20, 170, 81, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Demo card */
.lp-demo-card {
  background: #fff;
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-card);
  padding: 2rem;
  box-shadow: var(--lp-shadow-md);
  transition: transform 0.3s ease;
}
.lp-demo-card:hover { transform: translateY(-6px); }

.lp-demo-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.lp-demo-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--lp-blue), #4299e1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
}
.lp-demo-name { font-size: 0.9rem; font-weight: 700; color: var(--lp-navy); }
.lp-demo-url  { font-size: 0.72rem; color: var(--lp-text-muted); font-family: monospace; }
.lp-demo-badge {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(20, 170, 81, 0.1);
  color: var(--lp-success);
  border: 1px solid rgba(20, 170, 81, 0.25);
  border-radius: var(--lp-radius-pill);
  padding: 3px 10px;
}

.lp-demo-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.lp-demo-stat {
  background: var(--lp-bg-alt);
  border: 1px solid var(--lp-border-2);
  border-radius: 10px;
  padding: 0.75rem 0.5rem;
  text-align: center;
}
.lp-demo-stat-val   { font-size: 1.5rem; font-weight: 900; color: var(--lp-navy); line-height: 1; }
.lp-demo-stat-label { font-size: 0.62rem; color: var(--lp-text-muted); font-weight: 600; margin-top: 2px; }

.lp-demo-bars { display: flex; flex-direction: column; gap: 8px; }
.lp-demo-bars-title {
  font-size: 0.68rem;
  color: var(--lp-text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.lp-demo-bar-row { display: flex; align-items: center; gap: 8px; }
.lp-demo-bar-name { font-size: 0.78rem; color: var(--lp-text-2); font-weight: 600; width: 80px; }
.lp-demo-bar-track {
  flex: 1;
  height: 6px;
  background: var(--lp-border-2);
  border-radius: var(--lp-radius-pill);
  overflow: hidden;
}
.lp-demo-bar-fill {
  height: 100%;
  border-radius: var(--lp-radius-pill);
  background: linear-gradient(90deg, var(--lp-blue), #4299e1);
  transition: width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.lp-demo-bar-pct { font-size: 0.68rem; color: var(--lp-text-muted); width: 30px; text-align: right; }

@media (max-width: 1024px) {
  .lp-diff-inner { grid-template-columns: 1fr; gap: 3rem; }
  .lp-diff-section { padding: 5rem 0; }
}
@media (max-width: 768px) {
  .lp-diff-section { padding: 4rem 0; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/landing-page/DiffSection.jsx src/features/landing-page/DiffSection.css
git commit -m "feat: add DiffSection with light background and demo card"
```

---

## Task 6: CTASection + FooterSection

**Files:**
- Create: `src/features/landing-page/CTASection.jsx`
- Create: `src/features/landing-page/CTASection.css`
- Create: `src/features/landing-page/FooterSection.jsx`
- Create: `src/features/landing-page/FooterSection.css`

- [ ] **Step 1: Crear `CTASection.jsx`**

```jsx
import { ArrowRight } from './icons';
import './CTASection.css';

export default function CTASection() {
  return (
    <section id="contacto" className="lp-cta-section">
      <div className="lp-container lp-cta-inner">
        <div className="lp-section-tag lp-reveal">Novagendas</div>
        <h2 className="lp-cta-h2 lp-reveal lp-stagger-1">
          ¿Listo para modernizar<br />
          <span className="lp-gradient-text">tu gestión?</span>
        </h2>
        <p className="lp-cta-sub lp-reveal lp-stagger-2">
          Únete a negocios que ya optimizan su tiempo con Novagendas.
          Agenda, clientes, pagos e inventario — todo en un solo lugar.
        </p>
        <div className="lp-reveal lp-stagger-3">
          <a href="mailto:sanabria3210@gmail.com" className="lp-btn-primary lp-cta-btn">
            Contactar ventas <ArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `CTASection.css`**

```css
.lp-cta-section {
  padding: 7rem 0;
  background: #fff;
  border-top: 1px solid var(--lp-border);
}
.lp-cta-inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}
.lp-cta-h2 {
  font-family: var(--lp-font);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.05;
  margin: 0;
  color: var(--lp-navy);
}
.lp-cta-sub {
  font-size: 1rem;
  color: var(--lp-text-2);
  line-height: 1.65;
  margin: 0;
  max-width: 480px;
}
.lp-cta-btn {
  font-size: 1.05rem;
  padding: 14px 28px;
  height: 50px;
}

@media (max-width: 768px) {
  .lp-cta-section { padding: 5rem 0; }
  .lp-cta-h2 { font-size: 2rem; }
}
```

- [ ] **Step 3: Crear `FooterSection.jsx`**

```jsx
import './FooterSection.css';

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

export default function FooterSection() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <div className="lp-footer-brand">
          <img src="/logoclaro.jpeg" alt="Novagendas" className="lp-footer-logo" />
          <span className="lp-footer-name">Novagendas</span>
        </div>

        <div className="lp-footer-contact">
          <a href="https://wa.me/573026060889" className="lp-footer-link" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            +57 302 606 0889
          </a>
          <a href="mailto:notificacion@novagendas.com" className="lp-footer-link">
            <EmailIcon />
            notificacion@novagendas.com
          </a>
          <a href="mailto:sanabria3210@gmail.com" className="lp-footer-link">
            <EmailIcon />
            sanabria3210@gmail.com
          </a>
        </div>

        <p className="lp-footer-copy">© {new Date().getFullYear()} Novagendas. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Crear `FooterSection.css`**

```css
.lp-footer {
  background: #fff;
  border-top: 1px solid var(--lp-border);
  padding: 2.5rem 0;
}
.lp-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
}
.lp-footer-brand { display: flex; align-items: center; gap: 0.6rem; }
.lp-footer-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; }
.lp-footer-name { font-size: 0.95rem; font-weight: 800; color: var(--lp-navy); letter-spacing: -0.03em; }

.lp-footer-contact { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.lp-footer-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--lp-text-2);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.lp-footer-link:hover { color: var(--lp-blue); }

.lp-footer-copy { font-size: 0.75rem; color: var(--lp-text-muted); }

@media (max-width: 768px) {
  .lp-footer-inner { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .lp-footer-contact { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/landing-page/CTASection.jsx src/features/landing-page/CTASection.css \
        src/features/landing-page/FooterSection.jsx src/features/landing-page/FooterSection.css
git commit -m "feat: add CTASection and FooterSection"
```

---

## Task 7: index.jsx — Entry Point

**Files:**
- Create: `src/features/landing-page/index.jsx`

- [ ] **Step 1: Crear `index.jsx`**

```jsx
import { useEffect } from 'react';
import './landing.css';
import NavBar from './NavBar';
import HeroSection from './HeroSection';
import SectoresSection from './SectoresSection';
import FeaturesSection from './FeaturesSection';
import DiffSection from './DiffSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('lp-reveal-visible');
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  useReveal();

  return (
    <div style={{ fontFamily: 'var(--lp-font)', background: '#fff', overflowX: 'hidden' }}>
      <NavBar />
      <HeroSection />
      <SectoresSection />
      <FeaturesSection />
      <DiffSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
```

- [ ] **Step 2: Verificar visualmente — landing completa**

```bash
# Dev server debe estar corriendo
# Abrir http://localhost:5173
```

Confirmar en el navegador:
- Nav sticky con sombra al hacer scroll
- Hero con H1, pills, CTAs, bento grid
- Bento tiene parallax sutil al scrollear
- Sección sectores con chips
- Features grid 3-col + card GCal wide
- "Por qué elegirnos" en fondo claro #F8F9FB
- CTA centrado
- Footer con contacto

- [ ] **Step 3: Commit**

```bash
git add src/features/landing-page/index.jsx
git commit -m "feat: add landing-page entry point with all sections assembled"
```

---

## Task 8: Wiring + Cleanup

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/features/landing/LandingPage.jsx`
- Delete: `src/features/landing/LandingPage.css`

- [ ] **Step 1: Actualizar import en `App.jsx`**

En `src/App.jsx`, línea 25, cambiar:

```jsx
// ANTES
import LandingPage from './features/landing/LandingPage';

// DESPUÉS
import LandingPage from './features/landing-page/index';
```

- [ ] **Step 2: Verificar que la app sigue funcionando**

```bash
# http://localhost:5173 debe mostrar la nueva landing
# Navegar a una ruta con tenant (si aplica) para confirmar que el resto del app no se rompe
```

- [ ] **Step 3: Eliminar archivos obsoletos**

```bash
rm src/features/landing/LandingPage.jsx
rm src/features/landing/LandingPage.css
```

Si `src/features/landing/` queda vacía, eliminar la carpeta:
```bash
rmdir src/features/landing/
```

- [ ] **Step 4: Build de producción — confirmar sin errores**

```bash
npm run build
```
Esperado: `dist/` generado sin errores ni warnings de imports faltantes.

- [ ] **Step 5: Commit final**

```bash
git add src/App.jsx
git rm src/features/landing/LandingPage.jsx src/features/landing/LandingPage.css
git commit -m "feat: wire new landing-page and remove old landing module"
```

---

## Verificación Final

Después del Task 8, confirmar en http://localhost:5173:

- [ ] Nav sticky — sombra aparece al scrollear, hamburger en < 768px
- [ ] Hero H1 visible, pills, badge GCal, dos CTAs
- [ ] Bento grid en desktop con parallax sutil
- [ ] Reveal animations — elementos aparecen al entrar al viewport
- [ ] Hover en cards de features — sube 6px, sombra md
- [ ] Sección "Por qué elegirnos" — fondo gris claro, NO oscuro
- [ ] Demo card hover — sube 6px
- [ ] CTA final — botón azul con shimmer en hover
- [ ] Footer — links de contacto funcionales
- [ ] Mobile (< 768px) — bento oculto, nav hamburger funcional, todo single-column
- [ ] `npm run build` — sin errores
