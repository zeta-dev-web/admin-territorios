import { LoginForm } from '@/components/auth/LoginForm'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MapPin, Shield } from 'lucide-react'

export default async function LoginPage() {
  const session = await getSession()
  
  if (session?.isAuthenticated) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-20 -left-20 blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-white/10 rounded-full -bottom-20 -right-20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Tarjeta de login */}
      <div className="relative w-full max-w-md">
        <div className="glass rounded-2xl shadow-2xl p-8 animate-in">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
              <MapPin className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Gestión de Territorios
            </h1>
            <p className="text-white/80 text-sm">
              Sistema de administración y seguimiento de territorios para congregaciones
            </p>
          </div>

          {/* Formulario */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-sm">
            <Shield className="h-4 w-4" />
            <span>Acceso seguro y protegido</span>
          </div>
        </div>
      </div>
    </div>
  )
}
