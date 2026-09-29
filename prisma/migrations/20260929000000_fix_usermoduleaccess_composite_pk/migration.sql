-- Corrige la PK de UserModuleAccess: era solo ("userId") y solo permitía
-- un módulo por usuario (el segundo módulo se descartaba en silencio con
-- skipDuplicates). Debe ser compuesta ("userId", "module") como en schema.prisma.
ALTER TABLE "UserModuleAccess" DROP CONSTRAINT IF EXISTS "UserModuleAccess_pkey";
ALTER TABLE "UserModuleAccess" ADD CONSTRAINT "UserModuleAccess_pkey" PRIMARY KEY ("userId", "module");
