# Bot: Selección por Categoría antes de Servicio

**Fecha:** 2026-05-21
**Rama:** bot_templates_resend
**Alcance:** Flujo de agendamiento del bot de WhatsApp

---

## Problema

Al agendar una cita, el bot muestra todos los servicios del negocio en una lista plana y sin orden. Cuando hay muchos servicios esto es confuso para el usuario.

## Solución

Agregar un paso `SELECT_CATEGORY` antes de `SELECT_SERVICE`. El usuario elige primero la categoría y luego ve solo los servicios de esa categoría.

---

## Flujo de estados

```
MENU → SELECT_CATEGORY → SELECT_SERVICE → SELECT_SPECIALIST → SELECT_DATE → ...
               ↑
       (se salta si el negocio tiene 1 sola categoría activa)
```

### Reglas de routing desde MENU (opción "Agendar")

1. Consultar categorías activas del negocio (con al menos un servicio activo)
2. Si **1 categoría**: guardar `selectedCategory` en `data` automáticamente → ir a `SELECT_SERVICE`
3. Si **2–10 categorías**: mostrar lista interactiva WhatsApp → ir a `SELECT_CATEGORY`
4. Si **>10 categorías**: mostrar menú de texto numerado → ir a `SELECT_CATEGORY`

---

## Cambios por archivo

### `bot-engine.ts`

- Agregar `SELECT_CATEGORY` al enum/tipo de pasos
- En el handler de `MENU` (opción Agendar): consultar categorías y aplicar routing descrito arriba
- Agregar handler para `SELECT_CATEGORY`:
  - Lista interactiva: parsear `listReply.id` como `idcategoriaservicio`
  - Menú numerado: parsear número del texto, validar rango
  - Guardar `{ id, descripcion }` en `data.selectedCategory`
  - Avanzar a `SELECT_SERVICE`
- En handler de `SELECT_SERVICE`: agregar `.eq('idcategoriaservicio', data.selectedCategory.id)` al query de servicios

### `messages.ts`

- Agregar función `buildCategoryList(categorias, telefonoContacto)`:
  - Si `categorias.length <= 10`: retorna mensaje de lista interactiva WhatsApp
  - Si `categorias.length > 10`: retorna mensaje de texto con lista numerada

---

## Estructura de datos

Campo nuevo en el JSONB `data` de `whatsapp_conversations`:

```json
{
  "selectedCategory": { "id": 3, "descripcion": "Masajes" }
}
```

Se escribe al confirmar la categoría y se consume al listar servicios.

---

## Manejo de errores

| Caso | Comportamiento |
|------|---------------|
| Input inválido en menú numerado (>10 categorías) | Responder "Por favor responde con el número de la categoría que deseas." y repetir el menú |
| Número fuera de rango | Mismo mensaje de error + repetir menú |
| Categoría sin servicios (caso improbable, la UI lo previene) | "Lo sentimos, no hay servicios disponibles en esa categoría. Escribe *menu* para volver al inicio." |
| Conversaciones en curso sin `selectedCategory` al hacer deploy | Continúan en `SELECT_SERVICE` sin filtro — comportamiento anterior, sin rotura |

---

## Restricciones

- Todas las categorías tienen al menos un servicio (garantizado por la UI de Services.jsx)
- Todos los servicios tienen categoría asignada (campo obligatorio en el formulario)
- No se agrega configuración en `bot_config` — el nuevo flujo es el único flujo
- No se toca el flujo de EDITAR ni CANCELAR (solo aplica a agendamiento nuevo)
