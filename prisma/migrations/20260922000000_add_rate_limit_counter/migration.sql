-- Contadores diarios para rate-limit persistente (sobrevive reinicios y se comparte entre instancias).
CREATE TABLE "RateLimitCounter" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitCounter_bucket_key_dayKey_key" ON "RateLimitCounter"("bucket", "key", "dayKey");
CREATE INDEX "RateLimitCounter_bucket_dayKey_idx" ON "RateLimitCounter"("bucket", "dayKey");
