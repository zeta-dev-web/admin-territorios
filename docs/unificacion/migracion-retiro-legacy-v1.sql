-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN DE RETIRO — PASO 5 (DESTRUCTIVA)
-- Elimina el modelo legacy Member/Driver y toda su maquinaria.
--
-- PRECONDICIONES OBLIGATORIAS (en este orden):
--   1. Respaldo completo: pg_dump "$DATABASE_URL" -Fc -f respaldo-pre-retiro.dump
--   2. Export de tablas a retirar (conservar según política):
--      pg_dump "$DATABASE_URL" -Fc \
--        -t '"Member"' -t '"Driver"' \
--        -t '"_MigracionMemberAPublisher"' -t '"_MigracionDriverAPublisher"' \
--        -f legacy-member-driver-export.dump
--   3. Verificar que el código desplegado NO usa Member/Driver
--      (esta versión ya cumple).
--   4. Correr las verificaciones de conteos (verificacion-y-respaldo.md §4).
-- ═══════════════════════════════════════════════════════════════
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '300s';

-- 1. Triggers y funciones de compatibilidad
DROP TRIGGER IF EXISTS "migration_sync_member_publisher" ON "Member";
DROP TRIGGER IF EXISTS "migration_sync_driver_publisher" ON "Driver";
DROP TRIGGER IF EXISTS "migration_unset_conductor" ON "Driver";
DROP TRIGGER IF EXISTS "migration_assignment_publisher" ON "Assignment";
DROP TRIGGER IF EXISTS "migration_daily_record_publisher" ON "DailyRecord";
DROP TRIGGER IF EXISTS "migration_personal_assignment_publisher" ON "PersonalAssignment";
DROP FUNCTION IF EXISTS "_migration_sync_member_publisher"();
DROP FUNCTION IF EXISTS "_migration_sync_driver_publisher"();
DROP FUNCTION IF EXISTS "_migration_unset_conductor"();
DROP FUNCTION IF EXISTS "_migration_assignment_publisher"();
DROP FUNCTION IF EXISTS "_migration_daily_record_publisher"();
DROP FUNCTION IF EXISTS "_migration_personal_assignment_publisher"();

-- 2. Columnas legadas en tablas territoriales
ALTER TABLE "Assignment"         DROP COLUMN IF EXISTS "driverId";
ALTER TABLE "DailyRecord"        DROP COLUMN IF EXISTS "driverId";
ALTER TABLE "PersonalAssignment" DROP COLUMN IF EXISTS "memberId";

-- 3. Tablas auxiliares de correspondencias
DROP TABLE IF EXISTS "_MigracionMemberAPublisher";
DROP TABLE IF EXISTS "_MigracionDriverAPublisher";

-- 4. Tablas legacy
DROP TABLE IF EXISTS "Driver";
DROP TABLE IF EXISTS "Member";

COMMIT;

-- REVERSIÓN: restaurar desde respaldo-pre-retiro.dump o desde el export
-- de tablas legacy + recrear columnas con migracion-aditiva-v1/v2.
