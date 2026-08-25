import { LoginForm } from '@/components/auth/LoginForm'
import { BrandMark } from '@/components/common/BrandMark'
import { StarTrail } from '@/components/common/StarTrail'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'

export default async function LoginPage() {
  const session = await getSession()
  
  if (session?.isAuthenticated) {
    redirect('/inicio')
  }

  return (
    <div className="login-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111F] p-4">
      {/* Estrellas que siguen al cursor */}
      <StarTrail />

      {/* Switch dark/light */}
      <div className="fixed right-4 top-4 z-[70]">
        <ThemeToggle className="theme-toggle--compact" />
      </div>

      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(93,217,207,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(93,217,207,.06) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-[110px]" />
      <div className="absolute -bottom-44 -right-24 h-[34rem] w-[34rem] rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="absolute left-[58%] top-[12%] h-40 w-40 rotate-12 rounded-[2.5rem] border border-cyan-200/10 bg-cyan-300/[0.03]" />

      <div className="relative w-full max-w-md">
        <div className="login-card rounded-[2rem] border border-white/10 bg-[#0D1A2D]/90 p-7 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-9">
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-5 w-fit">
              <div className="absolute inset-3 rounded-2xl bg-cyan-400/35 blur-2xl" />
              <BrandMark
                size={84}
                className="relative h-[84px] w-[84px]"
                priority
                decorative={false}
              />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              Sistema unificado de recursos
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Recursos <span className="text-cyan-300">App</span>
            </h1>
          </div>

          <LoginForm />

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/5 pt-5 text-xs text-slate-500">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>Acceso seguro y protegido</span>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Organiza · Asigna · Completa
        </p>
      </div>
    </div>
  )
}
