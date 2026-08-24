import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, CalendarDays } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getUserModules } from '@/lib/module-access'

export const dynamic = 'force-dynamic'

const CARDS = [
  {
    module: 'TERRITORIES' as const,
    href: '/territorios',
    title: 'Territorios',
    description: 'Gestión de territorios, asignaciones y registros de predicación',
    icon: MapPin,
    accent: '#2563EB',
  },
  {
    module: 'VYMC' as const,
    href: '/vymc',
    title: 'VYMC',
    description: 'Programas semanales y asignaciones de la reunión Vida y Ministerio',
    icon: CalendarDays,
    accent: '#2D5F8D',
  },
]

export default async function InicioPage() {
  const session = await getSession()
  if (!session?.isAuthenticated) redirect('/login')

  let modules = await getUserModules(session.userId)
  if (modules.length === 0) redirect('/login')
  if (modules.length === 1) {
    redirect(modules[0] === 'VYMC' ? '/vymc' : '/territorios')
  }

  const available = CARDS.filter((c) => modules.includes(c.module))
  const userName = session.email

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Bienvenido, {userName}</h1>
          <p className="text-muted-foreground">¿A qué módulo querés ingresar?</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {available.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.module} href={card.href}
                className="group rounded-xl border border-border bg-card p-8 hover:border-ring transition-all hover:shadow-lg">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${card.accent}1A` }}>
                  <Icon className="w-7 h-7" style={{ color: card.accent }} />
                </div>
                <h2 className="text-xl font-semibold text-card-foreground mb-1">{card.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                <span className="inline-flex items-center gap-1 mt-5 text-sm font-medium group-hover:underline"
                  style={{ color: card.accent }}>
                  Ingresar →
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
