/*
  Warnings:

  - Added the required column `groupId` to the `Territory` table without a default value. This is not possible if the table is not empty.

*/

-- Primero, obtener el primer grupo disponible y guardarlo en una variable
DO $$
DECLARE
  first_group_id TEXT;
BEGIN
  -- Obtener el ID del primer grupo
  SELECT id INTO first_group_id FROM "Group" LIMIT 1;
  
  -- Agregar la columna como nullable primero
  ALTER TABLE "Territory" ADD COLUMN "groupId" TEXT;
  
  -- Asignar el primer grupo a todos los territorios existentes
  UPDATE "Territory" SET "groupId" = first_group_id WHERE "groupId" IS NULL;
  
  -- Ahora hacer la columna NOT NULL
  ALTER TABLE "Territory" ALTER COLUMN "groupId" SET NOT NULL;
END $$;

-- CreateIndex
CREATE INDEX "Territory_groupId_idx" ON "Territory"("groupId");

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
