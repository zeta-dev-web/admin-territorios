import { prisma } from '../prisma'

// ── Rate-limit persistente (DB) ──
// Los contadores viven en la tabla RateLimitCounter, así sobreviven
// reinicios/deploys y se comparten entre instancias. Si la DB falla, se usa
// un fallback en memoria para no romper el servicio.

const GLOBAL_KEY = '__global__'

type BucketState = {
  dayKey: string
  globalCount: number
  userCounts: Map<string, number>
}

const memoryFallback = new Map<string, BucketState>()

function getMemoryBucket(name: string): BucketState {
  let bucket = memoryFallback.get(name)
  if (!bucket) {
    bucket = { dayKey: currentDayKey(), globalCount: 0, userCounts: new Map() }
    memoryFallback.set(name, bucket)
  }

  const today = currentDayKey()
  if (bucket.dayKey !== today) {
    bucket.dayKey = today
    bucket.globalCount = 0
    bucket.userCounts.clear()
  }

  return bucket
}

function currentDayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readLimit(envKey: string, fallback: number): number {
  const parsed = Number(process.env[envKey])
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export type RateLimitResult = {
  allowed: boolean
  reason?: 'user' | 'global'
  remainingUser?: number
};

function checkMemory(
  bucketName: string,
  userId: string,
  userLimit: number,
  globalLimit: number,
  amount: number,
): RateLimitResult {
  const bucket = getMemoryBucket(bucketName)
  const currentUser = bucket.userCounts.get(userId) ?? 0

  if (currentUser + amount > userLimit) {
    return { allowed: false, reason: 'user', remainingUser: 0 }
  }
  if (bucket.globalCount + amount > globalLimit) {
    return { allowed: false, reason: 'global' }
  }

  bucket.userCounts.set(userId, currentUser + amount)
  bucket.globalCount += amount

  return {
    allowed: true,
    remainingUser: Math.max(0, userLimit - (currentUser + amount)),
  }
}

export async function checkRateLimit(
  bucketName: string,
  userId: string,
  amount = 1,
): Promise<RateLimitResult> {
  const userLimit = readLimit('AI_USER_DAILY_LIMIT', 6)
  const globalLimit = readLimit('AI_GLOBAL_DAILY_LIMIT', 40)
  const dayKey = currentDayKey()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [userRow, globalRow] = await Promise.all([
        tx.rateLimitCounter.upsert({
          where: { bucket_key_dayKey: { bucket: bucketName, key: userId, dayKey } },
          create: { bucket: bucketName, key: userId, dayKey, count: 0 },
          update: {},
          select: { count: true },
        }),
        tx.rateLimitCounter.upsert({
          where: { bucket_key_dayKey: { bucket: bucketName, key: GLOBAL_KEY, dayKey } },
          create: { bucket: bucketName, key: GLOBAL_KEY, dayKey, count: 0 },
          update: {},
          select: { count: true },
        }),
      ])

      if (userRow.count + amount > userLimit) {
        return { allowed: false as const, reason: 'user' as const, remainingUser: 0 }
      }
      if (globalRow.count + amount > globalLimit) {
        return { allowed: false as const, reason: 'global' as const }
      }

      await Promise.all([
        tx.rateLimitCounter.updateMany({
          where: { bucket: bucketName, key: userId, dayKey },
          data: { count: { increment: amount } },
        }),
        tx.rateLimitCounter.updateMany({
          where: { bucket: bucketName, key: GLOBAL_KEY, dayKey },
          data: { count: { increment: amount } },
        }),
      ])

      return {
        allowed: true as const,
        remainingUser: Math.max(0, userLimit - (userRow.count + amount)),
      }
    })

    // Limpieza de días viejos (fire & forget)
    prisma.rateLimitCounter
      .deleteMany({ where: { dayKey: { lt: dayKey } } })
      .catch(() => {})

    return result
  } catch (error) {
    console.warn('[rate-limit] DB no disponible, usando fallback en memoria:', error)
    return checkMemory(bucketName, userId, userLimit, globalLimit, amount)
  }
}
