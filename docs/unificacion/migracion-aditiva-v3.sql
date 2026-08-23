-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN ADITIVA v3 — Alinea tabla Publisher con el esquema
-- unificado completo (campos de VYMC: contacto, nombramientos).
-- Aditiva y reversible (DROP COLUMN por columna si hiciera falta).
-- ═══════════════════════════════════════════════════════════════
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- El enum Gender puede no existir en esta base (es de VYMC)
DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "gender" "Gender";
ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "isBaptized" BOOLEAN;
ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "isElder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "isMinisterialServant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "isPioneer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Publisher" ADD COLUMN IF NOT EXISTS "lastAssignedAt" TIMESTAMP(3);

COMMIT;
