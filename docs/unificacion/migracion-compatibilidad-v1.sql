-- COMPATIBILIDAD TEMPORAL MEMBER/DRIVER -> PUBLISHER
-- Mantiene sincronizada la aplicacion actual hasta completar el cambio de codigo.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE OR REPLACE FUNCTION "_migration_normalize_name"(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT translate(
    lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g')),
    'áéíóúüñ',
    'aeiouun'
  );
$$;

CREATE OR REPLACE FUNCTION "_migration_sync_member_publisher"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_name TEXT;
  clean_name TEXT;
  first_name TEXT;
  last_name TEXT;
  publisher_id TEXT;
  candidate_count INTEGER;
BEGIN
  IF NEW."tenantId" IS NULL THEN
    RAISE EXCEPTION 'Member % no tiene tenantId', NEW.id;
  END IF;

  clean_name := regexp_replace(trim(NEW.name), '\s+', ' ', 'g');
  normalized_name := "_migration_normalize_name"(clean_name);
  last_name := substring(clean_name from '([^ ]+)$');
  first_name := CASE
    WHEN position(' ' in clean_name) > 0 THEN regexp_replace(clean_name, ' [^ ]+$', '')
    ELSE clean_name
  END;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW."tenantId" || '::' || NEW."groupId" || '::' || normalized_name, 0)
  );

  SELECT x."publisherId"
  INTO publisher_id
  FROM "_MigracionMemberAPublisher" x
  WHERE x."memberId" = NEW.id;

  IF publisher_id IS NULL THEN
    SELECT count(*), min(x."publisherId")
    INTO candidate_count, publisher_id
    FROM "Driver" d
    JOIN "_MigracionDriverAPublisher" x ON x."driverId" = d.id
    WHERE d."tenantId" = NEW."tenantId"
      AND d."groupId" = NEW."groupId"
      AND "_migration_normalize_name"(d.name) = normalized_name;

    IF candidate_count <> 1 THEN
      publisher_id := gen_random_uuid()::text;
      INSERT INTO "Publisher" (
        id, "firstName", "lastName", "isConductor", "groupId", "tenantId"
      ) VALUES (
        publisher_id, first_name, last_name, false, NEW."groupId", NEW."tenantId"
      );
    END IF;

    INSERT INTO "_MigracionMemberAPublisher" ("memberId", "publisherId")
    VALUES (NEW.id, publisher_id)
    ON CONFLICT ("memberId") DO UPDATE
      SET "publisherId" = EXCLUDED."publisherId";
  END IF;

  UPDATE "Publisher"
  SET "firstName" = first_name,
      "lastName" = last_name,
      "groupId" = NEW."groupId",
      "tenantId" = NEW."tenantId",
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = publisher_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "_migration_sync_driver_publisher"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_name TEXT;
  clean_name TEXT;
  first_name TEXT;
  last_name TEXT;
  publisher_id TEXT;
  candidate_count INTEGER;
BEGIN
  IF NEW."tenantId" IS NULL THEN
    RAISE EXCEPTION 'Driver % no tiene tenantId', NEW.id;
  END IF;

  clean_name := regexp_replace(trim(NEW.name), '\s+', ' ', 'g');
  normalized_name := "_migration_normalize_name"(clean_name);
  last_name := substring(clean_name from '([^ ]+)$');
  first_name := CASE
    WHEN position(' ' in clean_name) > 0 THEN regexp_replace(clean_name, ' [^ ]+$', '')
    ELSE clean_name
  END;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW."tenantId" || '::' || NEW."groupId" || '::' || normalized_name, 0)
  );

  SELECT x."publisherId"
  INTO publisher_id
  FROM "_MigracionDriverAPublisher" x
  WHERE x."driverId" = NEW.id;

  IF publisher_id IS NULL THEN
    SELECT count(*), min(x."publisherId")
    INTO candidate_count, publisher_id
    FROM "Member" m
    JOIN "_MigracionMemberAPublisher" x ON x."memberId" = m.id
    WHERE m."tenantId" = NEW."tenantId"
      AND m."groupId" = NEW."groupId"
      AND "_migration_normalize_name"(m.name) = normalized_name;

    IF candidate_count <> 1 THEN
      publisher_id := gen_random_uuid()::text;
      INSERT INTO "Publisher" (
        id, "firstName", "lastName", "isConductor", "groupId", "tenantId"
      ) VALUES (
        publisher_id, first_name, last_name, true, NEW."groupId", NEW."tenantId"
      );
    END IF;

    INSERT INTO "_MigracionDriverAPublisher" ("driverId", "publisherId", estrategia)
    VALUES (NEW.id, publisher_id, 'compatibilidad')
    ON CONFLICT ("driverId") DO UPDATE
      SET "publisherId" = EXCLUDED."publisherId",
          estrategia = EXCLUDED.estrategia;
  END IF;

  UPDATE "Publisher"
  SET "firstName" = first_name,
      "lastName" = last_name,
      "isConductor" = true,
      "groupId" = NEW."groupId",
      "tenantId" = NEW."tenantId",
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = publisher_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "_migration_unset_conductor"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  publisher_id TEXT;
BEGIN
  SELECT x."publisherId"
  INTO publisher_id
  FROM "_MigracionDriverAPublisher" x
  WHERE x."driverId" = OLD.id;

  IF publisher_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "_MigracionDriverAPublisher" x
    WHERE x."publisherId" = publisher_id
      AND x."driverId" <> OLD.id
  ) THEN
    UPDATE "Publisher"
    SET "isConductor" = false,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = publisher_id;
  END IF;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION "_migration_assignment_publisher"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS "migration_sync_member_publisher" ON "Member";
CREATE TRIGGER "migration_sync_member_publisher"
AFTER INSERT OR UPDATE OF name, "groupId", "tenantId" ON "Member"
FOR EACH ROW EXECUTE FUNCTION "_migration_sync_member_publisher"();

DROP TRIGGER IF EXISTS "migration_sync_driver_publisher" ON "Driver";
CREATE TRIGGER "migration_sync_driver_publisher"
AFTER INSERT OR UPDATE OF name, "groupId", "tenantId" ON "Driver"
FOR EACH ROW EXECUTE FUNCTION "_migration_sync_driver_publisher"();

DROP TRIGGER IF EXISTS "migration_unset_conductor" ON "Driver";
CREATE TRIGGER "migration_unset_conductor"
BEFORE DELETE ON "Driver"
FOR EACH ROW EXECUTE FUNCTION "_migration_unset_conductor"();

DROP TRIGGER IF EXISTS "migration_assignment_publisher" ON "Assignment";
CREATE TRIGGER "migration_assignment_publisher"
BEFORE INSERT OR UPDATE OF "driverId" ON "Assignment"
FOR EACH ROW EXECUTE FUNCTION "_migration_assignment_publisher"();

DROP TRIGGER IF EXISTS "migration_daily_record_publisher" ON "DailyRecord";
CREATE TRIGGER "migration_daily_record_publisher"
BEFORE INSERT OR UPDATE OF "driverId" ON "DailyRecord"
FOR EACH ROW EXECUTE FUNCTION "_migration_daily_record_publisher"();

DROP TRIGGER IF EXISTS "migration_personal_assignment_publisher" ON "PersonalAssignment";
CREATE TRIGGER "migration_personal_assignment_publisher"
BEFORE INSERT OR UPDATE OF "memberId" ON "PersonalAssignment"
FOR EACH ROW EXECUTE FUNCTION "_migration_personal_assignment_publisher"();

COMMIT;
