-- Add termsAcceptedAt column to User table
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- Create index for performance (optional but recommended)
CREATE INDEX "User_termsAcceptedAt_idx" ON "User"("termsAcceptedAt");
