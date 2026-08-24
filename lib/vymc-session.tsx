'use client'

import { createContext, useContext, ReactNode } from 'react'

export type VymcUser = {
  name?: string | null
  email?: string | null
  congregationId: string
  congregationName?: string | null
}

type SessionShape = { data: { user: VymcUser } | null; status: 'authenticated' | 'unauthenticated' }

const SessionCtx = createContext<SessionShape>({ data: null, status: 'unauthenticated' })

/**
 * Provider alimentado por el layout servidor con la sesión de territorios.
 * Expone una API compatible con useSession() de NextAuth para que las
 * pantallas VYMC portadas funcionen sin cambios.
 */
export function VymcSessionProvider({ user, children }: { user: VymcUser; children: ReactNode }) {
  return (
    <SessionCtx.Provider value={{ data: { user }, status: 'authenticated' }}>
      {children}
    </SessionCtx.Provider>
  )
}

export function useSession(): SessionShape {
  return useContext(SessionCtx)
}
