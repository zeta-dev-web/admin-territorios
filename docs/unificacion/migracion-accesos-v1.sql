-- Semilla de accesos por módulo: usuarios existentes obtienen ambos módulos.
INSERT INTO "UserModuleAccess" ("userId", "module")
SELECT u."id", v."module"::"ModuleCode"
FROM "User" u
CROSS JOIN (VALUES ('TERRITORIES'), ('VYMC')) AS v("module")
ON CONFLICT DO NOTHING;
