# Copiloto IA de Territorios

Sistema de asistente inteligente con acceso a la base de datos de territorios mediante consultas de solo lectura.

## Características

El copiloto de territorios permite hacer consultas en lenguaje natural sobre:

- **Historial de territorios**: Consultar todas las asignaciones (regulares y personales) de un territorio específico
- **Historial de publicadores**: Ver todos los territorios trabajados por un publicador (como conductor o en asignaciones personales)
- **Estado actual**: Verificar el estado actual de un territorio (conductor activo, manzanas trabajadas, registros recientes)
- **Territorios disponibles**: Listar territorios sin asignar y filtrar por grupo
- **Estadísticas**: Obtener métricas generales del sistema de territorios

## Arquitectura

### Componentes

1. **`components/ai/copilot-territorios-chat.tsx`**
   - Componente React del chat flotante
   - Interfaz de usuario con botón flotante y ventana de chat
   - Integración con Puter.js para ejecutar el modelo de IA (Grok/Llama)
   - Manejo de tool calling (llamadas a herramientas)

2. **`services/ai-tools-territorios.service.ts`**
   - Funciones de solo lectura que consultan la base de datos
   - Cada función es una "herramienta" que la IA puede invocar
   - Todas las consultas están aisladas por `tenantId` (multinquilino)

3. **`app/api/ai/query-territorios/route.ts`**
   - Endpoint API seguro: `POST /api/ai/query-territorios`
   - Valida autenticación y aislamiento por congregación
   - Lista blanca estricta de herramientas (no ejecuta SQL arbitrario)
   - Esquema de validación con Zod

### Flujo de datos

```
Usuario escribe pregunta
    ↓
CopilotTerritoriosChat (navegador)
    ↓
Puter.js ejecuta modelo IA (Grok/Llama)
    ↓
IA decide qué herramienta(s) invocar
    ↓
CopilotTerritoriosChat → POST /api/ai/query-territorios
    ↓
Endpoint valida sesión + herramienta
    ↓
ai-tools-territorios.service consulta BD (solo lectura)
    ↓
Resultado JSON → IA → Respuesta en lenguaje natural
```

## Herramientas disponibles

### 1. getTerritoryHistory
Historial completo de un territorio.

**Parámetros:**
- `territoryNumber` (number): Número del territorio

**Retorna:**
- Información del territorio (número, descripción, grupo)
- Lista de asignaciones regulares (conductor, fechas, manzanas trabajadas)
- Lista de asignaciones personales con detalles

**Ejemplo de consulta:**
> "¿Cuál es el historial del territorio 15?"

### 2. getPublisherTerritoryHistory
Historial de territorios de un publicador.

**Parámetros:**
- `publisherName` (string): Nombre o apellido del publicador

**Retorna:**
- Asignaciones como conductor
- Asignaciones personales
- Registros diarios de trabajo en manzanas

**Ejemplo de consulta:**
> "¿Qué territorios ha trabajado Juan Pérez?"

### 3. getTerritoryStatus
Estado actual de un territorio.

**Parámetros:**
- `territoryNumber` (number): Número del territorio

**Retorna:**
- Información del territorio
- Conductor actual y días asignado
- Manzanas trabajadas
- Últimos registros diarios
- Asignaciones personales activas

**Ejemplo de consulta:**
> "¿Cuál es el estado del territorio 23?"

### 4. getAvailableTerritories
Lista de territorios disponibles y asignados.

**Parámetros:**
- `groupName` (string, opcional): Filtrar por grupo
- `includePersonalAssignments` (boolean, opcional): Incluir detalles de asignaciones personales

**Retorna:**
- Total de territorios
- Territorios disponibles para asignar
- Territorios actualmente asignados

**Ejemplo de consulta:**
> "¿Qué territorios están disponibles?"
> "Muéstrame los territorios disponibles del grupo Norte"

### 5. getTerritoriesStats
Estadísticas generales del sistema.

**Parámetros:**
Ninguno

**Retorna:**
- Totales: territorios, manzanas, grupos
- Asignaciones activas (regulares y personales)
- Porcentaje de cobertura
- Últimas asignaciones completadas
- Conductores más activos

**Ejemplo de consulta:**
> "Dame estadísticas de territorios"

## Configuración

### Variables de entorno

Agregar en `.env`:

```env
NEXT_PUBLIC_COPILOT_TERRITORIOS_SYSTEM_PROMPT="Eres un asistente experto en gestión de territorios de predicación. Hoy es {{TODAY}}. Usa las herramientas disponibles para consultar información sobre territorios, asignaciones, publicadores, grupos y estadísticas. Responde de forma concisa, profesional y útil en español."
```

El placeholder `{{TODAY}}` se reemplaza automáticamente con la fecha actual.

### Integración con AppLayout

El copiloto se muestra automáticamente en todas las páginas del módulo `/territorios/*`:

```tsx
// components/common/AppLayout.tsx
const isTerritoriosModule = pathname?.startsWith('/territorios')
{isTerritoriosModule && <CopilotTerritoriosChat />}
```

## Seguridad

### Medidas implementadas

1. **Autenticación obligatoria**: El endpoint requiere sesión activa
2. **Aislamiento multinquilino**: Todas las consultas filtran por `session.tenantId`
3. **Lista blanca de herramientas**: Solo las 5 herramientas definidas pueden ejecutarse
4. **Validación estricta**: Esquemas Zod validan todos los parámetros
5. **Solo lectura**: No se permite ninguna operación de escritura
6. **Sin SQL arbitrario**: La IA no puede ejecutar consultas personalizadas

### Límites

- 6 iteraciones máximas por conversación (previene loops infinitos)
- Timeout de 120 segundos en consultas
- Validación de rangos numéricos (ej: territorio entre 1-9999)
- Validación de longitud de strings

## Ejemplos de uso

### Consultas sobre territorios

- "¿Cuáles son los territorios disponibles?"
- "Muéstrame el historial del territorio 42"
- "¿Qué territorios del grupo Sur están libres?"
- "¿Cuál es el estado actual del territorio 10?"

### Consultas sobre publicadores

- "¿Qué territorios ha trabajado María González?"
- "Muéstrame el historial de Juan como conductor"
- "¿Quiénes son los conductores más activos?"

### Estadísticas

- "Dame un resumen de territorios"
- "¿Cuántos territorios tenemos asignados?"
- "¿Qué porcentaje de cobertura tenemos?"
- "Muéstrame las últimas asignaciones completadas"

## Diferencias con Copiloto VYMC

| Aspecto | Copiloto VYMC | Copiloto Territorios |
|---------|---------------|---------------------|
| **Ruta** | `/vymc/*` | `/territorios/*` |
| **Color** | Azul (`#2C5282`) | Verde (`#059669`) |
| **Endpoint** | `/api/ai/query-db` | `/api/ai/query-territorios` |
| **Herramientas** | 4 herramientas (publicadores, semanas, estadísticas) | 5 herramientas (territorios, asignaciones, estadísticas) |
| **Prompt** | `NEXT_PUBLIC_COPILOT_SYSTEM_PROMPT` | `NEXT_PUBLIC_COPILOT_TERRITORIOS_SYSTEM_PROMPT` |

## Mantenimiento

### Agregar nuevas herramientas

1. Crear función en `ai-tools-territorios.service.ts`
2. Agregar validación en `query-territorios/route.ts`
3. Agregar definición de herramienta en `copilot-territorios-chat.tsx`
4. Actualizar documentación

### Debugging

Logs disponibles en:
- Cliente: Consola del navegador
- Servidor: `console.error` en `/api/ai/query-territorios`

## Tecnologías

- **Next.js 15**: Framework y API routes
- **Puter.js**: SDK para ejecutar IA en el navegador (sin API keys)
- **Grok/Llama 4**: Modelo de lenguaje con tool calling
- **Prisma**: ORM para consultas a base de datos
- **Zod**: Validación de esquemas
- **TypeScript**: Type safety en toda la aplicación


## Mejores Prácticas

### Preguntas efectivas

✅ **Buenas preguntas** (específicas y claras):
- "¿Qué territorios están disponibles?"
- "¿Cuál es el estado del territorio 15?"
- "¿Qué territorios ha trabajado Juan Pérez?"
- "Dame estadísticas de territorios"
- "¿Cuántos territorios hay sin asignar?"

❌ **Preguntas ambiguas**:
- "Dime todo sobre territorios" (muy amplio)
- "¿Qué pasa con el 15?" (falta contexto)
- "¿Y Juan?" (falta apellido o contexto)

### Cómo obtener mejores respuestas

1. **Sé específico**: En lugar de "¿territorios?", pregunta "¿Qué territorios están disponibles del grupo Norte?"

2. **Una pregunta a la vez**: Divide preguntas complejas en varias simples
   - ❌ "Dame territorios disponibles, historial de Juan y estadísticas"
   - ✅ "¿Qué territorios están disponibles?" → luego → "¿Qué territorios ha trabajado Juan?"

3. **Usa números exactos**: "territorio 15" en lugar de "ese territorio"

4. **Nombres completos**: "Juan Pérez" mejor que solo "Juan"

### Limitaciones conocidas

- La IA puede incluir información no solicitada (se está refinando el comportamiento)
- Máximo 6 iteraciones de consulta por conversación
- No puede modificar datos (solo consulta)
- No tiene acceso a información fuera de la base de datos de territorios

### Tips

- Si la respuesta incluye información que no pediste, reformula tu pregunta siendo más específico
- Puedes hacer preguntas de seguimiento en la misma conversación
- El historial de conversación se mantiene hasta que cierres o recargues la página
