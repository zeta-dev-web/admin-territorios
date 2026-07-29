# API móvil

La API móvil comparte el catálogo de operaciones del endpoint de IA, pero usa
una sesión propia de usuario. El usuario de la app es un administrador general
o un usuario de congregación; los conductores siguen siendo datos operativos,
no cuentas de acceso.

## Base URL

```text
https://territoriosapp.duckdns.org/api/mobile
```

## Login

```http
POST /api/mobile
Content-Type: application/json
```

```json
{
  "action": "login",
  "params": {
    "email": "usuario@ejemplo.com",
    "password": "contraseña"
  }
}
```

La respuesta incluye un token válido por 24 horas y los datos de la
congregación del usuario:

```json
{
  "success": true,
  "action": "login",
  "data": {
    "token": "eyJ...",
    "expiresIn": 86400,
    "user": {
      "id": "...",
      "email": "usuario@ejemplo.com",
      "name": "Usuario",
      "role": "USER",
      "tenantId": "...",
      "congregationName": "Mi congregación",
      "termsAccepted": true
    }
  }
}
```

## Acciones autenticadas

Todas las acciones, excepto `login`, requieren:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Ejemplo para obtener las asignaciones activas:

```json
{
  "action": "getUnifiedAssignments",
  "params": {
    "page": 1,
    "pageSize": 20
  }
}
```

La API ejecuta las acciones dentro de la congregación del usuario autenticado.
El cliente no puede elegir otro `tenantId` enviándolo en el body.

## Acciones de sesión

| Acción | Uso |
| --- | --- |
| `login` | Inicia sesión con las mismas credenciales de la web. |
| `me` | Devuelve el usuario y la congregación actuales. |
| `refresh` | Renueva un token móvil vigente por otras 24 horas. |
| `acceptTerms` | Registra la aceptación de términos. |
| `changePassword` | Cambia la contraseña verificando la actual. |
| `logout` | Confirma el cierre; la app debe eliminar el token localmente. |

Hasta aceptar los términos, la API solo permite consultar `me`, renovar o
cerrar la sesión, cambiar la contraseña y ejecutar `acceptTerms`. Las demás
acciones responden con `403` y el código `TERMS_NOT_ACCEPTED`.

## Catálogo de datos

El catálogo completo se consulta con:

```http
GET /api/mobile
```

Incluye acciones para dashboard, grupos, integrantes, conductores,
territorios, manzanas, asignaciones de grupo y personales, registros diarios,
historial, mapas y exportación.

Las fechas deben enviarse como strings ISO 8601. Las imágenes de mapas se
envían como URLs, igual que en la API de IA.

## Exportación S-13-S

La acción `exportTerritoryHistoryPdf` devuelve un archivo PDF, no JSON. Se
invoca con el mismo header de autorización y estos parámetros:

```json
{
  "action": "exportTerritoryHistoryPdf",
  "params": {
    "startNumber": 1,
    "endNumber": 10,
    "fromMonth": 1,
    "fromYear": 2026,
    "toMonth": 1,
    "toYear": 2026,
    "includeActive": false
  }
}
```

La respuesta es `application/pdf` con `Content-Disposition: attachment`.
