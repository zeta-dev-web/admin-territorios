-- Add a type to distinguish regular VYMC weeks from weeks without a program.
CREATE TYPE "WeekType" AS ENUM ('REGULAR', 'REGIONAL_ASSEMBLY', 'CIRCUIT_ASSEMBLY', 'CIRCUIT_SUPERVISOR_VISIT');

ALTER TABLE "Week" ADD COLUMN "weekType" "WeekType" NOT NULL DEFAULT 'REGULAR';
