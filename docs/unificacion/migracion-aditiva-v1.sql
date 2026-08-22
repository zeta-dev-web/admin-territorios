-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN ADITIVA v1 — Fase 1 del plan de unificación
-- ═══════════════════════════════════════════════════════════════════
--
-- PROPUESTA REVISABLE. No ejecutar en producción sin antes:
--   1. Aprobar el esquema propuesto (esquema-propuesto.prisma).
--   2. Probarla sobre una copia restaurada (ver verificacion-y-respaldo.md).
--   3. Correr el diagnóstico ANTES y DESPUÉS.
--
-- Qué hace (solo aditivo, reversible):
--   1. Crea la tabla "Publisher" (firstName + lastName, isConductor).
--   2. Crea tablas auxiliares de correspondencias member/driver → publisher.
--   3. Agrega columnas publisherId NULLABLE a PersonalAssignment,
--      Assignment y DailyRecord (las columnas memberId/driverId siguen intactas).
--   4. Crea índices para cada clave foránea nueva.
--
-- Qué NO hace:
--   - No elimina ni renombra tablas o columnas existentes.
--   - No migra datos (eso es el backfill del Despliegue B).
--   - No agrega aún las foreign keys definitivas: se agregan NOT VALID
--     después del backfill y se validan aparte (patrón expand→migrate).
--
BEGIN;

-- Timeouts conservadores para no bloquear la aplicación
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ── 1. Publisher ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Publisher" (
    "id"          TEXT        NOT NULL PRIMARY KEY,   -- cuid generado por la app/script
    "firstName"   TEXT        NOT NULL,
    "lastName"    TEXT        NOT NULL,
    "isConductor" BOOLEAN     NOT NULL DEFAULT false,
    -- Género pendiente de decisión: Territorios no tiene ese dato hoy.
    -- Se agregará como columna nullable en una migración siguiente.
    "groupId"     TEXT        NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
    "tenantId"    TEXT        REFERENCES "Tenant"("id") ON DELETE CASCADE,
    -- Nota: al unificar con VYMC, tenantId se renombrará a congregationId
    -- en una migración posterior (Despliegue D), conservando los IDs.
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Publisher_tenantId_idx"              ON "Publisher"("tenantId");
CREATE INDEX IF NOT EXISTS "Publisher_groupId_idx"               ON "Publisher"("groupId");
CREATE INDEX IF NOT EXISTS "Publisher_tenantId_groupId_idx"      ON "Publisher"("tenantId", "groupId");
CREATE INDEX IF NOT EXISTS "Publisher_tenantId_isConductor_idx"  ON "Publisher"("tenantId", "isConductor");

-- ── 2. Tablas auxiliares de correspondencias ───────────────────────
-- Permiten reanudar el backfill sin duplicar publicadores y trazan
-- cada correspondencia memberId/driverId → publisherId.
CREATE TABLE IF NOT EXISTS "_MigracionMemberAPublisher" (
    "memberId"    TEXT NOT NULL PRIMARY KEY REFERENCES "Member"("id") ON DELETE CASCADE,
    "publisherId" TEXT NOT NULL,
    "migradoEn"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "_MigracionDriverAPublisher" (
    "driverId"    TEXT NOT NULL PRIMARY KEY REFERENCES "Driver"("id") ON DELETE CASCADE,
    "publisherId" TEXT NOT NULL,
    "estrategia"  TEXT NOT NULL DEFAULT 'auto', -- auto | manual | nuevo
    "migradoEn"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "_MigracionMemberAPublisher_publisherId_idx"
    ON "_MigracionMemberAPublisher"("publisherId");
CREATE INDEX IF NOT EXISTS "_MigracionDriverAPublisher_publisherId_idx"
    ON "_MigracionDriverAPublisher"("publisherId");

-- ── 3. Columnas publisherId (nullable, compatibles con la versión publicada)
ALTER TABLE "PersonalAssignment" ADD COLUMN IF NOT EXISTS "publisherId" TEXT;
ALTER TABLE "Assignment"         ADD COLUMN IF NOT EXISTS "publisherId" TEXT;
ALTER TABLE "DailyRecord"        ADD COLUMN IF NOT EXISTS "publisherId" TEXT;

-- ── 4. Índices para las claves foráneas nuevas ─────────────────────
CREATE INDEX IF NOT EXISTS "PersonalAssignment_publisherId_idx"
    ON "PersonalAssignment"("publisherId");
CREATE INDEX IF NOT EXISTS "Assignment_publisherId_idx"
    ON "Assignment"("publisherId");
CREATE INDEX IF NOT EXISTS "DailyRecord_publisherId_idx"
    ON "DailyRecord"("publisherId");

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- POSTERIOR AL BACKFILL (Despliegue B/C) — NO ejecutar ahora:
--
-- Validar referencias una vez que todas las filas tengan publisherId:
--
--   ALTER TABLE "PersonalAssignment"
--     ADD CONSTRAINT "PersonalAssignment_publisherId_fkey"
--     FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") NOT VALID;
--   ALTER TABLE "PersonalAssignment"
--     VALIDATE CONSTRAINT "PersonalAssignment_publisherId_fkey";
--
--   (ídem Assignment y DailyRecord; VALIDATE es rápido y solo toma
--    un lock débil compartido)
--
-- REVERSIÓN DE ESTA MIGRACIÓN (si hiciera falta):
--
--   DROP INDEX IF EXISTS "DailyRecord_publisherId_idx";
--   DROP INDEX IF EXISTS "Assignment_publisherId_idx";
--   DROP INDEX IF EXISTS "PersonalAssignment_publisherId_idx";
--   ALTER TABLE "DailyRecord"        DROP COLUMN IF EXISTS "publisherId";
--   ALTER TABLE "Assignment"         DROP COLUMN IF EXISTS "publisherId";
--   ALTER TABLE "PersonalAssignment" DROP COLUMN IF EXISTS "publisherId";
--   DROP TABLE IF EXISTS "_MigracionDriverAPublisher";
--   DROP TABLE IF EXISTS "_MigracionMemberAPublisher";
--   DROP TABLE IF EXISTS "Publisher";
-- ═══════════════════════════════════════════════════════════════════
