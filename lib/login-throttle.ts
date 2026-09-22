// ── Throttling de login (anti fuerza bruta) ──
// Ventana en memoria por instancia: 10 intentos fallidos por email cada
// 10 minutos. Superado el tope, se bloquea temporalmente. Combinado con
// bcrypt (cost 12) hace inviable la fuerza bruta en línea.

const MAX_ATTEMPTS = 10
const WINDOW_MS = 10 * 60 * 1000

type Entry = { count: number; firstAt: number }
const attempts = new Map<string, Entry>()

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

function getEntry(email: string): Entry | null {
  const entry = attempts.get(normalize(email))
  if (!entry) return null
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(normalize(email))
    return null
  }
  return entry
}

export function isLoginBlocked(email: string): { blocked: boolean; retryAfterSec: number } {
  const entry = getEntry(email)
  if (entry && entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((entry.firstAt + WINDOW_MS - Date.now()) / 1000),
    )
    return { blocked: true, retryAfterSec }
  }
  return { blocked: false, retryAfterSec: 0 }
}

export function registerFailedLogin(email: string): void {
  const key = normalize(email)
  const entry = getEntry(email)
  if (entry) {
    entry.count += 1
  } else {
    attempts.set(key, { count: 1, firstAt: Date.now() })
  }
}

export function clearLoginAttempts(email: string): void {
  attempts.delete(normalize(email))
}
