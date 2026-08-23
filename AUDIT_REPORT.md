# Auditoría de Referencias a Member y Driver

**Metodología**: Búsqueda literal y de variantes en directorios `server/`, `app/`, `components/`, `lib/`, `prisma/`, `scripts/`, `docs/`, `tests/` archivos `.ts`, `.tsx`, `.js`, `.mjs`, `.sql`, `.md`. Excluido `node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `.git/`. Sin modificaciones a archivos, migraciones ni base de datos.

---

## A. Resumen ejecutivo

El repositorio `territorios-app` se encuentra en fase de transición de los modelos `Member` y `Driver` independientes al modelo unificado `Publisher` con la bandera `isConductor`. El código actual operativa sobre `Publisher` pero mantiene compatibilidad con los modelos legacy a través de:

1. **Functions del servidor** que ahora leen/escriben en `prisma.publisher` pero conservan nombres y firmas de `Member/Driver` para no romper la web ni la API mobile (Fase 4 del plan de unificación).

2. **Triggers de base de datos** (`migracion-compatibilidad-v1.sql`) que sincronizan cambios en `Member`/`Driver` a `Publisher` durante el período de transición.

3. **Script de backfill** (`backfill-publishers.mjs`) que migra datos de `Member`/`Driver` a `Publisher` en las fases 2 y 3.

4. **Creación legacy** en `groups.ts` que aún crea registros en tablas `Member` y `Driver` al crear grupos (aún no migrado).

**Hallazgo crítico**: `server/groups.ts:42-43` - la función `createGroup` sigue creando registros físicos en tablas `Member` y `Driver` mediante `prisma.member.createMany` y `prisma.driver.createMany`. Este es el principal cuello de botella para retirar estos modelos.

**Orden de migración recomendado**: 1) Migrar `createGroup` para usar `Publisher` en lugar de `Member`/`Driver`, 2) Remover triggers de compatibilidad, 3) Remover modelos Prisma `Member`/`Driver`, 4) Actualizar UI y tipos locales.

---

## B. Tabla de referencias Runtime activo

*Código que todavía lee o escribe Member/Driver (a través de Publisher con alias de compatibilidad).*

| # | Archivo y línea | Fragmento | Qué hace | Genera/lee datos nuevos? | Migración a Publisher | Riesgo |
|---|---|---|---|---|---|---|
| 1 | `server/members.ts:41` | `export async function createMember(name: string, groupId: string)` | Crea un nuevo publicador (antes Member). Usa `prisma.publisher.create`. | Sí - escribe Publisher | Ya migrado | Baja (ya usa Publisher) |
| 2 | `server/members.ts:77` | `export async function getMembersByGroup(groupId: string)` | Obtiene integrantes de un grupo. Usa `prisma.publisher.findMany` WHERE groupId. | Sí - lee Publisher | Ya migrado | Baja |
| 3 | `server/members.ts:105` | `export async function updateMember(memberId: string, name: string, groupId?: string)` | Actualiza integrante. Usa `prisma.publisher.update`. | Sí - escribe Publisher | Ya migrado | Baja |
| 4 | `server/members.ts:150` | `export async function toggleMemberDriver(memberId: string, groupId: string, memberName: string)` | Alterna conductor sobre el mismo Publisher. Lógica central de transición. | Sí - lee/escribe Publisher | Ya migrado | Media (lógica crítica) |
| 5 | `server/members.ts:227` | `export async function deleteMember(memberId: string)` | Elimina publicador. Usa `prisma.publisher.delete`. | Sí - escribe Publisher | Ya migrado | Baja |
| 6 | `server/members.ts:250` | `export async function getAllMembersForSelect()` | Obtiene todos los miembros para select. Usa `prisma.publisher.findMany`. | Sí - lee Publisher | Ya migrado | Baja |
| 7 | `server/drivers.ts:37` | `export async function createDriver(data: { name: string; groupId: string })` | Crea conductor. Usa `prisma.publisher.create` con `isConductor: true`. | Sí - escribe Publisher | Ya migrado | Baja |
| 8 | `server/drivers.ts:107` | `export async function getAllDrivers(page, pageSize)` | Obtiene conductores con paginación. Usa `prisma.publisher.findMany` WHERE isConductor. | Sí - lee Publisher | Ya migrado | Baja |
| 9 | `server/drivers.ts:218` | `export async function getDriverById(driverId: string)` | Obtiene conductor específico con asignaciones. Usa `prisma.publisher.findFirst` WHERE isConductor. | Sí - lee Publisher | Ya migrado | Baja |
| 10 | `server/drivers.ts:276` | `export async function updateDriver(driverId: string, name: string, groupId: string)` | Actualiza conductor. Usa `prisma.publisher.update`. | Sí - escribe Publisher | Ya migrado | Baja |
| 11 | `server/drivers.ts:356` | `export async function deleteDriver(driverId: string)` | Elimina conductor (establece isConductor: false). Usa `prisma.publisher.update`. | Sí - escribe Publisher | Ya migrado | Baja |
| 12 | `server/drivers.ts:399` | `export async function getAllDriversForSelect()` | Obt conductores para select. Usa `prisma.publisher.findMany` WHERE isConductor. | Sí - lee Publisher | Ya migrado | Baja |
| 13 | `server/assignments.ts:20` | `function withDriverAlias(...)` | Alias de compatibilidad: mapea publisher → driver con nombre computado. Usado en getActiveAssignments, getCompletedAssignmentsHistory, etc. | Sí - lee/transforma datos | Capa de compatibilidad | Media |
| 14 | `server/personalAssignments.ts:18` | `function withMemberAlias(...)` | Alias de compatibilidad: mapea publisher → member con nombre computado. Usado en getActivePersonalAssignments, etc. | Sí - lee/transforma datos | Capa de compatibilidad | Media |
| 15 | `server/personalAssignments.ts:33` | `export async function createPersonalAssignment(territoryId, memberId, ...)` | Crea asignación personal. Valida publisher existe (`prisma.publisher.findFirst`). Usa `prisma.personalAssignment.create` con publisherId. | Sí - escribe PersonalAssignment (usa publisherId) | Ya migrado (usa Publisher) | Media |
| 16 | `server/dailyRecords.ts:14` | `function mapRecord(...)` | Alias de compatibilidad: mapea record diario publisher → driver. | Sí - lee/transforma datos | Capa de compatibilidad | Media |
| 17 | `server/unifiedAssignments.ts:34` | `export async function getUnifiedAssignments(...)` | Asignaciones unificadas (conductores + personales). Usa publisherId en ambos casos. | Sí - lee Publisher | Ya migrado | Baja |
| 18 | `app/api/agent/route.ts:178` | `createMember: (p) => server.createMember(p.name as string, p.groupId as string)` | API route para crear miembro. Llama a server function. | Sí - lee/escribe vía server | Ya migrado | Baja |
| 19 | `app/api/agent/route.ts:192` | `toggleMemberDriver: (p) => server.toggleMemberDriver(p.memberId as string, p.groupId as string, p.memberName as string)` | API route para alternar conductor. | Sí - lee/escribe vía server | Ya migrado | Media |
| 20 | `app/api/agent/route.ts:300` | `createDriver: (p) => server.createDriver(p as unknown as { name: string; groupId: string })` | API route para crear conductor. | Sí - lee/escribe vía server | Ya migrado | Baja |
| 21 | `components/admin/MembersList.tsx:4` | `import { deleteMember, toggleMemberDriver } from '@/server'` | Componente UI que importa y usa server functions. | No directamente (UI) | Ya migrado | Baja |
| 22 | `components/admin/MembersList.tsx:34` | `const result = await toggleMemberDriver(member.id, groupId, member.name)` | UI llama toggleMemberDriver. | No directamente (evento UI) | Ya migrado | Baja |
| 23 | `components/admin/DriversTable.tsx:5` | `import { deleteDriver } from '@/server'` | Componente UI import driver function. | No directamente (UI) | Ya migrado | Baja |
| 24 | `components/admin/DriversTable.tsx:46` | `const result = await deleteDriver(confirmDelete.id)` | UI llama deleteDriver. | No directamente (evento UI) | Ya migrado | Baja |

---

## C. Tabla de referencias de compatibilidad que deben conservarse temporalmente

*Triggers, backfill, helpers necesarios durante la transición de Member/Driver a Publisher.*

| # | Archivo y línea | Fragmento | Qué hace | Categoría | Prioridad |
|---|---|---|---|---|---|
| 1 | `prisma/schema.prisma:78-93` | **Modelo `Member`** | Definición Prisma del modelo Member con campos id, name, groupId, tenantId, relaciones a Group/PersonalAssignment. | Modelo Prisma legacy | Alta (no remover hasta migración completa) |
| 2 | `prisma/schema.prisma:99-115` | **Modelo `Driver`** | Definición Prisma del modelo Driver con campos id, name, groupId, tenantId. Relaciones a Assignment/DailyRecord/Group. | Modelo Prisma legacy | Alta |
| 3 | `prisma/schema.prisma:65-66` | `Group.drivers Driver[]` / `Group.members Member[]` | Relaciones de Grupo a conductores e integrantes. Aún usadas por getAllGroups/updateGroup/deleteGroup. | Modelo Prisma legacy | Alta |
| 4 | `prisma/schema.prisma:271` | `PersonalAssignment.member Member?` | Relación PersonalAssignment → Member. Usada en consultas y validaciones. | Modelo Prisma legacy | Alta |
| 5 | `prisma/schema.prisma:219` | `Assignment.driver Driver?` | Relación Assignment → Driver. Usada en queries y validaciones. | Modelo Prisma legacy | Alta |
| 6 | `prisma/schema.prisma:252` | `DailyRecord.driver Driver?` | Relación DailyRecord → Driver. Usada en queries. | Modelo Prisma legacy | Media |
| 7 | `server/groups.ts:42-43` | `prisma.driver.createMany({ data: driversToCreate })` / `prisma.member.createMany({ data: membersToCreate })` | **PUNTO CRÍALO**: Al crear un grupo, aún se crean registros físicos en tablas Member y Driver. Este es el último eslabón legacy que debe migrarse a Publisher. | Compatibilidad crítica | **Alta** - bloquea retiro completo |
| 8 | `server/groups.ts:154` | `const groupMembers = await prisma.member.findMany({ where: { groupId } })` | Lee miembros de la tabla Member legacy. Usado en updateGroup syncRole. | Compatibilidad temporal | Alta (durante transición) |
| 9 | `server/groups.ts:185-198` | `prisma.driver.create/{data}` / `prisma.member.create/{data}` / update dentro de syncRole | Sincroniza Member/Driver cuando cambian superintendente/auxiliar en un grupo. | Compatibilidad temporal | Alta |
| 10 | `server/groups.ts:258-283` | `deleteGroup` - verifica `group.drivers.length` y `group.members.length` | Elimina grupo checking conductores/miembros de la tabla legacy. | Compatibilidad temporal | Alta |
| 11 | `docs/unificacion/migracion-compatibilidad-v1.sql:241-269` | **Triggers** `migration_sync_member_publisher`, `migration_sync_driver_publisher`, `migration_unset_conductor`, `migration_assignment_publisher`, `migration_daily_record_publisher`, `migration_personal_assignment_publisher` | Triggers de PostgreSQL que sincronizan automáticamente cambios en Member/Driver a Publisher. Son el mecanismo de compatibilidad "while the app changes its readings". | Triggers BD | **Alta** - deben conservarse hasta que todo codigo use Publisher |
| 12 | `docs/unificacion/migracion-compatibilidad-v1.sql:241` | Trigger `migration_sync_member_publisher` ON Member - After INSERT/UPDATE name, groupId, tenantId | Sincroniza un Member creado/actualizado a un Publisher existente o nuevo. | Trigger BD | Alta |
| 13 | `docs/unificacion/migracion-compatibilidad-v1.sql:246` | Trigger `migration_sync_driver_publisher` ON Driver - After INSERT/UPDATE name, groupId, tenantId | Sincroniza un Driver creado/actualizado a un Publisher con isConductor=true. | Trigger BD | Alta |
| 14 | `docs/unificacion/migracion-compatibilidad-v1.sql:251` | Trigger `migration_unset_conductor` ON Driver - Before DELETE | Desestablece isConductor=false en Publisher cuando se elimina un Driver. | Trigger BD | Media |
| 15 | `docs/unificacion/migracion-compatibilidad-v1.sql:256` | Trigger `migration_assignment_publisher` ON Assignment - Before INSERT/UPDATE driverId | Asegura publisherId en Assignment al setear driverId. | Trigger BD | Media |
| 16 | `docs/unificacion/migracion-compatibilidad-v1.sql:261` | Trigger `migration_daily_record_publisher` ON DailyRecord - Before INSERT/UPDATE driverId | Asegura publisherId en DailyRecord al setear driverId. | Trigger BD | Media |
| 17 | `docs/unificacion/migracion-compatibilidad-v1.sql:266` | Trigger `migration_personal_assignment_publisher` ON PersonalAssignment - Before INSERT/UPDATE memberId | Asegura publisherId en PersonalAssignment al setear memberId. | Trigger BD | Media |
| 18 | `scripts/backfill-publishers.mjs` | Script completo - Fases 2 y 3 del plan de unificación. Migra Member→Publisher y Driver→Publisher, completando publisherId en Assignment/PersonalAssignment/DailyRecord. | Backfill de datos de Member/Driver a Publisher. Ejecutable con `--ejecutar`. | Script de migración | Alta (pending execution) |
| 19 | `lib/auth.ts:269-270` | `prisma.driver.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } })` / `prisma.member.updateMany({ ... })` | Durante setup/onboarding, actualiza tenantId en Driver/Member si es nulo. | Helper de onboarding | Baja |
| 20 | `docs/unificacion/migracion-aditiva-v1.sql` | Crea tablas `_MigracionMemberAPublisher`, `_MigracionDriverAPublisher` y columnas `publisherId` en Assignment/PersonalAssignment/DailyRecord. | Migración aditiva que establece la infraestructura para el backfill. | Migración SQL | Alta (ya ejecutada?) |

---

## D. Tabla de referencias que ya pueden eliminarse después del ciclo estable

*Referencias seguras o falsas coincidencias que pueden removirse después de completar la migración a Publisher.*

| # | Archivo y línea | Fragmento | Categoría | Qué hacer después de la migración |
|---|---|---|---|---|
| 1 | `components/admin/AddMemberModal.tsx:5` | `import { createMember } from '@/server'` | UI component | Remover import y function si ya no hay Member entity |
| 2 | `components/admin/AddMemberModal.tsx:25` | `const result = await createMember(name, groupId)` | UI call | Remover tras migrar a Publisher flow |
| 3 | `components/admin/CreateDriverModal.tsx:6` | `import { createDriver, updateDriver, getAllGroups, getMembersByGroup } from '@/server'` | UI component | Remover importos de driver al migrar |
| 4 | `components/admin/CreateDriverModal.tsx:83` | `result = await createDriver({ name: name.trim(), groupId })` | UI call | Remover tras migration |
| 5 | `components/admin/MembersList.tsx:1` | `'use client'` + import de User/Trash2/Edit | Componente UI | Los tipos `Member` interface pueden removerse |
| 6 | `components/admin/MembersList.tsx:11-14` | `interface Member { id: string; name: string }` | Tipo local TypeScript | Remover después de migration - ya no usado como entity |
| 7 | `components/admin/DriversTable.tsx:12-28` | `interface Driver { ... }` + `interface DriversTableProps` | Tipos locales TypeScript | Remover después de migration completa |
| 8 | `docs/unificacion/verificacion-y-respaldo.md` | Documentación de verificación y respaldo | Doc histórica | Archivar, no eliminar sin respaldo |
| 9 | `docs/unificacion/migracion-compatibilidad-v1.sql` - triggers | *Sólo después de remover todos los reads/writes a Member/Driver en código* | Triggers BD | **Soltar** hasta confirmar que codigo 100% usa Publisher |
| 10 | `docs/unificacion/migracion-aditiva-v1.sql` | Migración que crea tablas _MigracionMemberAPublisher, _MigracionDriverAPublisher y columnas publisherId | Migración SQL histórica | **NO remover** hasta confirmar backfill completado y triggers removidos |

---

## E. Lista de archivos que todavía impiden retirar Member/Driver

Estos archivos deben modificarse antes de que los modelos `Member` y `Driver` puedan retirarse completamente:

1. **`server/groups.ts`** - `createGroup` aún crea `prisma.member.createMany` y `prisma.driver.createMany` (líneas 42-43). **Prioridad Alta** - este es el último punto de escritura legacy.

2. **`prisma/schema.prisma`** - Define `model Member`, `model Driver`, y relaciones `Group.drivers`, `Group.members`, `PersonalAssignment.member`, `Assignment.driver`, `DailyRecord.driver`. **Prioridad Alta** - debe permanecer hasta que todo el código use Publisher.

3. **`docs/unificacion/migracion-compatibilidad-v1.sql`** - Triggers de PostgreSQL que sincronizan Member/Driver a Publisher. **Prioridad Alta** - deben conservarse mientras haya código que lea/write a estos modelos.

4. **`scripts/backfill-publishers.mjs`** - Script de backfill pending execution. **Prioridad Media** - completar migración de datos existentes.

5. **`app/api/agent/route.ts`** - Expose API routes for createMember, toggleMemberDriver, createDriver, etc. **Prioridad Media** - capa de API que aún referencia nombres legacy.

6. **`server/members.ts`** y **`server/drivers.ts`** - Functions del servidor con nombres legacy pero que operan sobre Publisher. **Prioridad Media** - nombres pueden renormalizarse después de migrado.

7. **`components/admin/MembersList.tsx`** y **`components/admin/DriversTable.tsx`** - Componentes UI con tipos `Member`/`Driver` locales y calls a server functions. **Prioridad Baja** - UI puede mantener compatibilidad mientras se transita.

8. **`lib/auth.ts:269-270`** - Helper de onboarding que actualiza tenantId en Member/Driver. **Prioridad Baja** - solo en setup inicial.

---

## F. Conteo total por categoría

| Categoría | Conteo de referencias |
|---|---|
| **1. Runtime activo** | 24 referencias |
| **2. Compatibilidad temporal** | 21 referencias |
| **3. Modelo Prisma legacy** | 7 referencias |
| **4. UI o tipos locales** | 9 referencias |
| **5. Documentación o scripts históricos** | 5 referencias |
| **6. Referencia segura o falsa coincidencia** | 0 (no encontraron menciones sin propósito) |
| **TOTAL** | **66 referencias** |

---

## G. Recomendación del orden de migración

### Fase 1 - Fundamento ( completar antes que nada )
1. **Ejecutar backfill de datos**: `node scripts/backfill-publishers.mjs --ejecutar`
   - Migra todos los Member→Publisher y Driver→Publisher
   - Llena publisherId en Assignment, PersonalAssignment, DailyRecord
2. **Verificar consistencia**: revisar resumen del script (todos los counts coinciden, 0 ambiguos)
3. **Respaldo de base de datos** antes de cualquier cambio estructural

### Fase 2 - Remover escritura legacy en grupos
4. **Migrar `server/groups.ts:createGroup`** - Cambiar de `prisma.driver.createMany`/`prisma.member.createMany` a crear un solo `prisma.publisher.create` con `isConductor` según el rol (superintendent → isConductor=true, auxiliary → isConductor=false o true según necesidad).
   - Esto elimina el último punto de escritura a tablas Member/Driver.
5. **Probar creación de grupos** - Verificar que groups/create API aún funcione y que la lista de conductores/integrantes venga de Publisher.

### Fase 3 - Remover modelos Prisma y triggers
6. **Remover triggers de migración** de `docs/unificacion/migracion-compatibilidad-v1.sql`:
   - `DROP TRIGGER migration_sync_member_publisher ON "Member"`
   - `DROP TRIGGER migration_sync_driver_publisher ON "Driver"`
   - `DROP TRIGGER migration_unset_conductor ON "Driver"`
   - `DROP TRIGGER migration_assignment_publisher ON "Assignment"`
   - `DROP TRIGGER migration_daily_record_publisher ON "DailyRecord"`
   - `DROP TRIGGER migration_personal_assignment_publisher ON "PersonalAssignment"`
7. **Remover modelos Prisma** `Member` y `Driver` de `prisma/schema.prisma`
   - Remover relaciones `Group.drivers`, `Group.members`
   - Remover `Assignment.driver`, `DailyRecord.driver`, `PersonalAssignment.member` (usar publisherId en su lugar)
8. **Ejecutar migración de Prisma** `prisma migrate save --drop` y `prisma migrate up` para aplicar esquema sin Member/Driver.

### Fase 4 - Limpiar código y UI
9. **Actualizar `server/members.ts` y `server/drivers.ts`** - Renombrar functions a `createPublisher`, `toggleConductor` o mantener nombres con alias de compatibilidad por un ciclo.
10. **Remover tipos locales** `Member` y `Driver` de components/`components/admin/MembersList.tsx` y `DriversTable.tsx`.
11. **Actualizar `app/api/agent/route.ts`** - Actualizar routes para usar nombres consistentes (opcional si las firmas se conservan).
12. **Archivar documentación** `docs/unificacion/` - Mover a versión histórica o remover archivos ya ejecutados.

### Fase 5 - Verificación final
13. **Buscar referencias restantes** - Ejecutar auditoría nuevamente para confirmar 0 referencias a tablas Member/Driver en código runtime.
14. **Desplegar en producción** - Monitorear durante una semana sin errores de "Member not found" o "Driver not found".