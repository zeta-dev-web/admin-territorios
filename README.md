# 🗺️ Admin Territorios

> Sistema de administración y gestión de territorios de predicación para congregaciones

**Admin Territorios** es una aplicación web moderna diseñada para facilitar la gestión, asignación y seguimiento de territorios de predicación. Proporciona herramientas completas para administradores y conductores, permitiendo un control eficiente de las asignaciones, progreso de manzanas y estadísticas en tiempo real.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-316192?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)

---

## ✨ Características Principales

### 🎯 Gestión de Territorios
- **Creación y administración** de territorios con números, descripciones y manzanas
- **Registro rápido de manzanas** con letras identificadoras
- **Asignación de territorios** a grupos específicos
- **Estadísticas en tiempo real** sobre territorios asignados y manzanas completadas

### 👥 Gestión de Personas
- **Grupos organizados** con superintendentes y auxiliares
- **Conductores de territorios** con seguimiento de asignaciones activas
- **Miembros regulares** para asignaciones personales
- **Historial completo** de todas las asignaciones

### 📊 Sistema de Asignaciones
- **Asignaciones para conductores** - Con seguimiento por manzanas y progreso visual
- **Asignaciones personales** - Para miembros individuales sin división por manzanas
- **Registro diario** de manzanas trabajadas con notas opcionales
- **Devolución flexible** con fechas personalizables
- **Vista unificada** que combina ambos tipos de asignaciones

### 📈 Seguimiento y Reportes
- **Timeline de registros diarios** para visualizar el progreso temporal
- **Progreso por manzanas** con barras visuales y porcentajes
- **Historial completo** de asignaciones finalizadas
- **Lista de territorios atrasados** que requieren atención
- **Frecuencia de predicación** por territorio

### 🔐 Autenticación y Seguridad
- Sistema de login con hash de contraseñas (bcrypt)
- Tokens JWT seguros con la librería Jose
- Protección de rutas mediante middleware
- Sesiones persistentes

---

## 🚀 Tecnologías Utilizadas

### Frontend
- **[Next.js 16.2](https://nextjs.org/)** - Framework React con App Router
- **[React 19.2](https://react.dev/)** - Biblioteca de UI con Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático para mayor seguridad
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Framework de CSS utility-first
- **[Lucide React](https://lucide.dev/)** - Iconos modernos y personalizables
- **[date-fns](https://date-fns.org/)** - Manipulación de fechas con localización en español

### Backend
- **[Prisma 7.8](https://www.prisma.io/)** - ORM moderno para TypeScript/Node.js
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos relacional robusta
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hashing de contraseñas
- **[jose](https://github.com/panva/jose)** - Manejo de JWT

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Prettier** (recomendado) - Formateo de código
- **TypeScript** - Verificación de tipos

---

## 📦 Instalación

### Requisitos Previos
- **Node.js** 20.x o superior
- **PostgreSQL** 14.x o superior
- **npm**, **yarn**, **pnpm** o **bun**

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/zeta-dev-web/admin-territorios.git
cd admin-territorios
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
# o
bun install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/territorios_db?schema=public"

# URL de la aplicación (para autenticación)
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurar la base de datos**

Ejecuta las migraciones de Prisma para crear las tablas:

```bash
npx prisma migrate dev
```

Si necesitas datos de prueba:

```bash
npx prisma db seed
```

5. **Iniciar el servidor de desarrollo**

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🗂️ Estructura del Proyecto

```
territorios-app/
├── app/                          # App Router de Next.js
│   ├── admin/                    # Rutas de administración
│   │   ├── assignments/          # Vista de asignaciones
│   │   ├── drivers/              # Gestión de conductores
│   │   ├── groups/               # Gestión de grupos
│   │   ├── history/              # Historial de asignaciones
│   │   └── territories/          # Gestión de territorios
│   ├── dashboard/                # Dashboard de conductores
│   │   └── [territoryId]/        # Vista de territorio específico
│   ├── login/                    # Página de login
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
├── components/                   # Componentes React
│   ├── admin/                    # Componentes de administración
│   ├── auth/                     # Componentes de autenticación
│   ├── common/                   # Componentes compartidos
│   └── territories/              # Componentes de territorios
├── lib/                          # Librerías y utilidades
│   ├── auth.ts                   # Lógica de autenticación
│   ├── prisma.ts                 # Cliente de Prisma
│   └── utils.ts                  # Funciones utilitarias
├── prisma/                       # Configuración de Prisma
│   ├── migrations/               # Migraciones de BD
│   └── schema.prisma             # Esquema de la base de datos
├── server/                       # Server Actions de Next.js
├── types/                        # Tipos TypeScript compartidos
├── middleware.ts                 # Middleware de Next.js
├── .env                          # Variables de entorno (no commiteado)
├── .env.example                  # Plantilla de variables de entorno
├── next.config.ts                # Configuración de Next.js
├── tailwind.config.ts            # Configuración de Tailwind
└── tsconfig.json                 # Configuración de TypeScript
```

---

## 🎨 Capturas de Pantalla

### Panel de Territorios
Vista completa con estadísticas, creación rápida de manzanas y gestión de territorios.

### Asignaciones Activas
Seguimiento en tiempo real del progreso de conductores y asignaciones personales.

### Dashboard del Conductor
Interfaz dedicada para que los conductores registren su progreso diario por manzanas.

### Historial Completo
Registro histórico de todas las asignaciones completadas y devueltas.

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Construye la aplicación para producción
npm run start            # Inicia servidor de producción

# Utilidades
npm run lint             # Ejecuta ESLint
npx prisma studio        # Abre Prisma Studio (UI para BD)
npx prisma migrate dev   # Crea una nueva migración
npx prisma generate      # Genera el cliente de Prisma
```

---

## 🗄️ Modelo de Datos

### Entidades Principales

- **Group** - Grupos de publicadores con superintendente y auxiliar
- **Member** - Miembros de grupos (para asignaciones personales)
- **Driver** - Conductores de territorios (asignaciones con manzanas)
- **Territory** - Territorios con número, descripción y grupo asignado
- **Block** - Manzanas individuales dentro de un territorio
- **Assignment** - Asignaciones de territorios a conductores
- **PersonalAssignment** - Asignaciones de territorios a miembros
- **DailyRecord** - Registros diarios de manzanas trabajadas

Para más detalles, consulta el archivo `prisma/schema.prisma`.

---

## 🚢 Deployment

### Vercel (Recomendado)

La forma más sencilla de deployar es usando [Vercel](https://vercel.com):

1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno en el panel de Vercel
3. Asegúrate de tener una base de datos PostgreSQL (puedes usar [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com/), [Railway](https://railway.app/), etc.)
4. Deploy automático con cada push

### Otras Plataformas

- **Railway**: Soporta Next.js y PostgreSQL nativamente
- **Render**: Ofrece servicios web y bases de datos PostgreSQL
- **DigitalOcean App Platform**: Deploys containerizados
- **AWS/GCP/Azure**: Para setups más personalizados

### Variables de Entorno Requeridas

```env
DATABASE_URL=          # URL de conexión a PostgreSQL
NEXTAUTH_URL=          # URL pública de la aplicación
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si deseas contribuir:

1. **Fork** el repositorio
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guías de Contribución

- Mantén el código limpio y bien documentado
- Sigue las convenciones de TypeScript y React
- Asegúrate de que el código pase el linting (`npm run lint`)
- Actualiza la documentación si es necesario

---

## 📝 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Leo** - [zeta-dev-web](https://github.com/zeta-dev-web)

---

## 🙏 Agradecimientos

- A la comunidad de Next.js por el excelente framework
- A Vercel por la plataforma de hosting
- A Prisma por el ORM intuitivo y poderoso
- A todos los que usan y contribuyen a este proyecto

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

- Abre un [Issue](https://github.com/zeta-dev-web/admin-territorios/issues)
- Contacta al equipo de desarrollo

---

## 🗺️ Roadmap

- [ ] Exportación de reportes en PDF
- [ ] Notificaciones por correo electrónico
- [ ] Aplicación móvil nativa
- [ ] Modo offline con sincronización
- [ ] Integración con mapas geográficos
- [ ] Dashboard de estadísticas avanzadas
- [ ] Sistema de roles y permisos granulares

---

**¡Gracias por usar Admin Territorios!** 🎉
