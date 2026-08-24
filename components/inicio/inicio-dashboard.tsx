'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Info,
  LogOut,
  MapPin,
  Megaphone,
  AlertTriangle,
} from 'lucide-react'
import { BrandMark } from '@/components/common/BrandMark'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { logout } from '@/server/auth'
import type { ModuleCode } from '@/lib/module-access'
import type { SiteMessage, SiteMessageType } from '@/lib/site-messages'

interface InicioDashboardProps {
  userName: string
  congregationName: string
  modules: ModuleCode[]
  messages: SiteMessage[]
}

const MODULE_CARDS = [
  {
    module: 'TERRITORIES' as const,
    href: '/territorios',
    title: 'Territorios',
    description:
      'Organizá territorios, mapas, asignaciones y el avance de la predicación de tu congregación.',
    cta: 'Ingresar a Territorios',
    icon: MapPin,
    tile: 'from-blue-600 to-cyan-500',
    glow: 'rgba(6, 182, 212, 0.16)',
    accentText: 'text-cyan-400',
    hoverBorder: 'hover:border-cyan-400/60',
    hoverShadow: 'hover:shadow-[0_24px_70px_-18px_rgba(6,182,212,0.4)]',
    focusRing: 'focus-visible:ring-cyan-400/70',
  },
  {
    module: 'VYMC' as const,
    href: '/vymc',
    title: 'VYMC',
    description:
      'Programas semanales, publicadores y asignaciones de Vida y Ministerio Cristiano.',
    cta: 'Ingresar a VYMC',
    icon: CalendarDays,
    tile: 'from-[#2C5282] to-emerald-500',
    glow: 'rgba(16, 185, 129, 0.16)',
    accentText: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-400/60',
    hoverShadow: 'hover:shadow-[0_24px_70px_-18px_rgba(16,185,129,0.4)]',
    focusRing: 'focus-visible:ring-emerald-400/70',
  },
]

const MESSAGE_STYLES: Record<
  SiteMessageType,
  { icon: typeof Info; iconClass: string; tileClass: string }
> = {
  info: { icon: Info, iconClass: 'text-blue-400', tileClass: 'bg-blue-500/10' },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    tileClass: 'bg-emerald-500/10',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    tileClass: 'bg-amber-500/10',
  },
  megaphone: {
    icon: Megaphone,
    iconClass: 'text-purple-400',
    tileClass: 'bg-purple-500/10',
  },
}

export function InicioDashboard({
  userName,
  congregationName,
  modules,
  messages,
}: InicioDashboardProps) {
  const firstName = userName.split('@')[0]
  const cards = MODULE_CARDS.filter((card) => modules.includes(card.module))

  const handleMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    el.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0F1C] text-white">
      {/* Fondo: grilla sutil + orbes ambientales */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-44 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-52 -right-32 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 h-[26rem] w-[26rem] rounded-full bg-emerald-500/10 blur-[130px]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        {/* Barra superior */}
        <header className="inicio-enter flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-cyan-400/30 blur-lg" />
              <BrandMark size={40} className="relative h-10 w-10" priority />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">
                Territorios <span className="text-cyan-400">App</span>
              </p>
              <p className="text-xs text-slate-500">Centro unificado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-10 w-10 justify-center px-0 [&_.theme-toggle__label]:hidden" />
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#0F1729]/70 px-3.5 text-sm font-medium text-slate-300 transition-colors hover:border-red-400/50 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Bienvenida */}
        <section className="inicio-enter mt-14 text-center sm:mt-20">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">
            Sistema unificado de congregación
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Hola, {firstName}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            {congregationName ? `Congregación ${congregationName} · ` : ''}
            ¿A qué sistema querés ingresar hoy?
          </p>
        </section>

        {/* Tarjetas de módulos */}
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <Link
                key={card.module}
                href={card.href}
                onMouseMove={handleMove}
                style={{ animationDelay: `${120 + index * 90}ms` }}
                className={`inicio-card group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F1729] p-7 shadow-2xl shadow-black/25 transition-all duration-300 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 ${card.hoverBorder} ${card.hoverShadow} ${card.focusRing}`}
              >
                {/* Glow que sigue al mouse */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(440px circle at var(--mx, 50%) var(--my, 50%), ${card.glow}, transparent 65%)`,
                  }}
                />

                <div className="relative">
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tile} text-white shadow-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110`}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {card.description}
                  </p>

                  <span
                    className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${card.accentText}`}
                  >
                    {card.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </section>

        {/* Avisos y notificaciones */}
        <section className="inicio-enter mt-12" style={{ animationDelay: '240ms' }}>
          <div className="mb-4 flex items-center gap-2.5">
            <Megaphone className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Avisos y notificaciones
            </h2>
          </div>

          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => {
                const style = MESSAGE_STYLES[message.type]
                const Icon = style.icon
                return (
                  <article
                    key={message.id}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0F1729] p-5"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tileClass}`}
                    >
                      <Icon className={`h-5 w-5 ${style.iconClass}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold">{message.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {message.body}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0F1729]/60 p-8 text-center text-sm text-slate-500">
              No hay avisos por ahora. Editá{' '}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-[13px] text-cyan-400">
                lib/site-messages.ts
              </code>{' '}
              para publicar uno.
            </div>
          )}
        </section>

        <footer className="mt-auto pt-12 pb-2 text-center text-xs text-slate-600">
          Territorios App · by ZetaDev
        </footer>
      </div>
    </div>
  )
}
