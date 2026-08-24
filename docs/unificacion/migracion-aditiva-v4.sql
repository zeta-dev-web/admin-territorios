-- v4: groupId de Publisher pasa a ser opcional ("Sin grupo" permitido)
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE "Publisher" ALTER COLUMN "groupId" DROP NOT NULL;
COMMIT;
