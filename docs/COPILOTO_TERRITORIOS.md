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
   - Toda la lógica de conversación vive en el hook compartido `components/ai/use-copilot-chat.ts`

2. **`services/ai-tools-territorios.service.ts`**
   - Funciones de solo lectura que consultan la base de datos
   - Cada función es una "herramienta" que la IA puede invocar
   - Todas las consultas están aisladas por `tenantId` (multinquilino)

3. **`app/api/ai/chat/route.ts`**
   - Endpoint unificado: `POST /api/ai/chat` con `{ module: "vymc" | "territorios", messages }`
   - Valida autenticación, aplica rate limiting diario y corre el loop de tool calling completo del lado del servidor
   - Ejecuta las herramientas directamente contra los services (sin HTTP intermedio)

4. **`lib/ai/openrouter.ts`**
   - Cliente server-only de OpenRouter (API compatible con OpenAI)
   - Cadena de fallback entre modelos configurables (`OPENROUTER_MODEL` + `OPENROUTER_FALLBACK_MODELS`)
   - Timeout por request y logs de fallos por modelo

5. **`lib/ai/copilot-config.ts`**
   - Definiciones de herramientas (formato OpenAI) y system prompts por módulo (variables server-only)
   - Ejecutores de herramientas con validación Zod

6. **`lib/ai/rate-limit.ts`**
   - Límite diario por usuario (`AI_USER_DAILY_LIMIT`) y global (`AI_GLOBAL_DAILY_LIMIT`) en memoria, reseteo diario UTC

### Flujo de datos

```
Usuario escribe pregunta
    ↓
CopilotTerritoriosChat → POST /api/ai/chat { module: "territorios", messages }
    ↓
Endpoint valida sesión + rate limit
    ↓
Servidor llama a OpenRouter (modelo con tool calling)
    ↓
IA decide qué herramienta(s) invocar
    ↓
Endpoint ejecuta la tool contra ai-tools-territorios.service (solo lectura, tenantId de sesión)
    ↓
Resultados JSON vuelven al modelo → Respuesta final en lenguaje natural
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

Agregar en `.env` (server-only, no se exponen al navegador):

```env
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="meta-llama/llama-3.3-70b-instruct:free"
OPENROUTER_FALLBACK_MODELS="qwen/qwen3-coder-480b-a35b-instruct:free,openai/gpt-oss-20b:free,openrouter/free"
AI_USER_DAILY_LIMIT=6
AI_GLOBAL_DAILY_LIMIT=40
AI_COPILOT_TERRITORIOS_SYSTEM_PROMPT="Eres un asistente experto en gestión de territorios de predicación. Hoy es {{TODAY}}. Usa las herramientas disponibles para consultar información sobre territorios, asignaciones, publicadores, grupos y estadísticas. Responde de forma concisa, profesional y útil en español."
```

Notas:
- El placeholder `{{TODAY}}` se reemplaza automáticamente con la fecha actual.
- Los modelos `:free` de OpenRouter rotan constantemente y a veces no soportan tools: por eso la cadena de fallbacks es importante. Verificar disponibilidad en openrouter.ai/models.
- Los endpoints `:free` pueden registrar los prompts enviados. No enviar información sensible más allá de los nombres ya presentes en el sistema.
- Sin créditos en OpenRouter el límite es 50 requests/día (20/min); con USD 10 cargados una sola vez sube a 1000/día. Cada mensaje del copiloto puede consumir varias llamadas (loop de tools, máx. 4).

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

- 4 llamadas máximas al modelo por mensaje (3 rondas de tools + respuesta final)
- Límite diario de mensajes por usuario y global (rate limiting en memoria)
- Timeout de 45 segundos por request a OpenRouter
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
| **Color** | Azul (`#2C5282`) | Rojo (`#DC2626`) |
| **Endpoint** | `POST /api/ai/chat` (`module: "vymc"`) | `POST /api/ai/chat` (`module: "territorios"`) |
| **Herramientas** | 4 herramientas (publicadores, semanas, estadísticas) | 5 herramientas (territorios, asignaciones, estadísticas) |
| **Prompt** | `AI_COPILOT_SYSTEM_PROMPT` | `AI_COPILOT_TERRITORIOS_SYSTEM_PROMPT` |

## Mantenimiento

### Agregar nuevas herramientas

1. Crear función en el service correspondiente (`ai-tools-territorios.service.ts`)
2. Agregar definición de herramienta y schema Zod en `lib/ai/copilot-config.ts`
3. Conectarla en `executeCopilotTool`
4. Actualizar documentación

### Debugging

Logs disponibles en:
- Servidor: `console.warn`/`console.error` en `/api/ai/chat` y `[openrouter]` por cada modelo que falla
- Cliente: mensajes de error dentro del propio chat

## Tecnologías

- **Next.js**: Framework y API routes
- **OpenRouter**: Gateway de LLMs (API compatible con OpenAI), modelos free con fallback automático entre modelos
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
- Máximo 4 llamadas al modelo por mensaje
- No puede modificar datos (solo consulta)
- No tiene acceso a información fuera de la base de datos de territorios
- Sujeto a los límites del free tier de OpenRouter (rotación de modelos, throttling en picos)

### Tips

- Si la respuesta incluye información que no pediste, reformula tu pregunta siendo más específico
- Puedes hacer preguntas de seguimiento en la misma conversación
- El historial de conversación se mantiene hasta que cierres o recargues la página
