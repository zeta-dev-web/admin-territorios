import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const session = await getSession()

  if (!session?.isAuthenticated || session.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">
            Gestioná los usuarios del sistema
          </p>
        </div>
      </div>

      <UsersClient />
    </div>
  )
}
