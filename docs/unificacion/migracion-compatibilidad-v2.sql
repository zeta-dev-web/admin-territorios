-- COMPATIBILIDAD v2
-- Permite que el codigo nuevo escriba solo publisherId.
-- Los IDs legacy se completan unicamente cuando vienen informados.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE OR REPLACE FUNCTION "_migration_assignment_publisher"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."publisherId" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."driverId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT x."publisherId"
  INTO NEW."publisherId"
  FROM "_MigracionDriverAPublisher" x
  WHERE x."driverId" = NEW."driverId";

  IF NEW."publisherId" IS NULL THEN
    RAISE EXCEPTION 'Driver % no tiene Publisher asociado', NEW."driverId";
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "_migration_daily_record_publisher"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."publisherId" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."driverId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT x."publisherId"
  INTO NEW."publisherId"
  FROM "_MigracionDriverAPublisher" x
  WHERE x."driverId" = NEW."driverId";

  IF NEW."publisherId" IS NULL THEN
    RAISE EXCEPTION 'Driver % no tiene Publisher asociado', NEW."driverId";
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "_migration_personal_assignment_publisher"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."publisherId" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."memberId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT x."publisherId"
  INTO NEW."publisherId"
  FROM "_MigracionMemberAPublisher" x
  WHERE x."memberId" = NEW."memberId";

  IF NEW."publisherId" IS NULL THEN
    RAISE EXCEPTION 'Member % no tiene Publisher asociado', NEW."memberId";
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
