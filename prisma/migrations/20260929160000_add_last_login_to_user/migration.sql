-- Agrega última conexión del usuario (se actualiza en cada login exitoso).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ;
