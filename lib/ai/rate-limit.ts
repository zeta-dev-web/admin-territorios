type BucketState = {
  dayKey: string;
  globalCount: number;
  userCounts: Map<string, number>;
};

const buckets = new Map<string, BucketState>();

function getBucket(name: string): BucketState {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = { dayKey: currentDayKey(), globalCount: 0, userCounts: new Map() };
    buckets.set(name, bucket);
  }

  const today = currentDayKey();
  if (bucket.dayKey !== today) {
    bucket.dayKey = today;
    bucket.globalCount = 0;
    bucket.userCounts.clear();
  }

  return bucket;
}

function currentDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readLimit(envKey: string, fallback: number): number {
  const parsed = Number(process.env[envKey]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export type RateLimitResult = {
  allowed: boolean;
  reason?: "user" | "global";
  remainingUser?: number;
};

export function checkRateLimit(
  bucketName: string,
  userId: string,
  amount = 1
): RateLimitResult {
  const bucket = getBucket(bucketName);

  const userLimit = readLimit("AI_USER_DAILY_LIMIT", 6);
  const globalLimit = readLimit("AI_GLOBAL_DAILY_LIMIT", 40);

  const currentUser = bucket.userCounts.get(userId) ?? 0;

  if (currentUser + amount > userLimit) {
    return { allowed: false, reason: "user", remainingUser: 0 };
  }

  if (bucket.globalCount + amount > globalLimit) {
    return { allowed: false, reason: "global" };
  }

  bucket.userCounts.set(userId, currentUser + amount);
  bucket.globalCount += amount;

  return {
    allowed: true,
    remainingUser: Math.max(0, userLimit - (currentUser + amount)),
  };
}
