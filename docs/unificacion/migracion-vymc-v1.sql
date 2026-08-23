-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN ADITIVA VYMC v1 — Sección 6 del plan de unificación
-- Incorpora las tablas del módulo VYMC ligadas a Tenant/Publisher.
-- 100% aditiva: no modifica tablas existentes.
-- ═══════════════════════════════════════════════════════════════
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$ BEGIN CREATE TYPE "ModuleCode" AS ENUM ('TERRITORIES','VYMC'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SectionType" AS ENUM ('PRESIDENT','OPENING_PRAYER','TREASURES','BE_BETTER_TEACHERS','CHRISTIAN_LIFE','CLOSING_PRAYER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ItemType" AS ENUM ('SPEECH','READING','DISCUSSION','CONDUCTOR_READER','PRAYER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AssignmentRole" AS ENUM ('ASSIGNEE','STUDENT','HELPER','CONDUCTOR','READER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "UserModuleAccess" (
    "userId" TEXT NOT NULL,
    "module" "ModuleCode" NOT NULL,
    CONSTRAINT "UserModuleAccess_pkey" PRIMARY KEY ("userId", "module")
);
DO $$ BEGIN ALTER TABLE "UserModuleAccess" ADD CONSTRAINT "UserModuleAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "UserModuleAccess_module_idx" ON "UserModuleAccess"("module");

CREATE TABLE IF NOT EXISTS "Week" (
    "id"              TEXT        NOT NULL PRIMARY KEY,
    "weekNumber"      INTEGER     NOT NULL,
    "year"            INTEGER     NOT NULL,
    "startDate"       TIMESTAMP(3) NOT NULL,
    "endDate"         TIMESTAMP(3) NOT NULL,
    "tenantId"        TEXT        NOT NULL,
    "presidentId"     TEXT,
    "openingPrayerId" TEXT,
    "biblicalReading" TEXT,
    "scrapedAt"       TIMESTAMP(3),
    "isConfirmed"     BOOLEAN     NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "Week" ADD CONSTRAINT "Week_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Week" ADD CONSTRAINT "Week_presidentId_fkey"
  FOREIGN KEY ("presidentId") REFERENCES "Publisher"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Week" ADD CONSTRAINT "Week_openingPrayerId_fkey"
  FOREIGN KEY ("openingPrayerId") REFERENCES "Publisher"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "Week_tenantId_weekNumber_year_key" ON "Week"("tenantId","weekNumber","year");
CREATE INDEX IF NOT EXISTS "Week_tenantId_idx" ON "Week"("tenantId");
CREATE INDEX IF NOT EXISTS "Week_presidentId_idx" ON "Week"("presidentId");
CREATE INDEX IF NOT EXISTS "Week_openingPrayerId_idx" ON "Week"("openingPrayerId");

CREATE TABLE IF NOT EXISTS "WeekSection" (
    "id"          TEXT         NOT NULL PRIMARY KEY,
    "weekId"      TEXT         NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "order"       INTEGER      NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "WeekSection" ADD CONSTRAINT "WeekSection_weekId_fkey"
  FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "WeekSection_weekId_idx" ON "WeekSection"("weekId");

CREATE TABLE IF NOT EXISTS "WeekItem" (
    "id"                    TEXT         NOT NULL PRIMARY KEY,
    "weekSectionId"         TEXT         NOT NULL,
    "title"                 TEXT         NOT NULL,
    "itemType"              "ItemType"   NOT NULL,
    "order"                 INTEGER      NOT NULL,
    "requiresStudentHelper" BOOLEAN      NOT NULL DEFAULT false,
    "timeMinutes"           INTEGER,
    "songNumber"            INTEGER,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "WeekItem" ADD CONSTRAINT "WeekItem_weekSectionId_fkey"
  FOREIGN KEY ("weekSectionId") REFERENCES "WeekSection"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "WeekItem_weekSectionId_idx" ON "WeekItem"("weekSectionId");

CREATE TABLE IF NOT EXISTS "MeetingAssignment" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "weekItemId"  TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "role"        "AssignmentRole" NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;

DO $$ BEGIN ALTER TABLE "MeetingAssignment" ADD CONSTRAINT "MeetingAssignment_weekItemId_fkey"
  FOREIGN KEY ("weekItemId") REFERENCES "WeekItem"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "MeetingAssignment" ADD CONSTRAINT "MeetingAssignment_publisherId_fkey"
  FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "MeetingAssignment_weekItemId_role_key" ON "MeetingAssignment"("weekItemId","role");
CREATE INDEX IF NOT EXISTS "MeetingAssignment_weekItemId_idx" ON "MeetingAssignment"("weekItemId");
CREATE INDEX IF NOT EXISTS "MeetingAssignment_publisherId_idx" ON "MeetingAssignment"("publisherId");
