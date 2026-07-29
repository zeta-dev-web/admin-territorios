# Territorios App Mobile

Aplicación móvil multiplataforma para administrar grupos, territorios y asignaciones de Territorios App. Está construida con React Native y Expo Router, y reutiliza la autenticación y la API móvil del sistema web.

## Inicio rápido

```bash
npm install
npx expo start
```

Para abrirla en navegador:

```bash
npx expo start --web
```

## API

Por defecto, la app usa la API de producción:

```text
https://territoriosapp.duckdns.org/api/mobile
```

Para trabajar contra un servidor local, crea `mobile/.env` con:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/mobile
```

En un dispositivo físico, reemplaza `localhost` por la IP local de la computadora que ejecuta Next.js.

## Validación

```bash
npx tsc --noEmit
npx eslint src --no-cache
npx expo export --platform web
```

## Estructura principal

- `src/app`: navegación y pantallas con Expo Router.
- `src/components`: componentes visuales reutilizables.
- `src/providers`: sesión persistente y contexto de autenticación.
- `src/lib/api.ts`: cliente tipado de la API móvil.
- `src/constants/theme.ts`: paleta, tipografías, espaciado y radios de la marca.
- `assets/brand`: logo oficial utilizado por la aplicación.

## Funcionalidades incluidas

- Login con las mismas credenciales de la web.
- Persistencia de sesión y aceptación de términos.
- Dashboard con estadísticas y actividad reciente.
- Listado de asignaciones con filtros y búsqueda.
- Alta de asignaciones por grupo o personales, selección de manzanas y devolución.
- Detalle de asignación para registrar manzanas trabajadas, fechas y notas.
- Finalización automática al registrar la última manzana pendiente.
- Listado de territorios con búsqueda y estado de manzanas.
- Alta y edición de territorios con carga ordenada de manzanas.
- Alta y edición de grupos e integrantes, incluyendo convertir integrantes en conductores.
- Alta y edición de conductores seleccionando un integrante existente o cargando un nombre.
- Carga, edición y eliminación de mapas generales o por grupo.
- Historial con filtros y corrección de fechas o responsables en devoluciones.
- Exportación del historial al formulario oficial S-13-S por período y rango de territorios.
- Configuración de cuenta y cierre de sesión.
