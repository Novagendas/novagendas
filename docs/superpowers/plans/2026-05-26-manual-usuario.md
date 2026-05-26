# Manual de Usuario — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un manual de usuario privado dentro del app, accesible vía botón `?` flotante, con contenido filtrado por rol, buscador en tiempo real, y tab de arquitectura técnica en el SuperAdminPortal.

**Architecture:** El manual se integra como ruta de estado `'manual'` en el router de `App.jsx`. El contenido es JSX estructurado en `manualContent.jsxx` (extensión .jsx requerida — Vite solo transpila JSX en .jsx/.tsx). El botón `?` se refactoriza a un `HelpMenu` que ofrece "Ver manual" y "Ver tutorial". La documentación técnica se añade como tab en el `SuperAdminPortal` existente.

**Tech Stack:** React 19, Vitest + React Testing Library, CSS custom properties de Novagendas, sin dependencias externas nuevas.

---

## File Map

| Acción | Archivo | Responsabilidad |
|---|---|---|
| Crear | `src/features/manual/ManualComponents.jsx` | Componentes helper: ManualNote, ManualTip, ManualWarning, ManualStep, ManualSteps |
| Crear | `src/features/manual/Manual.css` | Estilos del manual usando CSS variables del design system |
| Crear | `src/features/manual/manualContent.jsxx` | Todas las secciones del manual como objetos JS con JSX (extensión .jsx por uso de JSX) |
| Crear | `src/features/manual/Manual.jsx` | Layout del manual, sidebar, búsqueda, render de sección |
| Crear | `src/features/manual/Manual.test.jsx` | Tests de filterSectionsByRole y searchSections |
| Modificar | `src/App.jsx` | Agregar HelpMenu + case 'manual' en renderRoute |
| Modificar | `src/features/superadmin/SuperAdminPortal.jsx` | Agregar tab 'arquitectura' y componente ArchitectureTab |
| Eliminar | 7 archivos de `documentacion oficial/` | Ver Task 1 |

---

### Task 1: Eliminar archivos de infraestructura Mintlify

**Files:**
- Delete: `documentacion oficial/README.md`
- Delete: `documentacion oficial/CONTRIBUTING.md`
- Delete: `documentacion oficial/AGENTS.md`
- Delete: `documentacion oficial/LICENSE`
- Delete: `documentacion oficial/.atlas-analysis.json`
- Delete: `documentacion oficial/.mintignore`
- Delete: `documentacion oficial/docs.json`

- [ ] **Step 1: Eliminar los 7 archivos de infraestructura Mintlify**

```bash
cd "/Users/danielsanabria/Desktop/novaGendas/novagendas"
rm "documentacion oficial/README.md" \
   "documentacion oficial/CONTRIBUTING.md" \
   "documentacion oficial/AGENTS.md" \
   "documentacion oficial/LICENSE" \
   "documentacion oficial/.atlas-analysis.json" \
   "documentacion oficial/.mintignore" \
   "documentacion oficial/docs.json"
```

- [ ] **Step 2: Verificar que solo queden los archivos de contenido**

```bash
find "documentacion oficial" -type f | sort
```

Expected output (solo .mdx):
```
documentacion oficial/account/login.mdx
documentacion oficial/account/password-reset.mdx
documentacion oficial/account/profile.mdx
documentacion oficial/admin/audit-logs.mdx
documentacion oficial/admin/holidays.mdx
documentacion oficial/admin/locations.mdx
documentacion oficial/admin/team-management.mdx
documentacion oficial/features/agenda.mdx
documentacion oficial/features/clients.mdx
documentacion oficial/features/inventory.mdx
documentacion oficial/features/payments.mdx
documentacion oficial/features/services.mdx
documentacion oficial/features/statistics.mdx
documentacion oficial/index.mdx
documentacion oficial/integrations/google-calendar.mdx
documentacion oficial/integrations/whatsapp-bot.mdx
documentacion oficial/introduction.mdx
documentacion oficial/quickstart.mdx
documentacion oficial/roles-and-permissions.mdx
documentacion oficial/technical/architecture.mdx
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "chore: eliminar archivos de infraestructura Mintlify de documentacion oficial"
```

---

### Task 2: Crear ManualComponents helpers

**Files:**
- Create: `src/features/manual/ManualComponents.jsx`

- [ ] **Step 1: Crear el archivo con los componentes helper**

```jsx
// src/features/manual/ManualComponents.jsx

export function ManualNote({ children }) {
  return (
    <div style={{
      background: 'var(--primary-light)',
      border: '1px solid rgba(var(--primary-rgb), 0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: 'var(--text-2)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
      <span>{children}</span>
    </div>
  );
}

export function ManualTip({ children }) {
  return (
    <div style={{
      background: 'var(--success-light)',
      border: '1px solid rgba(var(--success-rgb), 0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: 'var(--text-2)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
      <span>{children}</span>
    </div>
  );
}

export function ManualWarning({ children }) {
  return (
    <div style={{
      background: 'var(--warning-light)',
      border: '1px solid rgba(var(--warning-rgb), 0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: 'var(--text-2)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
      <span>{children}</span>
    </div>
  );
}

export function ManualStep({ number, title, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 2,
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        {title && <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>{title}</p>}
        <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

export function ManualSteps({ children }) {
  return (
    <div style={{ margin: '1rem 0 1.5rem' }}>
      {children}
    </div>
  );
}

export function ManualTable({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '0.5rem 0.75rem',
                borderBottom: '2px solid var(--border-strong)',
                color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-2)', verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/manual/ManualComponents.jsx
git commit -m "feat: agregar componentes helper para manual de usuario"
```

---

### Task 3: Crear Manual.css

**Files:**
- Create: `src/features/manual/Manual.css`

- [ ] **Step 1: Crear el archivo de estilos**

```css
/* src/features/manual/Manual.css */

.manual-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
}

/* ── Header ── */
.manual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.manual-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.02em;
}

.manual-search-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 0.375rem 0.875rem;
  min-width: 220px;
  transition: border-color 0.15s;
}

.manual-search-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.manual-search-icon {
  font-size: 0.875rem;
  opacity: 0.6;
  flex-shrink: 0;
}

.manual-search {
  border: none;
  background: none;
  outline: none;
  font-size: 0.875rem;
  color: var(--text);
  font-family: var(--font-main);
  width: 100%;
}

.manual-search::placeholder {
  color: var(--text-5);
}

.manual-search-clear {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-4);
  font-size: 0.75rem;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.manual-search-clear:hover {
  color: var(--danger);
}

/* ── Body ── */
.manual-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ── */
.manual-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 1rem 0;
}

.manual-nav-list {
  list-style: none;
  margin: 0;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.manual-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
  font-size: 0.875rem;
  color: var(--text-3);
  font-family: var(--font-main);
  transition: background 0.12s, color 0.12s;
}

.manual-nav-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.manual-nav-btn.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.manual-nav-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.manual-no-results {
  font-size: 0.8rem;
  color: var(--text-4);
  padding: 1rem;
  text-align: center;
  line-height: 1.5;
}

/* ── Content ── */
.manual-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  max-width: 800px;
}

.manual-section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.25rem;
  letter-spacing: -0.02em;
}

.manual-section-divider {
  height: 3px;
  width: 48px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: var(--radius-full);
  margin-bottom: 1.5rem;
}

.manual-section-body {
  color: var(--text-2);
  line-height: 1.7;
  font-size: 0.9375rem;
}

.manual-section-body h3 {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text);
  margin: 1.75rem 0 0.5rem;
}

.manual-section-body h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-2);
  margin: 1.25rem 0 0.375rem;
}

.manual-section-body p {
  margin: 0 0 0.875rem;
}

.manual-section-body ul,
.manual-section-body ol {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

.manual-section-body li {
  margin-bottom: 0.25rem;
}

.manual-section-body strong {
  color: var(--text);
  font-weight: 600;
}

.manual-section-body code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0.125rem 0.375rem;
  color: var(--accent);
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .manual-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
    overflow-y: visible;
    padding: 0.5rem;
  }

  .manual-body {
    flex-direction: column;
  }

  .manual-nav-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
  }

  .manual-nav-btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }

  .manual-content {
    padding: 1.25rem;
  }
}

/* ── Help Menu (botón ?) ── */
.help-menu-wrapper {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
}

.help-menu-popup {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  min-width: 180px;
  overflow: hidden;
  animation: fadeInUp 0.15s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.help-menu-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text);
  font-size: 0.875rem;
  font-family: var(--font-main);
  text-align: left;
  transition: background 0.1s;
}

.help-menu-item:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.help-menu-item + .help-menu-item {
  border-top: 1px solid var(--border-light);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/manual/Manual.css
git commit -m "feat: estilos del manual de usuario con design system de Novagendas"
```

---

### Task 4: Crear manualContent.jsx con todo el contenido

**Files:**
- Create: `src/features/manual/manualContent.jsx`

- [ ] **Step 1: Crear el archivo con todas las secciones**

```js
// src/features/manual/manualContent.jsx
import React from 'react';
import { ManualNote, ManualTip, ManualWarning, ManualStep, ManualSteps, ManualTable } from './ManualComponents';

export const MANUAL_SECTIONS = [
  /* ─── PRIMEROS PASOS ─────────────────────────────────── */
  {
    id: 'intro',
    label: 'Primeros pasos',
    icon: '🚀',
    roles: ['admin', 'recepcion', 'especialista'],
    searchText: 'primeros pasos inicio sesion login subdominio configuracion bienvenida',
    content: (
      <div>
        <p>Comenzar con Novagendas toma solo unos minutos. Esta guía te lleva desde el acceso a tu espacio de trabajo hasta agendar tu primera cita.</p>

        <h3>Acceder a tu espacio de trabajo</h3>
        <p>Cada negocio en Novagendas tiene su propia dirección web única. Escríbela en cualquier navegador:</p>
        <p><code>tunegocio.novagendas.com</code></p>
        <ManualTip>Guarda tu subdominio en favoritos para que tu equipo no tenga que recordarlo. Cada miembro del personal usa la misma URL.</ManualTip>

        <h3>Iniciar sesión</h3>
        <ManualSteps>
          <ManualStep number={1} title="Ingresa tus credenciales">Escribe el correo electrónico y contraseña que tu administrador configuró para ti y haz clic en <strong>Iniciar Sesión</strong>.</ManualStep>
          <ManualStep number={2} title="Navega según tu rol">Tu rol determina a dónde te lleva Novagendas después de iniciar sesión.</ManualStep>
        </ManualSteps>

        <ManualTable
          headers={['Rol', 'Lo que ves primero']}
          rows={[
            ['Administrador', 'Panel con estadísticas del día y checklist de configuración'],
            ['Recepcionista', 'Panel con las citas del día'],
            ['Especialista', 'Calendario de la agenda, filtrado a tus propias citas'],
          ]}
        />
        <ManualNote>Tu sesión dura 24 horas. Después de ese tiempo, se te pedirá que inicies sesión nuevamente.</ManualNote>

        <h3>Configuración inicial (solo Administrador)</h3>
        <p>Si eres Administrador, el Panel muestra un checklist de <strong>Configuración del Sistema</strong> después de tu primer inicio de sesión. El paso obligatorio antes de agendar citas es:</p>
        <p><strong>Agrega al menos una categoría de servicio y un servicio.</strong> Ve a <strong>Servicios</strong>, crea una categoría (p.ej. "Tratamientos Faciales"), luego agrega un servicio con nombre, duración y precio.</p>
        <p>También se recomienda:</p>
        <ul>
          <li>Agregar miembros del equipo en <strong>Usuarios</strong></li>
          <li>Registrar clientes existentes en <strong>Clientes</strong></li>
          <li>Configurar días bloqueados en <strong>Días Bloqueados</strong></li>
          <li>Agregar productos al <strong>Inventario</strong></li>
        </ul>

        <h3>Agendar tu primera cita</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre la Agenda">Haz clic en <strong>Agenda de Citas</strong> en el menú lateral.</ManualStep>
          <ManualStep number={2} title="Haz clic en un espacio libre">El formulario se abre con la fecha y hora en que hiciste clic.</ManualStep>
          <ManualStep number={3} title="Completa el formulario">Busca o crea un cliente, selecciona servicios, asigna un especialista y confirma la hora.</ManualStep>
          <ManualStep number={4} title="Guarda">Haz clic en <strong>Agendar Cita</strong>. La cita aparece en el calendario de inmediato.</ManualStep>
        </ManualSteps>
      </div>
    ),
  },

  /* ─── AGENDA ─────────────────────────────────────────── */
  {
    id: 'agenda',
    label: 'Agenda y citas',
    icon: '📅',
    roles: ['admin', 'recepcion', 'especialista'],
    searchText: 'agenda citas calendario crear reprogramar drag drop arrastrar estados confirmada espera cancelada completada conflicto',
    content: (
      <div>
        <p>La agenda es el corazón de Novagendas. Ofrece un calendario en vivo donde puedes reservar citas, seguir su progreso y ver el horario de cada especialista de un vistazo.</p>

        <h3>Vistas del calendario</h3>
        <p>Cambia entre vistas usando los botones <strong>Día</strong>, <strong>Semana</strong> y <strong>Mes</strong> en la barra de herramientas.</p>
        <ul>
          <li><strong>Día</strong> — línea de tiempo vertical desde las 6 AM hasta las 9 PM. Hasta 5 citas superpuestas se muestran lado a lado.</li>
          <li><strong>Semana</strong> — los 7 días en columnas paralelas. Los días pasados aparecen atenuados; las fechas bloqueadas muestran 🚫.</li>
          <li><strong>Mes</strong> — cuadrícula mensual con conteo de citas por día. Ideal para identificar días de alta demanda.</li>
        </ul>

        <h3>Crear una cita</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario">Haz clic en cualquier espacio libre en el calendario, o usa <strong>+ Nueva Cita</strong> en la barra de herramientas.</ManualStep>
          <ManualStep number={2} title="Selecciona el cliente">Escribe el nombre o número de documento. El selector busca mientras escribes.</ManualStep>
          <ManualStep number={3} title="Elige servicios">Selecciona uno o más procedimientos. Las duraciones se suman automáticamente.</ManualStep>
          <ManualStep number={4} title="Asigna especialista y sede">Elige el especialista; la sede se autoselecciona si solo hay una.</ManualStep>
          <ManualStep number={5} title="Ajusta fecha y hora">El formulario toma por defecto el espacio en que hiciste clic.</ManualStep>
          <ManualStep number={6} title="Guarda">Haz clic en <strong>Agendar Cita</strong>. El sistema verifica conflictos antes de guardar.</ManualStep>
        </ManualSteps>
        <ManualNote>No puedes reservar una cita en el pasado. Los espacios de hace más de una hora están en gris y no son clicables.</ManualNote>

        <h3>Estados de las citas</h3>
        <ManualTable
          headers={['Estado', 'Color del borde', 'Descripción']}
          rows={[
            ['En Espera', 'Ámbar', 'Agendada pero aún no confirmada. Estado predeterminado para citas nuevas.'],
            ['Confirmada', 'Verde', 'La cita ha sido confirmada con el cliente.'],
            ['Completada', 'Azul', 'La sesión ha sido realizada.'],
            ['Cancelada', 'Rojo', 'Oculta del calendario activo, permanece en reportes.'],
          ]}
        />
        <p>Para cambiar el estado, abre la cita haciendo clic en el ícono de lápiz y selecciona el nuevo estado en el menú desplegable.</p>

        <h3>Arrastrar y soltar para reprogramar</h3>
        <p>En vistas de Día y Semana, arrastra cualquier bloque de cita a un nuevo espacio. Novagendas verificará conflictos automáticamente y sincronizará con Google Calendar si está conectado.</p>
        <ManualWarning>No puedes arrastrar una cita a un espacio en el pasado.</ManualWarning>

        <h3>Detección de conflictos</h3>
        <p>Al guardar o arrastrar, el sistema verifica si el especialista ya tiene otra cita activa en el mismo horario. Si existe conflicto, un modal muestra los detalles para que elijas un espacio diferente.</p>

        <h3>Filtrar el calendario</h3>
        <p>Usa el filtro <strong>Especialista</strong> para ver solo las citas de un miembro del equipo. El filtro <strong>Sede</strong> reduce la vista a una sola ubicación. Los Especialistas ven por defecto solo sus propias citas.</p>

        <h3>Productos usados durante una sesión</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el panel de productos">En el formulario de cita, localiza la sección <strong>Productos Utilizados</strong> y busca por nombre.</ManualStep>
          <ManualStep number={2} title="Agrega con cantidad">Ajusta la cantidad y haz clic en <strong>Agregar</strong>.</ManualStep>
          <ManualStep number={3} title="Guarda">Al guardar la cita, el stock se descuenta automáticamente (solo en creación nueva).</ManualStep>
        </ManualSteps>
        <ManualTip>Solo aparecen en la búsqueda los productos con stock mayor a cero.</ManualTip>

        <h3>Cancelar o eliminar una cita</h3>
        <ul>
          <li><strong>Cancelar:</strong> cambia el estado a Cancelada y guarda. Se envía correo de cancelación al cliente.</li>
          <li><strong>Eliminar:</strong> haz clic en el botón Eliminar del formulario. La cita se elimina del calendario pero queda en la base de datos para auditoría.</li>
        </ul>
        <ManualWarning>La eliminación no se puede deshacer desde el calendario.</ManualWarning>
      </div>
    ),
  },

  /* ─── CLIENTES ──────────────────────────────────────── */
  {
    id: 'clients',
    label: 'Clientes',
    icon: '👥',
    roles: ['admin', 'recepcion', 'especialista'],
    searchText: 'clientes pacientes agregar nuevo buscar historial citas notas clinicas evolucion habeas data',
    content: (
      <div>
        <p>El módulo de Clientes es tu directorio de pacientes. Cada cliente tiene una ficha clínica con datos de contacto, historial de citas y notas de evolución clínica en un solo lugar.</p>

        <h3>Agregar un nuevo cliente</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario">Haz clic en <strong>+ Nuevo Paciente</strong> en la parte superior del directorio.</ManualStep>
          <ManualStep number={2} title="Ingresa la información requerida">
            <ManualTable
              headers={['Campo', 'Obligatorio', 'Notas']}
              rows={[
                ['Documento de Identidad', 'Sí', 'Número de cédula o documento'],
                ['Nombre Completo', 'Sí', 'Nombre y apellido'],
                ['Teléfono / WhatsApp', 'Sí', 'Usado para recordatorios'],
                ['Correo Electrónico', 'No', 'Requerido para confirmaciones por correo'],
              ]}
            />
          </ManualStep>
          <ManualStep number={3} title="Acepta el consentimiento Habeas Data">Marca la casilla de consentimiento. Obligatorio según la Ley 1581 colombiana.</ManualStep>
          <ManualStep number={4} title="Guarda">Haz clic en <strong>Aperturar Paciente</strong>.</ManualStep>
        </ManualSteps>
        <ManualNote>Solo Administrador y Recepción pueden registrar nuevos clientes. Los Especialistas pueden ver y agregar notas a sus propios pacientes.</ManualNote>

        <h3>Buscar un cliente</h3>
        <p>Usa la barra de búsqueda en la parte superior del directorio. Filtra por: nombre completo, número de documento, correo electrónico y número de teléfono. Los resultados se actualizan mientras escribes.</p>

        <h3>Ver la ficha clínica</h3>
        <p>Al seleccionar un cliente se abre su ficha con:</p>
        <ul>
          <li><strong>Banner de perfil</strong> — nombre, documento, teléfono y correo</li>
          <li><strong>Próxima Cita</strong> — próxima cita con fecha, hora, servicio y estado</li>
          <li><strong>Evolución</strong> — todas las notas clínicas</li>
          <li><strong>Historial de Citas</strong> — todas las citas pasadas y próximas</li>
        </ul>

        <h3>Agregar una nota clínica (evolución)</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario de evolución">Expande la sección <strong>Evolución</strong> y haz clic en <strong>+ Nueva</strong>.</ManualStep>
          <ManualStep number={2} title="Ingresa el servicio realizado">Escribe el nombre del procedimiento. Aparece autocompletado con términos comunes.</ManualStep>
          <ManualStep number={3} title="Escribe las observaciones">Completa el área de texto con los detalles clínicos de la sesión.</ManualStep>
          <ManualStep number={4} title="Firma y guarda">Haz clic en <strong>Firmar y Registrar</strong>. La nota se guarda con marca de tiempo firmada bajo tu nombre.</ManualStep>
        </ManualSteps>
        <ManualWarning>Las notas clínicas son permanentes una vez guardadas — no hay opción de editar ni eliminar. Escribe con cuidado y agrega una nueva nota si necesitas hacer una corrección.</ManualWarning>
      </div>
    ),
  },

  /* ─── SERVICIOS ─────────────────────────────────────── */
  {
    id: 'services',
    label: 'Servicios',
    icon: '🛍️',
    roles: ['admin', 'recepcion'],
    searchText: 'servicios catalogo categoria crear duracion precio color calendario habilitar deshabilitar',
    content: (
      <div>
        <p>El catálogo de servicios define todos los procedimientos que ofrece tu clínica. La duración de cada servicio controla cuánto espacio ocupa la cita en el calendario.</p>

        <h3>Crear una categoría</h3>
        <p>Los servicios deben pertenecer a una categoría antes de crearlos.</p>
        <ManualSteps>
          <ManualStep number={1} title="Abre el gestor de categorías">Haz clic en <strong>Editar Categorías</strong> en la parte superior derecha de Servicios.</ManualStep>
          <ManualStep number={2} title="Agrega una categoría">Escribe el nombre y haz clic en <strong>Añadir</strong>.</ManualStep>
          <ManualStep number={3} title="Edita o elimina">Usa el ícono de lápiz para renombrar y el de papelera para eliminar. No puedes eliminar categorías con servicios asignados.</ManualStep>
        </ManualSteps>
        <ManualNote>Debes crear al menos una categoría antes de registrar cualquier servicio.</ManualNote>

        <h3>Crear un servicio</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario">Haz clic en <strong>Registrar Servicio</strong>.</ManualStep>
          <ManualStep number={2} title="Nombre">Escribe el nombre del procedimiento. Aparece autocompletado con términos comunes.</ManualStep>
          <ManualStep number={3} title="Categoría">Elige la categoría del menú desplegable.</ManualStep>
          <ManualStep number={4} title="Duración">Usa los campos de horas y minutos. Mínimo 15 minutos.</ManualStep>
          <ManualStep number={5} title="Precio (COP)">Ingresa el precio base. Se usa como predeterminado al registrar pagos.</ManualStep>
          <ManualStep number={6} title="Color del calendario">Elige un color para identificar visualmente este servicio en el calendario.</ManualStep>
          <ManualStep number={7} title="Guarda">Haz clic en <strong>Registrar Servicio</strong>.</ManualStep>
        </ManualSteps>
        <ManualTip>La duración controla cómo aparece el bloque en el calendario. Un servicio de 90 min ocupa 1.5 filas de hora en las vistas de Día y Semana.</ManualTip>

        <h3>Habilitar o deshabilitar un servicio</h3>
        <p>Haz clic en el interruptor <strong>Habilitado / Inhabilitado</strong> en la tarjeta del servicio. Los servicios deshabilitados se ocultan del formulario de citas pero sus datos históricos se conservan.</p>

        <h3>Duración y múltiples servicios</h3>
        <p>Cuando una cita incluye varios servicios, Novagendas suma todas las duraciones para determinar la duración total. El sistema usa la ventana completa para la detección de conflictos.</p>
      </div>
    ),
  },

  /* ─── PAGOS ─────────────────────────────────────────── */
  {
    id: 'payments',
    label: 'Pagos',
    icon: '💳',
    roles: ['admin'],
    searchText: 'pagos abonos depositos registro pago parcial saldo pendiente metodo efectivo tarjeta transferencia ingresos',
    content: (
      <div>
        <p>El módulo de pagos es tu libro mayor financiero. Rastrea pagos completos y depósitos anticipados, con saldos parciales para saber qué clientes tienen montos pendientes.</p>

        <h3>Tipos de transacciones</h3>
        <ul>
          <li><strong>Pagos</strong> — pagos completos o parciales por un servicio prestado. Pueden ser <em>Pagado</em> o <em>Pago Parcial</em> con saldo pendiente rastreado automáticamente.</li>
          <li><strong>Abonos</strong> — prepagos anticipados sin vincularlos aún a una cita específica. El saldo puede aplicarse a cualquier cita futura.</li>
        </ul>

        <h3>Tarjetas de resumen</h3>
        <p>En la parte superior de la página verás: <strong>Ingresos Totales</strong>, <strong>Ingresos de Hoy</strong>, <strong>Transacciones</strong> y <strong>Saldo Pendiente</strong>.</p>

        <h3>Registrar un pago</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario">Haz clic en <strong>Registrar Pago</strong>.</ManualStep>
          <ManualStep number={2} title="Selecciona el cliente">Busca por nombre o número de documento.</ManualStep>
          <ManualStep number={3} title="Elige un servicio (opcional)">Al seleccionar un servicio, el campo de monto se llena con el precio base automáticamente.</ManualStep>
          <ManualStep number={4} title="Método de pago">Elige entre Efectivo 💵, Tarjeta 💳, Transferencia 🏦 o Nequi/Daviplata 📱.</ManualStep>
          <ManualStep number={5} title="Ingresa el monto">Si el monto es menor al precio del servicio, se registra como <strong>Pago Parcial</strong>.</ManualStep>
          <ManualStep number={6} title="Confirma">Haz clic en <strong>Confirmar Pago</strong>. Se envía correo de confirmación al cliente si tiene email registrado.</ManualStep>
        </ManualSteps>

        <h3>Registrar un abono</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario">Haz clic en <strong>Nuevo Abono</strong>.</ManualStep>
          <ManualStep number={2} title="Selecciona cliente e ingresa monto">Elige el cliente e ingresa el monto del depósito en COP.</ManualStep>
          <ManualStep number={3} title="Vincula a servicio (opcional)">Asocia el depósito a un servicio específico si el cliente prepaga un paquete.</ManualStep>
          <ManualStep number={4} title="Guarda">Haz clic en <strong>Registrar Abono</strong>. El saldo queda disponible para aplicar a citas futuras desde la Agenda.</ManualStep>
        </ManualSteps>
        <ManualTip>Para aplicar un abono a una cita, abre la cita en la Agenda, selecciona el cliente y elige el abono en el menú <strong>Abono disponible</strong>.</ManualTip>

        <h3>Completar un pago parcial</h3>
        <p>Cuando un pago tiene saldo pendiente, aparece un botón <strong>Pagar</strong> en la columna de estado. Haz clic para registrar la cuota adicional. Si la cuota cubre el saldo completo, el estado cambia a <strong>Pagado</strong>.</p>

        <h3>Buscar y filtrar</h3>
        <p>Usa la barra de búsqueda para filtrar por nombre de cliente o documento. Activa la píldora <strong>Pendientes</strong> para ver solo pagos con saldo pendiente. Cambia entre <strong>Pagos</strong> y <strong>Abonos</strong> con las pestañas.</p>

        <ManualWarning>Eliminar un pago no se puede deshacer y excluirá la transacción de todos los reportes de ingresos.</ManualWarning>
      </div>
    ),
  },

  /* ─── INVENTARIO ────────────────────────────────────── */
  {
    id: 'inventory',
    label: 'Inventario',
    icon: '📦',
    roles: ['admin', 'recepcion'],
    searchText: 'inventario productos stock insumos alerta minimo critico categoria agregar lote cantidad ajustar',
    content: (
      <div>
        <p>El módulo de inventario te da visibilidad sobre cada insumo que usa tu clínica. Estableces un umbral mínimo de stock por artículo y Novagendas te alerta cuando las cantidades caen por debajo de ese nivel.</p>

        <h3>Agregar una categoría de productos</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre la gestión de categorías">Haz clic en <strong>Categorías</strong> en la parte superior derecha de Inventario.</ManualStep>
          <ManualStep number={2} title="Agrega una categoría">Escribe el nombre y haz clic en <strong>Añadir</strong>.</ManualStep>
          <ManualStep number={3} title="Edita o elimina">El ícono de lápiz renombra; el de papelera elimina (solo si no tiene productos).</ManualStep>
        </ManualSteps>

        <h3>Agregar un producto</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el formulario">Haz clic en <strong>Nuevo Insumo</strong>.</ManualStep>
          <ManualStep number={2} title="Nombre y categoría">Escribe el nombre del producto y elige su categoría.</ManualStep>
          <ManualStep number={3} title="Número de lote (opcional)">Útil para trazabilidad de insumos médicos regulados.</ManualStep>
          <ManualStep number={4} title="Stock inicial y Stock mínimo"><strong>Existencias</strong> — cantidad actual disponible. <strong>Stock Mínimo</strong> — umbral de alerta; cuando la cantidad llega a este número, el producto se marca como crítico.</ManualStep>
          <ManualStep number={5} title="Costo unitario (opcional)">En COP; se usa en Estadísticas para calcular el valor total del inventario.</ManualStep>
          <ManualStep number={6} title="Guarda">Haz clic en <strong>Confirmar Cambios</strong>.</ManualStep>
        </ManualSteps>

        <h3>Indicador de nivel de stock</h3>
        <p>La barra de stock en la tabla cambia de color:</p>
        <ul>
          <li>🟢 <strong>Verde</strong> — stock saludable (por encima del 60% del nivel objetivo)</li>
          <li>🟡 <strong>Ámbar</strong> — stock moderado (entre 0% y 60%)</li>
          <li>🔴 <strong>Rojo</strong> — stock en o por debajo del umbral mínimo (crítico)</li>
        </ul>

        <h3>Alertas de stock bajo</h3>
        <p>Cuando la cantidad cae a o por debajo del <strong>Stock Mínimo</strong>, el producto se marca con alerta crítica visible en: el encabezado de la tabla de inventario, el Panel principal y la pestaña <strong>Estadísticas {'>'} Inventario</strong>.</p>
        <ManualWarning>Un producto con cantidad cero se excluye del selector de productos en el formulario de cita de la Agenda. Repón antes de la próxima sesión.</ManualWarning>

        <h3>Consumo automático por sesión</h3>
        <p>Al registrar productos usados en una cita, Novagendas descuenta el stock automáticamente al crear la cita. El descuento solo ocurre en creación nueva — editar una cita existente no aplica un segundo descuento.</p>

        <h3>Ajustar stock manualmente</h3>
        <p>Usa los botones <strong>+</strong> y <strong>−</strong> en la columna de Acciones de la tabla. Para ajustes mayores, abre el formulario de edición del producto y cambia el campo <strong>Existencias</strong>.</p>
      </div>
    ),
  },

  /* ─── ESTADÍSTICAS ──────────────────────────────────── */
  {
    id: 'estadisticas',
    label: 'Estadísticas',
    icon: '📊',
    roles: ['admin'],
    searchText: 'estadisticas reportes ingresos kpi citas pacientes servicios pagos inventario exportar excel graficos',
    content: (
      <div>
        <p>El módulo de Estadísticas ofrece siete pestañas de informes que cubren el desempeño completo de tu clínica. Cada conjunto de datos puede exportarse a Excel.</p>
        <ManualNote>Estadísticas está disponible solo para usuarios con rol de <strong>Administrador</strong>.</ManualNote>

        <h3>Pestañas disponibles</h3>
        <ManualTable
          headers={['Pestaña', 'KPI principal']}
          rows={[
            ['General', 'Citas del mes, ingresos, tasa de cancelación vs. mes anterior'],
            ['Citas', 'Volumen por día y hora, top 5 especialistas'],
            ['Pacientes', 'Nuevos, activos, en riesgo (+60 días sin cita)'],
            ['Servicios', 'Más solicitados, ingresos por servicio'],
            ['Pagos & Abonos', 'Ingresos diarios, depósitos activos, métodos de pago'],
            ['Inventario', 'Stock crítico, valor total del inventario'],
            ['Usuarios (Equipo)', 'Distribución por rol, actividad del equipo'],
          ]}
        />

        <h3>KPIs principales — General</h3>
        <ul>
          <li><strong>Citas este mes</strong> — total del mes actual con cambio % vs. mes anterior</li>
          <li><strong>Ingresos este mes</strong> — total de pagos recaudados comparado con el mes pasado</li>
          <li><strong>Pacientes activos (90d)</strong> — pacientes con al menos una cita en los últimos 90 días</li>
          <li><strong>Tasa de cancelación</strong> — porcentaje de citas canceladas este mes</li>
        </ul>

        <h3>Filtrar por rango de fechas</h3>
        <p>La pestaña de <strong>Citas</strong> admite un filtro de rango personalizado con entradas <strong>Desde</strong> y <strong>Hasta</strong>. Haz clic en <strong>Este mes</strong> para restablecer al mes actual. Las demás pestañas usan períodos fijos.</p>

        <h3>Exportar a Excel</h3>
        <p>Cada tabla principal tiene un botón <strong>Exportar</strong> que descarga los datos como archivo .xlsx. Las exportaciones disponibles cubren citas, clientes, servicios, pagos, abonos, inventario y usuarios del equipo.</p>
        <ManualTip>Las exportaciones se registran en el historial de auditoría del sistema.</ManualTip>
      </div>
    ),
  },

  /* ─── GESTIÓN DE EQUIPO ─────────────────────────────── */
  {
    id: 'users',
    label: 'Gestión de equipo',
    icon: '👤',
    roles: ['admin'],
    searchText: 'usuarios equipo agregar miembro rol administrador recepcionista especialista permisos modulos password contraseña desactivar',
    content: (
      <div>
        <p>La sección de <strong>Usuarios</strong> te permite construir y gestionar a cada persona que trabaja en tu negocio. Solo los Administradores pueden acceder a esta sección.</p>
        <ManualNote>Cada cuenta de negocio admite exactamente un Administrador (el titular principal). Todos los demás miembros se crean como Recepcionistas o Especialistas.</ManualNote>

        <h3>Los tres roles</h3>
        <ManualTable
          headers={['Rol', 'Acceso']}
          rows={[
            ['Administrador', 'Acceso completo a todos los módulos incluyendo pagos, estadísticas y usuarios'],
            ['Recepcionista', 'Agenda, Clientes, Servicios (lectura), Inventario (lectura). Sin acceso a Pagos ni Usuarios'],
            ['Especialista', 'Solo Agenda propia y Clientes propios. Sin acceso a otros módulos'],
          ]}
        />

        <h3>Agregar un nuevo miembro del equipo</h3>
        <ManualSteps>
          <ManualStep number={1} title="Navega a Usuarios">En el menú lateral, haz clic en <strong>Gestión de Usuarios</strong>.</ManualStep>
          <ManualStep number={2} title="Haz clic en Nuevo Miembro">Se abre el modal de creación.</ManualStep>
          <ManualStep number={3} title="Ingresa los datos">Nombre, apellido, correo electrónico y rol.</ManualStep>
          <ManualStep number={4} title="Configura módulos permitidos">La cuadrícula de <strong>Módulos Permitidos</strong> preselecciona los permisos del rol. Puedes activar o desactivar módulos individuales para este usuario.</ManualStep>
          <ManualStep number={5} title="Establece una contraseña">Ingresa la contraseña inicial y compártela de forma segura. El miembro podrá cambiarla desde su Perfil.</ManualStep>
          <ManualStep number={6} title="Guarda">Haz clic en <strong>Confirmar Miembro</strong>. La cuenta se activa de inmediato.</ManualStep>
        </ManualSteps>
        <ManualNote>Los miembros del equipo inician sesión en el subdominio de tu negocio usando su correo y contraseña.</ManualNote>

        <h3>Editar un miembro del equipo</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre Usuarios">Navega a <strong>Usuarios</strong> en el menú lateral.</ManualStep>
          <ManualStep number={2} title="Haz clic en el ícono de edición">Actualiza nombre, correo, rol o contraseña y haz clic en <strong>Guardar Cambios</strong>.</ManualStep>
          <ManualStep number={3} title="Ajusta permisos (opcional)">Haz clic en el ícono de candado para abrir el panel de <strong>Permisos de Acceso</strong> y ajustar módulos individuales.</ManualStep>
        </ManualSteps>
      </div>
    ),
  },

  /* ─── GOOGLE CALENDAR ───────────────────────────────── */
  {
    id: 'google-calendar',
    label: 'Google Calendar',
    icon: '📆',
    roles: ['admin'],
    searchText: 'google calendar sincronizacion conectar eventos invitacion recordatorio desconectar oauth',
    content: (
      <div>
        <p>Cuando conectas Google Calendar, cada cita creada en Novagendas aparece automáticamente como evento en tu cuenta de Google vinculada. El cliente y el especialista reciben invitación por correo.</p>
        <ManualNote>La conexión es compartida en todo tu negocio — una cuenta de Google por subdominio. Los miembros del personal no necesitan conectar sus propias cuentas.</ManualNote>

        <h3>Conectar Google Calendar</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre la Agenda">En el menú lateral, haz clic en <strong>Agenda de Citas</strong>.</ManualStep>
          <ManualStep number={2} title="Inicia la conexión">Haz clic en <strong>Conectar Google Calendar</strong> en la barra de herramientas.</ManualStep>
          <ManualStep number={3} title="Inicia sesión con Google">Tu navegador te redirige a Google. Selecciona la cuenta del negocio y otorga los permisos solicitados.</ManualStep>
          <ManualStep number={4} title="Confirma">Después de aprobar, Google te redirige a Novagendas con un banner de confirmación.</ManualStep>
        </ManualSteps>
        <ManualTip>Usa una cuenta de Google compartida del negocio (como <code>agenda@tuclinica.com</code>) en lugar de una cuenta personal.</ManualTip>

        <h3>Qué se sincroniza</h3>
        <ManualTable
          headers={['Acción en la cita', 'Resultado en Google Calendar']}
          rows={[
            ['Creada', 'Se crea un nuevo evento; se envían invitaciones al cliente y al especialista'],
            ['Editada (fecha, hora, servicio)', 'El evento existente se actualiza; asistentes son notificados'],
            ['Cancelada o eliminada', 'El evento se elimina; asistentes reciben notificación de cancelación'],
          ]}
        />

        <h3>Detalles del evento</h3>
        <p>Cada evento incluye: nombre del paciente y servicio(s), fecha y hora en zona horaria de Colombia, datos de contacto del cliente y especialista, recordatorio por correo 24h antes y popup 30 min antes.</p>
        <ManualNote>La sincronización con Google Calendar es no bloqueante — si falla, la cita se guarda igualmente en Novagendas.</ManualNote>

        <h3>Desconectar Google Calendar</h3>
        <p>En la barra de herramientas de la Agenda, haz clic en el botón de estado de Google Calendar y selecciona <strong>Desconectar</strong>. Las citas existentes en Google Calendar no se eliminarán; solo se detendrá la sincronización futura.</p>
      </div>
    ),
  },

  /* ─── BOT WHATSAPP ──────────────────────────────────── */
  {
    id: 'bot',
    label: 'Bot WhatsApp',
    icon: '💬',
    roles: ['admin'],
    searchText: 'bot whatsapp agendamiento automatico meta conectar numero horario turnos disponibilidad configuracion',
    content: (
      <div>
        <p>El bot de WhatsApp de Novagendas se conecta a tu número de WhatsApp Business y gestiona automáticamente las conversaciones de agendamiento. Los clientes consultan disponibilidad y agendan citas sin intervención manual de tu equipo.</p>
        <ManualNote>Necesitas una cuenta activa de <strong>WhatsApp Business</strong> para usar esta función. Los números personales de WhatsApp no son compatibles.</ManualNote>

        <h3>Conectar tu número de WhatsApp Business</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre Configuración del Bot">En el menú lateral, haz clic en <strong>Config. Bot</strong>.</ManualStep>
          <ManualStep number={2} title="Inicia la conexión">En la sección <strong>Número de WhatsApp</strong>, haz clic en <strong>Conectar número de WhatsApp</strong>. Se lanza el flujo de registro integrado de Meta en una ventana emergente.</ManualStep>
          <ManualStep number={3} title="Completa el inicio de sesión en Meta">Inicia sesión en tu cuenta de Facebook vinculada a WhatsApp Business y sigue los pasos para seleccionar tu número de teléfono.</ManualStep>
          <ManualStep number={4} title="Confirma">La ventana emergente se cierra y verás <strong>Número conectado</strong> con indicador verde.</ManualStep>
        </ManualSteps>
        <ManualWarning>Debes tener acceso de administrador a la cuenta de Facebook Business. Si la ventana se cierra sin mostrar "Número conectado", la conexión no se completó.</ManualWarning>

        <h3>Configurar días disponibles</h3>
        <p>Selecciona los días de la semana en que tu negocio acepta citas. El bot no ofrecerá horarios en días no seleccionados. Por defecto: lunes a sábado.</p>

        <h3>Configurar franjas horarias</h3>
        <ManualTable
          headers={['Turno', 'Horario por defecto', 'Habilitado por defecto']}
          rows={[
            ['Mañana', '08:00 – 12:00', 'Sí'],
            ['Tarde', '13:00 – 18:00', 'Sí'],
            ['Noche', '18:00 – 21:00', 'No'],
          ]}
        />
        <p>Haz clic en cualquier día activo para expandirlo y ajustar los turnos y horarios. Cada día activo debe tener al menos un turno habilitado y la hora de inicio debe ser anterior a la de fin.</p>
      </div>
    ),
  },

  /* ─── DÍAS BLOQUEADOS ───────────────────────────────── */
  {
    id: 'feriados',
    label: 'Días bloqueados',
    icon: '🚫',
    roles: ['admin'],
    searchText: 'dias bloqueados feriados festivos vacaciones mantenimiento no disponible calendario bloquear',
    content: (
      <div>
        <p>La función de <strong>Días Bloqueados</strong> te permite marcar fechas específicas del calendario como no disponibles para citas. Las fechas bloqueadas aparecen resaltadas en la Agenda para que todo el equipo sepa que no se deben hacer nuevas reservas ese día.</p>

        <h3>Tipos de bloqueo</h3>
        <ManualTable
          headers={['Tipo', 'Color', 'Uso típico']}
          rows={[
            ['Día Feriado', 'Rojo', 'Festivos nacionales o locales'],
            ['No Disponible', 'Ámbar', 'Períodos de vacaciones, días de ausencia del personal'],
            ['Mantenimiento', 'Morado', 'Mantenimiento de instalaciones, renovaciones'],
          ]}
        />

        <h3>Bloquear una fecha</h3>
        <ManualSteps>
          <ManualStep number={1} title="Abre el calendario de Días Bloqueados">En el menú lateral, navega a <strong>Días Bloqueados</strong>.</ManualStep>
          <ManualStep number={2} title="Navega al mes correcto">Usa las flechas ‹ y › para moverte entre meses.</ManualStep>
          <ManualStep number={3} title="Haz clic en la fecha">Haz clic en cualquier fecha futura no bloqueada. Se abre un cuadro de diálogo.</ManualStep>
          <ManualStep number={4} title="Elige el tipo de bloqueo">Selecciona Feriado, No Disponible o Mantenimiento.</ManualStep>
          <ManualStep number={5} title="Ingresa el motivo">Escribe una descripción corta (p.ej. "Semana Santa", "Mantenimiento de equipos").</ManualStep>
          <ManualStep number={6} title="Confirma">Haz clic en <strong>Bloquear día</strong>. La fecha cambia al color del tipo seleccionado de inmediato.</ManualStep>
        </ManualSteps>
        <ManualWarning>Bloquear una fecha no cancela automáticamente ni notifica a los clientes sobre citas existentes. Revisa las citas del día antes de confirmar el bloqueo.</ManualWarning>

        <h3>Cómo aparecen en la Agenda</h3>
        <p>Las fechas bloqueadas aparecen con su color de tipo en el calendario. Un panel de <strong>Próximos días bloqueados</strong> al lado derecho lista las fechas próximas en orden cronológico.</p>
      </div>
    ),
  },

  /* ─── MI CUENTA ─────────────────────────────────────── */
  {
    id: 'account',
    label: 'Mi cuenta',
    icon: '👤',
    roles: ['admin', 'recepcion', 'especialista'],
    searchText: 'perfil cuenta nombre correo foto avatar contraseña cambiar cerrar sesion logout',
    content: (
      <div>
        <p>Tu página de perfil es donde gestionas tu información personal, actualizas tu foto y cambias tu contraseña. Los cambios aplican solo a tu propia cuenta.</p>

        <h3>Abrir tu perfil</h3>
        <p>Haz clic en tu nombre o avatar en el menú lateral izquierdo. La página está organizada en secciones colapsables.</p>

        <h3>Editar información personal</h3>
        <ManualSteps>
          <ManualStep number={1} title="Expande Información Personal">Haz clic en el encabezado de la sección para expandirla.</ManualStep>
          <ManualStep number={2} title="Actualiza tu nombre y correo">Edita los campos <strong>Nombre</strong>, <strong>Apellido</strong> y <strong>Correo</strong>.</ManualStep>
          <ManualStep number={3} title="Guarda">Haz clic en <strong>Actualizar Perfil</strong>.</ManualStep>
        </ManualSteps>
        <ManualNote>Tu <strong>número de cédula</strong> está bloqueado y no se puede editar desde tu perfil. Contacta a tu Administrador si necesita corrección.</ManualNote>

        <h3>Cambiar tu foto de perfil</h3>
        <ManualSteps>
          <ManualStep number={1} title="Expande Mi Perfil">Verás tu foto actual o tus iniciales.</ManualStep>
          <ManualStep number={2} title="Haz clic en tu avatar">Se abre un selector de archivos.</ManualStep>
          <ManualStep number={3} title="Selecciona una imagen">Formatos admitidos: JPEG, PNG. Tamaño máximo: 15 MB. La foto se guarda de inmediato.</ManualStep>
        </ManualSteps>
        <ManualTip>Para mejores resultados usa una imagen cuadrada. Novagendas redimensiona automáticamente.</ManualTip>

        <h3>Cambiar tu contraseña</h3>
        <ManualSteps>
          <ManualStep number={1} title="Expande Seguridad">Haz clic en el encabezado de la sección.</ManualStep>
          <ManualStep number={2} title="Ingresa tu contraseña actual">Escribe tu contraseña existente.</ManualStep>
          <ManualStep number={3} title="Nueva contraseña">Escribe y confirma tu nueva contraseña (mínimo 6 caracteres).</ManualStep>
          <ManualStep number={4} title="Guarda">Haz clic en <strong>Cambiar Contraseña</strong>.</ManualStep>
        </ManualSteps>
        <ManualWarning>Si no recuerdas tu contraseña actual, usa el flujo de restablecimiento en la pantalla de inicio de sesión.</ManualWarning>

        <h3>Cerrar sesión</h3>
        <p>Expande la sección <strong>Mi Perfil</strong> y haz clic en <strong>Cerrar Sesión</strong>. Serás redirigido a la página de inicio de sesión de tu negocio.</p>
      </div>
    ),
  },
];

export function filterSectionsByRole(sections, role) {
  return sections.filter(s => s.roles.includes(role));
}

export function searchSections(sections, query) {
  if (!query.trim()) return sections;
  const q = query.toLowerCase().trim();
  return sections.filter(
    s => s.label.toLowerCase().includes(q) || s.searchText.toLowerCase().includes(q)
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/manual/manualContent.jsx
git commit -m "feat: contenido completo del manual de usuario con 12 secciones"
```

---

### Task 5: Crear Manual.jsx

**Files:**
- Create: `src/features/manual/Manual.jsx`

- [ ] **Step 1: Crear el componente principal**

```jsx
// src/features/manual/Manual.jsx
import { useState, useEffect } from 'react';
import './Manual.css';
import { MANUAL_SECTIONS, filterSectionsByRole, searchSections } from './manualContent';

export default function Manual({ user }) {
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');

  const visible = filterSectionsByRole(MANUAL_SECTIONS, user.role);
  const filtered = searchSections(visible, search);

  useEffect(() => {
    if (!activeId && filtered.length > 0) setActiveId(filtered[0].id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSection = filtered.find(s => s.id === activeId) ?? filtered[0] ?? null;

  return (
    <div className="manual-container">
      <div className="manual-header">
        <h1 className="manual-title">Manual de Usuario</h1>
        <div className="manual-search-wrapper">
          <span className="manual-search-icon">🔍</span>
          <input
            type="text"
            className="manual-search"
            placeholder="Buscar en el manual..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setActiveId(null);
            }}
          />
          {search && (
            <button className="manual-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      <div className="manual-body">
        <nav className="manual-sidebar">
          {filtered.length === 0 ? (
            <p className="manual-no-results">Sin resultados para «{search}»</p>
          ) : (
            <ul className="manual-nav-list">
              {filtered.map(section => (
                <li key={section.id}>
                  <button
                    className={`manual-nav-btn${activeSection?.id === section.id ? ' active' : ''}`}
                    onClick={() => setActiveId(section.id)}
                  >
                    <span className="manual-nav-icon">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <main className="manual-content">
          {activeSection && (
            <>
              <h2 className="manual-section-title">
                {activeSection.icon} {activeSection.label}
              </h2>
              <div className="manual-section-divider" />
              <div className="manual-section-body">
                {activeSection.content}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/manual/Manual.jsx
git commit -m "feat: componente Manual con sidebar, buscador y render de secciones por rol"
```

---

### Task 6: Tests de funciones utilitarias del manual

**Files:**
- Create: `src/features/manual/Manual.test.jsx`

- [ ] **Step 1: Escribir los tests (RED)**

```jsx
// src/features/manual/Manual.test.jsx
import { describe, it, expect } from 'vitest';
import { filterSectionsByRole, searchSections } from './manualContent';

const MOCK_SECTIONS = [
  { id: 'intro',   label: 'Primeros pasos', roles: ['admin', 'recepcion', 'especialista'], searchText: 'primeros pasos inicio' },
  { id: 'payments', label: 'Pagos',          roles: ['admin'],                              searchText: 'pagos abonos ingresos' },
  { id: 'agenda',  label: 'Agenda',          roles: ['admin', 'recepcion', 'especialista'], searchText: 'agenda citas calendario' },
  { id: 'users',   label: 'Gestión equipo',  roles: ['admin'],                              searchText: 'usuarios equipo roles' },
];

describe('filterSectionsByRole', () => {
  it('muestra todas las secciones para admin', () => {
    const result = filterSectionsByRole(MOCK_SECTIONS, 'admin');
    expect(result).toHaveLength(4);
  });

  it('oculta pagos y usuarios para recepcion', () => {
    const result = filterSectionsByRole(MOCK_SECTIONS, 'recepcion');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['intro', 'agenda']);
  });

  it('muestra solo intro y agenda para especialista', () => {
    const result = filterSectionsByRole(MOCK_SECTIONS, 'especialista');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['intro', 'agenda']);
  });

  it('retorna array vacío si no hay secciones para el rol', () => {
    const result = filterSectionsByRole([], 'admin');
    expect(result).toHaveLength(0);
  });
});

describe('searchSections', () => {
  const adminSections = filterSectionsByRole(MOCK_SECTIONS, 'admin');

  it('retorna todas las secciones para query vacío', () => {
    expect(searchSections(adminSections, '')).toHaveLength(4);
    expect(searchSections(adminSections, '   ')).toHaveLength(4);
  });

  it('filtra por texto en label', () => {
    const result = searchSections(adminSections, 'pagos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('payments');
  });

  it('filtra por texto en searchText', () => {
    const result = searchSections(adminSections, 'calendario');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('agenda');
  });

  it('es case-insensitive', () => {
    const result = searchSections(adminSections, 'AGENDA');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('agenda');
  });

  it('retorna array vacío cuando no hay coincidencias', () => {
    const result = searchSections(adminSections, 'xyz-no-existe');
    expect(result).toHaveLength(0);
  });

  it('puede retornar múltiples secciones si el término aparece en varias', () => {
    const result = searchSections(adminSections, 'pasos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('intro');
  });
});
```

- [ ] **Step 2: Ejecutar tests — deben pasar (las funciones ya están escritas)**

```bash
npx vitest run src/features/manual/Manual.test.jsx
```

Expected:
```
✓ filterSectionsByRole > muestra todas las secciones para admin
✓ filterSectionsByRole > oculta pagos y usuarios para recepcion
✓ filterSectionsByRole > muestra solo intro y agenda para especialista
✓ filterSectionsByRole > retorna array vacío si no hay secciones para el rol
✓ searchSections > retorna todas las secciones para query vacío
✓ searchSections > filtra por texto en label
✓ searchSections > filtra por texto en searchText
✓ searchSections > es case-insensitive
✓ searchSections > retorna array vacío cuando no hay coincidencias
✓ searchSections > puede retornar múltiples secciones si el término aparece en varias
Test Files 1 passed (1)
Tests 10 passed (10)
```

- [ ] **Step 3: Commit**

```bash
git add src/features/manual/Manual.test.jsx
git commit -m "test: pruebas unitarias de filterSectionsByRole y searchSections"
```

---

### Task 7: Refactorizar el botón ? a HelpMenu en App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Agregar import de Manual.css al inicio de App.jsx**

Leer `src/App.jsx`. El archivo importa `'./App.css'`. Agregar el import de Manual.css en el bloque de imports existente (después de la línea del import de `TourOverlay.css`):

En `src/App.jsx`, la línea que dice:
```jsx
import './components/tour/TourOverlay.css';
```

Agregar justo después:
```jsx
import './features/manual/Manual.css';
```

- [ ] **Step 2: Agregar el componente HelpMenu dentro de App.jsx**

En `src/App.jsx`, justo antes de la función `TenantApp` (alrededor de la línea 69), agregar el componente `HelpMenu`:

```jsx
function HelpMenu({ userRole, onShowTour, onShowManual }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="help-menu-wrapper">
      {open && (
        <div className="help-menu-popup">
          <button
            className="help-menu-item"
            onClick={() => { onShowManual(); setOpen(false); }}
          >
            📖 Ver manual
          </button>
          {userRole === 'admin' && (
            <button
              className="help-menu-item"
              onClick={() => { onShowTour(); setOpen(false); }}
            >
              🎯 Ver tutorial
            </button>
          )}
        </div>
      )}
      <button
        className="tour-help-btn"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="Ayuda"
        aria-label="Abrir menú de ayuda"
      >
        ?
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Reemplazar el bloque del botón ? en el return de TenantApp**

En el `return` de `TenantApp` (alrededor de la línea 247), localizar este bloque:

```jsx
      {!showTour && user.role === 'admin' && (
        <button
          className="tour-help-btn"
          onClick={() => setShowTour(true)}
          title="Iniciar tour de la aplicación"
          aria-label="Ayuda: ver tour de la aplicación"
        >
          ?
        </button>
      )}
```

Reemplazarlo con:

```jsx
      {!showTour && (
        <HelpMenu
          userRole={user.role}
          onShowTour={() => setShowTour(true)}
          onShowManual={() => setCurrentRoute('manual')}
        />
      )}
```

- [ ] **Step 4: Agregar el import de Manual en App.jsx**

Al inicio del archivo, en el bloque de imports de features, agregar:
```jsx
import Manual from './features/manual/Manual';
```

- [ ] **Step 5: Agregar el case 'manual' en renderRoute**

En la función `renderRoute()`, en el `switch(currentRoute)`, antes del `default:`, agregar:

```jsx
      case 'manual': return <Manual user={user} tenant={tenant} />;
```

- [ ] **Step 6: Verificar que no hay errores de lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: agregar HelpMenu con opciones ver manual y ver tutorial"
```

---

### Task 8: Agregar tab de Arquitectura en SuperAdminPortal

**Files:**
- Modify: `src/features/superadmin/SuperAdminPortal.jsx`

- [ ] **Step 1: Agregar 'arquitectura' al array TABS**

En `src/features/superadmin/SuperAdminPortal.jsx`, localizar el array `TABS`:

```js
const TABS = [
  { id: 'negocios',   label: 'Negocios',    icon: '🏢' },
  { id: 'usuarios',   label: 'Usuarios',    icon: '👥' },
  { id: 'ubicaciones',label: 'Ubicaciones', icon: '📍' },
  { id: 'monitoreo',  label: 'Monitoreo',   icon: '📊' },
];
```

Reemplazar con:

```js
const TABS = [
  { id: 'negocios',    label: 'Negocios',     icon: '🏢' },
  { id: 'usuarios',    label: 'Usuarios',     icon: '👥' },
  { id: 'ubicaciones', label: 'Ubicaciones',  icon: '📍' },
  { id: 'monitoreo',   label: 'Monitoreo',    icon: '📊' },
  { id: 'arquitectura',label: 'Arquitectura', icon: '🏗️' },
];
```

- [ ] **Step 2: Agregar el componente ArchitectureTab**

En `SuperAdminPortal.jsx`, después de la función `ConfirmDialog` (alrededor de la línea 60), agregar el componente `ArchitectureTab`:

```jsx
function ArchitectureTab() {
  const codeStyle = {
    display: 'block',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '1rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    overflowX: 'auto',
    marginBottom: '1rem',
    color: 'var(--text-2)',
    whiteSpace: 'pre',
  };
  const tableStyle = {
    width: '100%', borderCollapse: 'collapse',
    fontSize: '0.875rem', marginBottom: '1.25rem',
  };
  const thStyle = {
    textAlign: 'left', padding: '0.5rem 0.75rem',
    borderBottom: '2px solid var(--border-strong)',
    color: 'var(--text)', fontWeight: 600,
  };
  const tdStyle = {
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--border-light)',
    color: 'var(--text-2)', verticalAlign: 'top',
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, lineHeight: 1.7 }}>
      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
        Arquitectura del Sistema Novagendas
      </h2>
      <div style={{ height: 3, width: 48, background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 99, marginBottom: '1.5rem' }} />

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>1. Resumen General</h3>
      <p style={{ color: 'var(--text-2)', marginBottom: '1rem' }}>
        Novagendas es una <strong>plataforma SaaS multi-tenant de gestión de citas</strong> orientada a clínicas estéticas. Opera bajo un modelo de <strong>subdominio por negocio</strong> (<code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4 }}>tunegocio.novagendas.com</code>). Es una herramienta de operaciones interna — no hay portal público de autoagendamiento.
      </p>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>2. Capas de la Arquitectura</h3>
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Capa</th><th style={thStyle}>Responsabilidad</th></tr></thead>
        <tbody>
          {[
            ['Routing por Subdominio', 'Identifica el tenant a partir del subdominio y enruta la sesión al espacio correcto'],
            ['Autenticación', 'Valida credenciales, genera sesiones con TTL 24h, controla acceso por rol'],
            ['Core de Negocio', 'Lógica de dominio: citas, clientes, servicios, pagos, inventario, equipo'],
            ['Integraciones', 'Adaptadores hacia Google Calendar API y WhatsApp Business API de Meta'],
            ['Base de Datos', 'Persistencia por tenant con aislamiento lógico (Supabase/PostgreSQL)'],
          ].map(([cap, resp], i) => (
            <tr key={i}><td style={tdStyle}><strong>{cap}</strong></td><td style={tdStyle}>{resp}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>3. Control de Acceso (RBAC)</h3>
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Rol</th><th style={thStyle}>Módulos accesibles</th></tr></thead>
        <tbody>
          {[
            ['Administrador', 'Todos: Agenda, Clientes, Servicios, Pagos, Inventario, Usuarios, Estadísticas, Auditoría, Sedes, Bot'],
            ['Recepcionista', 'Agenda, Clientes, Servicios (lectura), Inventario (lectura)'],
            ['Especialista', 'Agenda propias, Clientes propios, Perfil'],
          ].map(([rol, modulos], i) => (
            <tr key={i}><td style={tdStyle}><strong>{rol}</strong></td><td style={tdStyle}>{modulos}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>4. Módulo de Agenda — Ciclo de vida de una cita</h3>
      <pre style={codeStyle}>{`[*] --> EnEspera    : Cita creada
EnEspera --> Confirmada : Cliente confirmado
EnEspera --> Cancelada  : Cancelación
Confirmada --> Completada : Sesión realizada
Confirmada --> Cancelada  : Cancelación
Cancelada --> [*]
Completada --> [*]`}</pre>
      <p style={{ color: 'var(--text-2)', marginBottom: '1rem' }}>
        Comportamientos clave: detección de conflictos antes de guardar, drag &amp; drop en vistas Día/Semana, descuento automático de inventario al crear (no al editar), sincronización no bloqueante con Google Calendar.
      </p>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>5. Módulo de Clientes</h3>
      <p style={{ color: 'var(--text-2)', marginBottom: '1rem' }}>
        Notas clínicas <strong>append-only</strong> (inmutables una vez guardadas). Consentimiento Habeas Data obligatorio (Ley 1581 colombiana). Historial completo de citas por cliente.
      </p>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>6. Stack Técnico</h3>
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Componente</th><th style={thStyle}>Tecnología</th></tr></thead>
        <tbody>
          {[
            ['Frontend', 'React 19 + Vite 8, JavaScript (sin TypeScript), CSS custom properties'],
            ['Backend / DB', 'Supabase (PostgreSQL + Auth + SMTP + Edge Functions)'],
            ['Auth', 'RPC custom login_usuario — NO usa Supabase Auth para login'],
            ['Google Calendar', 'OAuth2 Authorization Code via Edge Functions, tokens en tabla google_integrations'],
            ['WhatsApp', 'Meta Embedded Signup, webhook via Edge Functions'],
            ['Multi-tenancy', 'Subdominio → tabla negocios → idnegocios en cada query'],
          ].map(([comp, tech], i) => (
            <tr key={i}><td style={tdStyle}><strong>{comp}</strong></td><td style={tdStyle}>{tech}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>7. Buenas Prácticas Implementadas</h3>
      <ul style={{ color: 'var(--text-2)', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
        <li><strong>Soft delete generalizado</strong> — preserva integridad referencial e histórico</li>
        <li><strong>Append-only en notas clínicas</strong> — integridad del historial médico</li>
        <li><strong>RBAC con sobreescritura por usuario</strong> — flexibilidad sin romper el modelo de roles</li>
        <li><strong>Integraciones externas no bloqueantes</strong> — resiliencia ante fallos de Google/Meta</li>
        <li><strong>Aislamiento de tenant por subdominio</strong> — separación a nivel DNS, app y DB</li>
        <li><strong>Auditoría CRUD completa</strong> — trazabilidad total de acciones</li>
        <li><strong>TTL fijo de sesión 24h</strong> — seguridad predecible</li>
        <li><strong>Consentimiento Habeas Data obligatorio</strong> — cumplimiento Ley 1581 Colombia</li>
      </ul>

      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>8. Riesgos y Puntos de Mejora</h3>
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Riesgo</th><th style={thStyle}>Nivel</th><th style={thStyle}>Mitigación recomendada</th></tr></thead>
        <tbody>
          {[
            ['Fallo silencioso de sync Google Calendar', 'Medio', 'Cola de reintentos con backoff exponencial'],
            ['Sesiones activas tras desactivar usuario', 'Medio', 'Lista negra de tokens para invalidación inmediata'],
            ['Sin rate limiting en bot WhatsApp', 'Medio', 'Throttling por número de teléfono'],
            ['Passwords en texto plano en tabla usuario', 'Alto', 'Hashear con bcrypt en RPC login_usuario'],
          ].map(([riesgo, nivel, mit], i) => (
            <tr key={i}>
              <td style={tdStyle}>{riesgo}</td>
              <td style={{ ...tdStyle, color: nivel === 'Alto' ? 'var(--danger)' : nivel === 'Medio' ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{nivel}</td>
              <td style={tdStyle}>{mit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ color: 'var(--text-4)', fontSize: '0.8125rem', marginTop: '1rem' }}>
        Fuente: <code style={{ fontFamily: 'var(--font-mono)' }}>documentacion oficial/technical/architecture.mdx</code>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Renderizar ArchitectureTab en el switch de tabs del portal**

En `SuperAdminPortal.jsx`, buscar el bloque de render que cambia según el tab activo (busca `activeTab === 'negocios'` o similar). Agregar el caso para `'arquitectura'`:

Localizar el bloque `{activeTab === 'monitoreo' && <MonitoreoTab ... />}` (o la estructura de render de tabs) y agregar justo después:

```jsx
{activeTab === 'arquitectura' && <ArchitectureTab />}
```

- [ ] **Step 4: Verificar lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/superadmin/SuperAdminPortal.jsx
git commit -m "feat: tab de arquitectura técnica en SuperAdminPortal"
```

---

### Task 9: Verificación final

**Files:** ninguno (solo ejecución)

- [ ] **Step 1: Ejecutar todos los tests**

```bash
npx vitest run
```

Expected: todos los tests existentes pasan, incluyendo los 10 nuevos de `Manual.test.jsx`.

- [ ] **Step 2: Build de producción**

```bash
npm run build
```

Expected: sin errores de compilación.

- [ ] **Step 3: Verificación manual — iniciar el servidor de desarrollo**

```bash
npm run dev
```

Verificar:
1. El botón `?` en la esquina inferior derecha es visible para todos los roles (admin, recepcion, especialista)
2. Al hacer clic en `?`, aparece el mini-menú con "📖 Ver manual" (y "🎯 Ver tutorial" solo para admin)
3. Al hacer clic en "Ver manual", se abre el manual con el sidebar de secciones filtradas por rol
4. El buscador filtra secciones en tiempo real
5. Un administrador ve las 12 secciones
6. Un especialista solo ve: Primeros pasos, Agenda y citas, Clientes, Mi cuenta (4 secciones)
7. En `superadmin.novagendas.com`, el portal tiene una nueva tab "🏗️ Arquitectura" con el contenido técnico

- [ ] **Step 4: Commit final**

```bash
git add -u
git commit -m "feat: manual de usuario completo con filtro por rol, buscador y docs técnica en superadmin"
```
