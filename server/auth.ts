'use server'

import { createSession, deleteSession, verifyPassword } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const password = formData.get('password') as string

  if (!password) {
    return {
      success: false,
      message: 'Por favor ingresa la contraseña',
    }
  }

  const isValid = await verifyPassword(password)

  if (!isValid) {
    return {
      success: false,
      message: 'Contraseña incorrecta',
    }
  }

  await createSession('admin')
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
