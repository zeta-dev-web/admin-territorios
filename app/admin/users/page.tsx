import { AppLayout } from '@/components/common/AppLayout'
import { UsersClient } from './UsersClient'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  return (
    <AppLayout title="Usuarios">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Usuarios</h1>
            <p className="text-sm text-slate-400">
              Gestioná los usuarios del sistema
            </p>
          </div>
        </div>

        <UsersClient />
      </div>
    </AppLayout>
  )
}
