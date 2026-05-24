# Landing Page Redesign — Design Spec
Date: 2026-05-23

## Decisiones de diseño

| Decisión | Elección |
|---|---|
| Dirección visual | Clean Light — blanco, navy #0B3558, azul #006BFF |
| Estructura | Misma que la actual (sin secciones nuevas) |
| Sección "Por qué elegirnos" | Fondo claro #F8F9FB (sin gradiente oscuro) |
| Animaciones | Moderado — fade-in, stagger, hover states, parallax sutil en hero |
| Dark mode toggle | Eliminado de la landing |
| Arquitectura | Componentes separados por sección |

## Design System (landing.md)

```css
--color-navy:           #0B3558   /* headings, nav */
--color-blue:           #006BFF   /* CTAs primarios */
--color-blue-dark:      #004EBA   /* hover CTAs */
--color-bg:             #FFFFFF
--color-bg-alt:         #F8F9FB
--color-bg-warm:        #FCFBF8
--color-text:           #0A0A0A
--color-text-secondary: #476788
--color-border:         #D4E0ED
--color-success:        #14AA51
--shadow-sm: rgba(71,103,136,0.04) 0px 4px 5px, rgba(71,103,136,0.03) 0px 8px 15px, rgba(71,103,136,0.06) 0px 15px 30px
--shadow-md: rgba(71,103,136,0.04) 0px 4px 5px, rgba(71,103,136,0.03) 0px 8px 15px, rgba(71,103,136,0.08) 0px 30px 50px
--radius-card: 24px
--radius-btn:   8px
--radius-pill: 50px
```

Tipografía: Gilroy (con fallback system-ui). H1 68px/700, H2 28px/600, body 16px/400.

## Estructura de carpetas

```
src/features/landing-page/
  index.jsx               ← entry point + useReveal hook
  data.js                 ← constantes (FEATURES, SECTORES, DIFF_ITEMS, etc.)
  landing.css             ← design tokens + animaciones + utilidades globales
  NavBar.jsx + NavBar.css
  HeroSection.jsx + HeroSection.css
  SectoresSection.jsx + SectoresSection.css
  FeaturesSection.jsx + FeaturesSection.css
  DiffSection.jsx + DiffSection.css
  CTASection.jsx + CTASection.css
  FooterSection.jsx + FooterSection.css
```

## Secciones

### NavBar
- Sticky, height 64px, fondo blanco con sombra sutil al hacer scroll
- Logo + nombre + links + botón CTA "Contactar" (azul #006BFF)
- Mobile: hamburger menu, sin ThemeToggle
- Sin ThemeToggle en ningún viewport

### HeroSection
- Layout split: texto izquierda, bento grid derecha
- H1 grande (~68px desktop), badge pill arriba, subtítulo, badge GCal, CTAs
- Bento: cards con shadow-sm, border #D4E0ED, border-radius 24px
- Fondo: blanco con dos orbes radiales muy sutiles (primary 8% opacity, sin blur exagerado)
- Parallax: el bento se mueve ~20px en Y al hacer scroll (muy sutil, requestAnimationFrame)

### SectoresSection
- Fondo #F8F9FB, chips con border #D4E0ED
- Sin cambios estructurales, solo actualizar colores

### FeaturesSection
- Grid 3 columnas, cards blancas con shadow-sm
- Íconos con fondos de color suave (mantener paleta actual)
- Card GCal wide (span 3) con fondo tint azul muy sutil
- Hover: translateY(-6px) + shadow-md + border-color #006BFF/20

### DiffSection (Por qué elegirnos)
- Fondo #F8F9FB (ya no oscuro)
- Texto navy #0B3558, subtítulo #476788
- Demo card: fondo blanco, shadow-md, border #D4E0ED
- Checkmarks: verde #14AA51

### CTASection
- Fondo blanco, centrado, H2 navy grande
- Botón primario azul #006BFF

### FooterSection
- Fondo blanco, border-top #D4E0ED
- Links de contacto en #476788, hover #006BFF

## Animaciones (moderado)

```css
/* reveal base */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal-visible { opacity: 1; transform: translateY(0); }
.stagger-1 { transition-delay: 0.05s; }
.stagger-2 { transition-delay: 0.13s; }
.stagger-3 { transition-delay: 0.22s; }
.stagger-4 { transition-delay: 0.32s; }
.stagger-5 { transition-delay: 0.42s; }
```

- Parallax hero bento: `transform: translateY(scrollY * 0.08)` via `useEffect` + `requestAnimationFrame`
- Hover cards: `transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)`
- Botones: shimmer sweep `::after` en hover (ya implementado, mantener)
- Nav: `box-shadow` aparece al hacer scroll (threshold 10px)

## Routing / integración

- `App.jsx` actualmente renderiza `<LandingPage />`. Cambiar import a `landing-page/index.jsx`
- La carpeta `src/features/landing/` queda obsoleta — eliminar tras verificar que no hay otras referencias
- No hay cambios en Supabase, rutas, auth ni otros módulos

## Fuente de verdad

- Design system: `landing.md` (en raíz del proyecto)
- Tareas originales: `tasks.md`
