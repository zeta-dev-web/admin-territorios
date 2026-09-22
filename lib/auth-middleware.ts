import { jwtVerify } from 'jose'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || !secret.trim()) {
    throw new Error('Falta configurar JWT_SECRET en las variables de entorno')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionData {
  isAuthenticated: boolean
  userId: string
  email: string
  tenantId: string
  role: 'ADMIN' | 'USER'
  [key: string]: unknown
}

/**
 * Decodifica un token JWT de sesión.
 * Solo usa jose (Edge-compatible), sin bcrypt ni prisma.
 */
export async function decrypt(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as unknown as SessionData
  } catch {
    return null
  }
}
