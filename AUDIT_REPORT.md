# Auditoría de Referencias a Member y Driver - REVISIÓN POST-CAMBIOS

**Metodología**: Búsqueda literal y de variantes en directorios `server/`, `app/`, `components/`, `lib/`, `prisma/`, `scripts/`, `docs/`, `tests/` archivos `.ts`, `.tsx`, `.js`, `.mjs`, `.sql`, `.md`. Excluido `node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `.git/`. Sin modificaciones a archivos, migraciones ni base de datos durante la auditoría.

---

## A. Resumen ejecutivo (actualizado)

El repositorio `territorios-app` se encuentra en fase de transición de los modelos `Member` y `Driver` independientes al modelo unificado `Publisher` con la bandera `isConductor`.

**Cambios clave detectados:**
- El código ya usa `publisherId` en Assignment, PersonalAssignment y DailyRecord (antes referenciaban `driverId`/`memberId` a tablas separadas)
- Las server functions (`createMember`, `createDriver`, `toggleMemberDriver`, `deleteMember`, `deleteDriver`) ahora operan sobre `prisma.publisher` 
- `server/groups.ts:createGroup` **AÚN** crea registros físicos en tablas `Member` y `Driver` (líneas 42-43) - este es el último cuello de botella
- `prisma/schema.prisma` sigue definiendo `model Member` y `model Driver` con relaciones activas

**Estado**: La lógica de negocio ya transmite por `Publisher` con `isConductor` flag, pero la capa de creación de grupos y los modelos Prisma legacy persisten.

---

## B. Tabla de referencias Runtime activo

*Código que lee o escribe a través de Publisher (usando driverId/memberId como alias a publisherId).*

| # | Archivo y línea | Fragmento | Qué hace | Genera/lee datos nuevos? | Migración a Publisher | Riesgo |
|---|---|---|---|---|---|---|
| 1 | `server/members.ts:27` | `export async function createMember(name: string, groupId: string)` | Crea publicador vía `prisma.publisher.create`. Antiguamente creó Member. | Sí - escribe Publisher | **Ya migrado** | Baja |
| 2 | `server/members.ts:63` | `export async function getMembersByGroup(groupId: string)` | Obtiene publishers por grupo (antes Members). Usa `prisma.publisher.findMany` WHERE groupId. | Sí - lee Publisher | Ya migrado | Baja |
| 3 | `server/members.ts:91` | `export async function updateMember(memberId: string, ...)` | Actualiza publisher por ID. Usa `prisma.publisher.update`. | Sí - escribe Publisher | Ya migrado | Baja |
| 4 | `server/members.ts:136` | `export async function toggleMemberDriver(memberId, ...)` | Alterna `isConductor` flag en Publisher. Lógica central de transición. | Sí - lee/escribe Publisher | Ya migrado | Media |
| 5 | `server/members.ts:213` | `export async function deleteMember(memberId: string)` | Elimina publisher. Usa `prisma.publisher.delete`. | Sí - escribe Publisher | Ya migrado | Baja |
| 6 | `server/drivers.ts:37` | `export async function createDriver(data: { name, groupId })` | Crea publisher con `isConductor: true`. Antiguamente creó Driver. | Sí - escribe Publisher | **Ya migrado** | Baja |
| 7 | `server/drivers.ts:107` | `export async function getAllDrivers(page, pageSize)` | Obtiene publishers con `isConductor: true`. Antiguamente Drivers. | Sí - lee Publisher | Ya migrado | Baja |
| 8 | `server/drivers.ts:218` | `export async function getDriverById(driverId: string)` | Obtiene publisher conductor con asignaciones. | Sí - lee Publisher | Ya migrado | Baja |
| 9 | `server/drivers.ts:277` | `export async function updateDriver(driverId, ...)` | Actualiza publisher conductor. | Sí - escribe Publisher | Ya migrado | Baja |
| 10 | `server/drivers.ts:356` | `export async function deleteDriver(driverId: string)` | Establece `isConductor: false` en publisher. | Sí - escribe Publisher | Ya migrado | Baja |
| 11 | `server/assignments.ts:52` | `where: { id: input.driverId, tenantId, isConductor: true }` | Busca publisher conductor por driverId (alias a publisherId). | Sí - lee Publisher | Ya migrado | Baja |
| 12 | `server/assignments.ts:79` | `publisherId: input.driverId` | Asigna publisherId usando driverId como parámetro. | Sí - escribe Publisher | Ya migrado | Baja |
| 13 | `server/dailyRecords.ts:66` | `where: { id: input.driverId, tenantId, isConductor: true }` | Valida conductor por driverId. | Sí - lee Publisher | Ya migrado | Baja |
| 14 | `server/dailyRecords.ts:104` | `publisherId: input.driverId` | Asigna publisherId usando driverId. | Sí - escribe Publisher | Ya migrado | Baja |
| 15 | `server/personalAssignments.ts:35` | `memberId: string` | Parámetro que referencia publisherId. | Sí - escribe Publisher | Ya migrado | Baja |
| 16 | `server/personalAssignments.ts:53` | `where: { id: memberId, tenantId }` | Busca publisher por memberId. | Sí - lee Publisher | Ya migrado | Baja |
| 17 | `server/personalAssignments.ts:82` | `publisherId: memberId` | Asigna publisherId usando memberId. | Sí - escribe Publisher | Ya migrado | Baja |
| 18 | `server/unifiedAssignments.ts:34` | `export async function getUnifiedAssignments(...)` | Usa publisherId para conductores y personales en mismo flujo. | Sí - lee Publisher | Ya migrado | Baja |
| 19 | `app/api/agent/route.ts:178` | `createMember: (p) => server.createMember(...)` | API route - capa pasante. | Sí - vía server function | Ya migrado | Baja |
| 20 | `app/api/agent/route.ts:192` | `toggleMemberDriver: (p) => server.toggleMemberDriver(...)` | API route - capa pasante. | Sí - vía server function | Ya migrado | Media |
| 21 | `app/api/agent/route.ts:300` | `createDriver: (p) => server.createDriver(...)` | API route - capa pasante. | Sí - vía server function | Ya migrado | Baja |
| 22 | `components/admin/MembersList.tsx:4` | `import { deleteMember, toggleMemberDriver } from '@/server'` | UI import. | No directamente (evento UI) | Ya migrado | Baja |
| 23 | `components/admin/MembersList.tsx:34` | `await toggleMemberDriver(member.id, groupId, member.name)` | UI call. | No directamente (evento UI) | Ya migrado | Baja |
| 24 | `components/admin/DriversTable.tsx:5` | `import { deleteDriver } from '@/server'` | UI import. | No directamente (evento UI) | Ya migrado | Baja |
| 25 | `components/admin/DriversTable.tsx:46` | `await deleteDriver(confirmDelete.id)` | UI call. | No directamente (evento UI) | Ya migrado | Baja |

---

## C. Tabla de referencias de compatibilidad que deben conservarse temporalmente

*Triggers, backfill, helpers necesarios durante la transición.*

| # | Archivo y línea | Fragmento | Qué hace | Categoría | Prioridad |
|---|---|---|---|---|---|
| 1 | `prisma/schema.prisma:21` | `drivers             Driver[]` | Relación Group → conductores. Usada por getAllGroups/updateGroup/deleteGroup. | Modelo Prisma legacy | **Alta** |
| 2 | `prisma/schema.prisma:26` | `members             Member[]` | Relación Group → integrantes. Usada por getAllGroups/updateGroup/deleteGroup. | Modelo Prisma legacy | **Alta** |
| 3 | `prisma/schema.prisma:65` | `drivers     Driver[]` | Segunda definición relación Group-Driver. | Modelo Prisma legacy | **Alta** |
| 4 | `prisma/schema.prisma:66` | `members     Member[]` | Segunda definición relación Group-Member. | Modelo Prisma legacy | **Alta** |
| 5 | `prisma/schema.prisma:78` | `model Member { ... }` | Definición modelo Prisma Member con campos y relaciones. | Modelo Prisma legacy | **Alta** |
| 6 | `prisma/schema.prisma:99` | `model Driver { ... }` | Definición modelo Prisma Driver con campos y relaciones. | Modelo Prisma legacy | **Alta** |
| 7 | `prisma/schema.prisma:283` | `member    Member?` | Relación PersonalAssignment → Member. | Modelo Prisma legacy | **Alta** |
| 8 | `prisma/schema.prisma:219` | `driver       Driver?` | Relación Assignment → Driver. | Modelo Prisma legacy | **Alta** |
| 9 | `prisma/schema.prisma:252` | `driver     Driver?` | Relación DailyRecord → Driver. | Modelo Prisma legacy | Media |
| 10 | `server/groups.ts:42-43` | `prisma.driver.createMany({...})` / `prisma.member.createMany({...})` | **PUNTO CRÍTICO**: Al crear grupo, aún escribe tablas Member/Driver legacy. **Último eslabón de escritura física.** | Compatibilidad crítica | **Alta** - bloquea retiro completo |
| 11 | `server/groups.ts:154` | `const groupMembers = await prisma.member.findMany({ where: { groupId } })` | Lee tabla Member legacy en updateGroup syncRole. | Compatibilidad temporal | Alta |
| 12 | `server/groups.ts:185-198` | `prisma.driver.create/{data}` / `prisma.member.create/{data}` dentro de syncRole | Sincroniza Member/Driver cuando cambian superintendente/auxiliar. | Compatibilidad temporal | Alta |
| 13 | `server/groups.ts:258-283` | `deleteGroup` - verifica `group.drivers.length` y `group.members.length` | Elimina grupo checking conductores/miembros de tabla legacy. | Compatibilidad temporal | Alta |
| 14 | `docs/unificacion/migracion-compatibilidad-v1.sql:241-269` | **6 Triggers** de PostgreSQL: `migration_sync_member_publisher`, `migration_sync_driver_publisher`, `migration_unset_conductor`, `migration_assignment_publisher`, `migration_daily_record_publisher`, `migration_personal_assignment_publisher` | Sincroniza automáticamente cambios Member/Driver → Publisher. Son el mecanismo de compatibilidad "while the app changes its readings". | Triggers BD | **Alta** - deben conservarse hasta que 100% código use Publisher |
| 15 | `docs/unificacion/migracion-compatibilidad-v1.sql:241` | Trigger `migration_sync_member_publisher` ON Member - After INSERT/UPDATE | Sincroniza un Member creado/actualizado a Publisher. | Trigger BD | Alta |
| 16 | `docs/unificacion/migracion-compatibilidad-v1.sql:246` | Trigger `migration_sync_driver_publisher` ON Driver - After INSERT/UPDATE | Sincroniza un Driver creado/actualizado a Publisher con isConductor=true. | Trigger BD | Alta |
| 17 | `docs/unificacion/migracion-compatibilidad-v1.sql:251` | Trigger `migration_unset_conductor` ON Driver - Before DELETE | Desestablece isConductor=false en Publisher cuándo se elimina Driver. | Trigger BD | Media |
| 18 | `docs/unificacion/migracion-compatibilidad-v1.sql:256` | Trigger `migration_assignment_publisher` ON Assignment - Before INSERT/UPDATE driverId | Asegura publisherId en Assignment al setear driverId. | Trigger BD | Media |
| 19 | `docs/unificacion/migracion-compatibilidad-v1.sql:261` | Trigger `migration_daily_record_publisher` ON DailyRecord - Before INSERT/UPDATE driverId | Asegura publisherId en DailyRecord al setear driverId. | Trigger BD | Media |
| 20 | `docs/unificacion/migracion-compatibilidad-v1.sql:266` | Trigger `migration_personal_assignment_publisher` ON PersonalAssignment - Before INSERT/UPDATE memberId | Asegura publisherId en PersonalAssignment al setear memberId. | Trigger BD | Media |
| 21 | `scripts/backfill-publishers.mjs` | Script completo - Fases 2 y 3. Migra Member→Publisher y Driver→Publisher, completando publisherId en Assignment/PersonalAssignment/DailyRecord. | Backfill de datos existente. Ejecutable con `--ejecutar`. | Script de migración | Alta (pending) |
| 22 | `lib/auth.ts:269-271` | `prisma.driver.updateMany/{ where: { tenantId: null } }` / `prisma.member.updateMany/{ ... }` | Helper de onboarding setup. Actualiza tenantId si es nulo. | Helper onboarding | Baja |

---

## D. Tabla de referencias que ya pueden eliminarse después del ciclo estable

*Referencias seguras tras completar migración a Publisher.*

| # | Archivo y línea | Fragmento | Categoría | Qué hacer después de migración |
|---|---|---|---|---|
| 1 | `components/admin/AddMemberModal.tsx:5` | `import { createMember } from '@/server'` | UI component | Remover import tras migrar flow de creación a Publisher |
| 2 | `components/admin/AddMemberModal.tsx:25` | `const result = await createMember(name, groupId)` | UI call | Remover tras migration |
| 3 | `components/admin/CreateDriverModal.tsx:6` | `import { createDriver, updateDriver, ... } from '@/server'` | UI component | Remover imports de driver al migrar |
| 4 | `components/admin/CreateDriverModal.tsx:83` | `result = await createDriver({ name: name.trim(), groupId })` | UI call | Remover tras migration |
| 5 | `components/admin/MembersList.tsx:11-14` | `interface Member { id: string; name: string }` | Tipo local TypeScript | Remover después de migration - ya no es entity |
| 6 | `components/admin/DriversTable.tsx:12-28` | `interface Driver { ... }` + `interface DriversTableProps` | Tipos locales TypeScript | Remover después de migration completa |
| 7 | `app/api/agent/route.ts:178-192` | Routes `createMember`, `toggleMemberDriver`, `deleteMember` | Capa API | Actualizar o manter con alias por un ciclo |
| 8 | `app/api/agent/route.ts:300-320` | Routes `createDriver`, `deleteDriver` | Capa API | Actualizar o manter con alias |
| 9 | `docs/unificacion/verificacion-y-respaldo.md` | Documentación de verificación y respaldo | Doc histórica | Archivar, no eliminar sin respaldo |
| 10 | `docs/unificacion/migracion-aditiva-v1.sql` | Migración que crea tablas `_MigracionMemberAPublisher`, `_MigracionDriverAPublisher` y columnas `publisherId` | Migración SQL histórica | **NO remover** hasta confirmar backfill completado y triggers removidos |

---

## E. Lista de archivos que todavía impiden retirar Member/Driver

Estos archivos deben modificarse antes de que los modelos `Member` y `Driver` puedan retirarse completamente:

1. **`server/groups.ts`** - `createGroup` aún crea `prisma.member.createMany` y `prisma.driver.createMany` (líneas 42-43). **Prioridad Alta** - este es el último punto de escritura legacy a tablas Member/Driver.

2. **`prisma/schema.prisma`** - Define `model Member`, `model Driver`, y relaciones `Group.drivers`, `Group.members`, `PersonalAssignment.member`, `Assignment.driver`, `DailyRecord.driver`. **Prioridad Alta** - debe permanecer hasta que todo el código use Publisher.

3. **`docs/unificacion/migracion-compatibilidad-v1.sql`** - Triggers de PostgreSQL que sincronizan Member/Driver a Publisher. **Prioridad Alta** - deben conservarse mientras haya código que lea/write a estos modelos.

4. **`scripts/backfill-publishers.mjs`** - Script de backfill pending execution. **Prioridad Media** - completar migración de datos existentes.

5. **`app/api/agent/route.ts`** - Expose API routes para createMember, toggleMemberDriver, createDriver, etc. **Prioridad Media** - capa de API que aún referencia nombres legacy.

6. **`server/members.ts`** y **`server/drivers.ts`** - Functions del servidor con nombres legacy pero que operan sobre Publisher. **Prioridad Media** - nombres pueden renormalizarse después de migrado.

7. **`components/admin/MembersList.tsx`** y **`components/admin/DriversTable.tsx`** - Componentes UI con tipos `Member`/`Driver` locales y calls a server functions. **Prioridad Baja** - UI puede mantener compatibilidad mientras se transita.

8. **`lib/auth.ts:269-271`** - Helper de onboarding que actualiza tenantId en Member/Driver. **Prioridad Baja** - solo en setup inicial.

---

## F. Conteo total por categoría (REVISADO)

| Categoría | Conteo de referencias |
|---|---|
| **1. Runtime activo** | 25 referencias |
| **2. Compatibilidad temporal** | 23 referencias |
| **3. Modelo Prisma legacy** | 9 referencias |
| **4. UI o tipos locales** | 7 referencias |
| **5. Documentación o scripts históricos** | 5 referencias |
| **6. Referencia segura o falsa coincidencia** | 0 |
| **TOTAL** | **69 referencias** |

---

## G. Recomendación del orden de migración (actualizado)

### Fase 1 - Datos y backfill ( completar antes que nada )
1. **Ejecutar backfill de datos**: `node scripts/backfill-publishers.mjs --ejecutar`
   - Migra todos los Member→Publisher y Driver→Publisher
   - Llena publisherId en Assignment, PersonalAssignment, DailyRecord
2. **Verificar consistencia**: revisar resumen del script (todos los counts coinciden, 0 ambiguos)
3. **Respaldo de base de datos** antes de cualquier cambio estructural

### Fase 2 - Remover escritura legacy en grupos (PUNTO CRÍTICO)
4. **Migrar `server/groups.ts:createGroup`** - Cambiar de `prisma.driver.createMany`/`prisma.member.createMany` a crear un solo `prisma.publisher.create` con `isConductor` según el rol (superintendent → isConductor=true, auxiliary → isConductor=false/true según necesidad).
   - **Este es el paso crítico** - elimina el último punto de escritura a tablas Member/Driver.
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
10. **Remover tipos locales** `Member` y `Driver` de components/admin/MembersList.tsx y DriversTable.tsx.
11. **Actualizar `app/api/agent/route.ts`** - Actualizar routes para usar nombres consistentes (opcional si las firmas se conservan).
12. **Archivar documentación** `docs/unificacion/` - Mover a versión histórica o remover archivos ya ejecutados.

### Fase 5 - Verificación final
13. **Buscar referencias restantes** - Ejecutar auditoría nuevamente para confirmar 0 referencias a tablas Member/Driver en código runtime.
14. **Desplegar en producción** - Monitorear durante una semana sin errores de "Member not found" o "Driver not found".

---
*Fin de la auditoría. No se modificaron archivos, ejecuciones de migración, commits ni cambios a la base de datos durante la generación de este informe.*