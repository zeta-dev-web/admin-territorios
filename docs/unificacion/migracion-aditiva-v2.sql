-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN ADITIVA v2 — Fase 4 (corte de escritura al modelo nuevo)
-- Hace nullable las FK legadas para que el código nuevo pueda escribir
-- únicamente publisherId. No modifica datos. Reversible con SET NOT NULL
-- una vez validado que no queden nulos (Despliegue D).
-- ═══════════════════════════════════════════════════════════════
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE "Assignment"         ALTER COLUMN "driverId" DROP NOT NULL;
ALTER TABLE "DailyRecord"        ALTER COLUMN "driverId" DROP NOT NULL;
ALTER TABLE "PersonalAssignment" ALTER COLUMN "memberId" DROP NOT NULL;

COMMIT;
