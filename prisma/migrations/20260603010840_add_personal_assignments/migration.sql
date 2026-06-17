-- CreateTable
CREATE TABLE "PersonalAssignment" (
    "id" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalAssignment_territoryId_idx" ON "PersonalAssignment"("territoryId");

-- CreateIndex
CREATE INDEX "PersonalAssignment_memberId_idx" ON "PersonalAssignment"("memberId");

-- CreateIndex
CREATE INDEX "PersonalAssignment_isActive_idx" ON "PersonalAssignment"("isActive");

-- CreateIndex
CREATE INDEX "PersonalAssignment_assignedDate_idx" ON "PersonalAssignment"("assignedDate");

-- CreateIndex
CREATE INDEX "PersonalAssignment_returnedDate_idx" ON "PersonalAssignment"("returnedDate");

-- AddForeignKey
ALTER TABLE "PersonalAssignment" ADD CONSTRAINT "PersonalAssignment_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssignment" ADD CONSTRAINT "PersonalAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
