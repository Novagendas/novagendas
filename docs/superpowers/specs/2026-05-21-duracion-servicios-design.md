# Diseño: Input de Duración Personalizado para Servicios

**Fecha:** 2026-05-21  
**Archivo afectado:** `src/features/services/Services.jsx`

## Problema

El campo de duración en el formulario de servicios es un `<select>` con opciones fijas hasta 120 minutos (2 horas). No permite registrar servicios de mayor duración.

## Solución

Reemplazar el `<select>` de duración por dos inputs coordinados:
- Un `<input type="number">` para horas
- Un `<select>` para minutos con intervalos de 15 min

## Estado del Formulario

No se cambia la estructura de `form.duration` (sigue siendo minutos totales como entero). Los inputs de horas y minutos derivan sus valores de `form.duration` en tiempo de renderizado:

```js
const durationHours = Math.floor(form.duration / 60)
const durationMinutes = form.duration % 60
```

Al cambiar cualquier input, se recalcula `form.duration`:
```js
// Al cambiar horas
update('duration', Number(newHours) * 60 + durationMinutes)

// Al cambiar minutos
update('duration', durationHours * 60 + Number(newMinutes))
```

## Input de Horas

- Tipo: `<input type="number">`
- Rango: 0–12, step 1
- Valor inicial: `Math.floor(form.duration / 60)`

## Select de Minutos

- Opciones: `[0, 15, 30, 45]` mostradas como `"00 min"`, `"15 min"`, `"30 min"`, `"45 min"`
- Valor inicial: `form.duration % 60`

## Validación

- Si `horas === 12`, forzar minutos a 0 (límite: 720 minutos = 12 horas exactas)
- Si `horas === 0` y `minutos === 0`, no permitir guardar (duración mínima: 15 min)

## Compatibilidad con DB

Sin cambios en la columna `duracion` (sigue siendo INTEGER en minutos). El valor guardado sigue siendo `parseInt(form.duration, 10)`.

## Display en Card de Servicio

Cambiar `"{duration} minutos de sesión"` por un helper que muestre:
- Menos de 60 min: `"30 min"`
- Exactamente N horas: `"2 horas"`
- Horas y minutos: `"1h 30min"`

## Alcance

- Solo `src/features/services/Services.jsx`
- Sin cambios en DB, Agenda, ni otros componentes
