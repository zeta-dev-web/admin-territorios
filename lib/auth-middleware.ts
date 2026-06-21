import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo'
)

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
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as unknown as SessionData
  } catch {
    return null
  }
}
