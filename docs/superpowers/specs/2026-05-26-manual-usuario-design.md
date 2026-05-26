# Spec: Manual de Usuario — Novagendas

**Fecha:** 2026-05-26  
**Estado:** Aprobado

---

## Resumen

Integrar la documentación oficial de Novagendas como un manual de usuario interactivo dentro de la app, accesible desde un botón `?` flotante. El manual es privado (requiere autenticación), filtra secciones por rol del usuario y tiene buscador en tiempo real. La documentación técnica de arquitectura se integra como tab en el SuperAdminPortal.

---

## Arquitectura

### Archivos nuevos

```
src/features/manual/
  Manual.jsx          — componente principal con layout de dos paneles
  manualContent.js    — contenido estructurado como objetos JS con id, título, contenido JSX, roles permitidos
  Manual.css          — estilos usando variables CSS del design system de Novagendas
```

### Integración en router

- `App.jsx`: agregar `case 'manual': return <Manual user={user} tenant={tenant} />;` al `renderRoute()`
- El `currentRoute` se persiste en `localStorage` como ya lo hace el resto de rutas

### Botón `?` (HelpMenu)

El botón existente `tour-help-btn` en `App.jsx` se refactoriza a un componente `HelpMenu`:

- **Visible para todos los roles** (actualmente solo admin)
- Click abre un mini-menú con dos opciones:
  - `📖 Ver manual` → `setCurrentRoute('manual')`
  - `🎯 Ver tutorial` → `setShowTour(true)` (solo visible si `user.role === 'admin'`)
- El mini-menú se cierra al hacer click fuera (listener en `document`)

---

## Componente Manual

### Layout

Dos paneles dentro del área de contenido principal (dentro de `<Layout>`):

```
┌──────────────────────────────────────────────────────┐
│  Manual de Usuario          [🔍 Buscar en el manual] │
├──────────────┬───────────────────────────────────────┤
│  Sidebar     │  Área de contenido                     │
│  (240px)     │  (flex: 1)                             │
│              │                                        │
│  Secciones   │  <h2> Título sección                   │
│  filtradas   │  <p>  Contenido renderizado            │
│  por rol     │  con subtítulos, listas, tablas        │
│              │  y cards de tip/nota/warning           │
└──────────────┴───────────────────────────────────────┘
```

En mobile (< 768px): el sidebar se colapsa en un selector dropdown horizontal.

### Secciones y filtrado por rol

Cada sección en `manualContent.js` tiene un campo `roles: ['admin', 'recepcion', 'especialista']` que determina si es visible.

| ID sección | Roles que la ven |
|---|---|
| `intro` — Primeros pasos | todos |
| `agenda` — Agenda y citas | todos |
| `clients` — Clientes | todos |
| `services` — Servicios | admin, recepcion |
| `payments` — Pagos | admin |
| `inventory` — Inventario | admin, recepcion |
| `estadisticas` — Estadísticas | admin |
| `users` — Gestión de equipo | admin |
| `google-calendar` — Google Calendar | admin |
| `bot` — Bot WhatsApp | admin |
| `feriados` — Días bloqueados | admin |
| `account` — Mi cuenta | todos |

### Buscador

- Input en la cabecera del manual
- Filtra en tiempo real sobre `title` y `searchText` (versión plana sin JSX) de cada sección visible al rol
- Resalta el término buscado en el sidebar con fondo `--primary-light`
- Si no hay resultados: mensaje "No se encontraron secciones para «término»"
- Sin dependencias externas — `String.toLowerCase().includes()`

### Contenido

El contenido de cada sección se renderiza como JSX directamente en `manualContent.js`. Se mantienen los conceptos de la documentación original (steps, tips, warnings, tablas) usando componentes simples propios:

- `<ManualNote>` — recuadro azul informativo
- `<ManualWarning>` — recuadro ámbar de advertencia  
- `<ManualTip>` — recuadro verde de consejo
- `<ManualStep>` — paso numerado con indicador visual
- Tablas estándar HTML con estilos del design system

### Estilos

Usa exclusivamente las CSS custom properties del design system:
- Fondo: `--surface`, `--bg-subtle`
- Sidebar activo: `--primary`, `--primary-light`
- Tipografía: `--font-main`, jerarquía `--text`, `--text-2`, `--text-3`
- Bordes: `--border`, `--border-light`
- Sombras: `--shadow-sm`, `--shadow-md`
- Sin librerías UI externas

---

## Documentación Técnica — SuperAdminPortal

- Agregar pestaña `{ id: 'arquitectura', label: 'Arquitectura', icon: '🏗️' }` al array `TABS` en `SuperAdminPortal.jsx`
- Renderizar el contenido de `technical/architecture.mdx` como JSX estructurado en un componente `ArchitectureTab`
- Incluye: tablas de resumen, bloques de pseudocódigo, listado de módulos, riesgos y buenas prácticas
- Los diagramas Mermaid se representan como bloques de código formateado (sin librería de diagramas)
- Acceso: solo desde `superadmin.novagendas.com` — el portal ya hace bypass del login de tenant

---

## Archivos a eliminar de `documentacion oficial/`

| Archivo | Motivo |
|---|---|
| `README.md` | README genérico del repo Mintlify |
| `CONTRIBUTING.md` | Guía de contribución externa |
| `AGENTS.md` | Config de agentes AI del repo de docs |
| `LICENSE` | Licencia del repo de documentación |
| `.atlas-analysis.json` | Análisis interno de Mintlify/Atlas |
| `.mintignore` | Config de build de Mintlify |
| `docs.json` | Config de navegación de Mintlify |

Los archivos `.mdx` permanecen como fuente de verdad del contenido.

---

## Flujo de datos

```
user.role → filtraSecciones(manualContent, role) → seccionesVisibles
searchQuery → filtraSecciones por texto → seccionesHighlight
seccionActiva → renderContenido(sección) → JSX
```

---

## Consideraciones

- No se agrega `'manual'` al `localStorage` de `novagendas_route` (inicio siempre en dashboard tras login)
- El buscador no persiste entre navegaciones
- El manual no tiene scroll infinito — cada sección es una página completa
- Los especialistas no ven el botón del tour (ya existe esta restricción), pero sí ven el manual
