-- MIGRACION DE VALIDACION v1
-- Ejecutar solamente despues de completar y verificar el backfill.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_MigracionMemberAPublisher_publisherId_fkey'
  ) THEN
    ALTER TABLE "_MigracionMemberAPublisher"
      ADD CONSTRAINT "_MigracionMemberAPublisher_publisherId_fkey"
      FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id")
      ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_MigracionDriverAPublisher_publisherId_fkey'
  ) THEN
    ALTER TABLE "_MigracionDriverAPublisher"
      ADD CONSTRAINT "_MigracionDriverAPublisher_publisherId_fkey"
      FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id")
      ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PersonalAssignment_publisherId_fkey'
  ) THEN
    ALTER TABLE "PersonalAssignment"
      ADD CONSTRAINT "PersonalAssignment_publisherId_fkey"
      FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id")
      ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Assignment_publisherId_fkey'
  ) THEN
    ALTER TABLE "Assignment"
      ADD CONSTRAINT "Assignment_publisherId_fkey"
      FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id")
      ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'DailyRecord_publisherId_fkey'
  ) THEN
    ALTER TABLE "DailyRecord"
      ADD CONSTRAINT "DailyRecord_publisherId_fkey"
      FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id")
      ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;

ALTER TABLE "_MigracionMemberAPublisher"
  VALIDATE CONSTRAINT "_MigracionMemberAPublisher_publisherId_fkey";
ALTER TABLE "_MigracionDriverAPublisher"
  VALIDATE CONSTRAINT "_MigracionDriverAPublisher_publisherId_fkey";
ALTER TABLE "PersonalAssignment"
  VALIDATE CONSTRAINT "PersonalAssignment_publisherId_fkey";
ALTER TABLE "Assignment"
  VALIDATE CONSTRAINT "Assignment_publisherId_fkey";
ALTER TABLE "DailyRecord"
  VALIDATE CONSTRAINT "DailyRecord_publisherId_fkey";

COMMIT;
