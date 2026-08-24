'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  CirclePlay,
  History,
  Lightbulb,
  Map,
  MapPin,
  Route,
  Settings,
  UserCircle,
  Users,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'

const VIDEO_URL = 'https://www.image2url.com/r2/default/videos/1784995980517-d2e7a08f-9314-4ba9-9dfc-b44ddfe9e620.mp4'

interface TutorialStep {
  title: string
  description: string
}

interface TutorialSection {
  id: string
  title: string
  description: string
  icon: LucideIcon
  steps: TutorialStep[]
  tip?: string
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Consulta el estado general del trabajo.',
    icon: BarChart3,
    steps: [
      {
        title: 'Revisa las estadísticas',
        description:
          'Activos muestra los territorios en progreso, Atrasados los que llevan más de 6 meses sin trabajarse y Total Trabajados las asignaciones completadas.',
      },
      {
        title: 'Detecta prioridades',
        description:
          'Debajo puedes consultar los territorios activos, los atrasados y la frecuencia con la que se trabajó cada uno.',
      },
    ],
  },
  {
    id: 'grupos',
    title: 'Grupos',
    description: 'Organiza los grupos y sus integrantes.',
    icon: Users,
    steps: [
      {
        title: 'Crea un grupo',
        description:
          'Pulsa Nuevo Grupo e indica su nombre, por ejemplo Grupo 1. El superintendente y el auxiliar son opcionales.',
      },
      {
        title: 'Agrega integrantes',
        description:
          'Los integrantes podrán recibir asignaciones personales. Desde el listado también puedes convertir un integrante en conductor con el botón Conductor.',
      },
    ],
  },
  {
    id: 'conductores',
    title: 'Conductores',
    description: 'Administra a quienes reciben trabajo grupal.',
    icon: UserCircle,
    steps: [
      {
        title: 'Crea un conductor',
        description:
          'Pulsa Nuevo Conductor, selecciona el grupo y elige un miembro existente.',
      },
      {
        title: 'Dos caminos, el mismo resultado',
        description:
          'Crear un conductor desde esta sección equivale a pulsar Conductor sobre un integrante desde Grupos.',
      },
    ],
  },
  {
    id: 'territorios',
    title: 'Territorios',
    description: 'Registra territorios, grupos y manzanas.',
    icon: MapPin,
    steps: [
      {
        title: 'Crea el territorio',
        description:
          'Indica el número, una descripción opcional y el grupo al que pertenece.',
      },
      {
        title: 'Carga las manzanas',
        description:
          'Escribe una letra por cada manzana, en orden alfabético y separada por comas. Para cuatro manzanas: A, B, C, D.',
      },
      {
        title: 'Usa los filtros',
        description:
          'Busca por número o descripción y filtra por grupo o estado: todos, asignados o libres.',
      },
    ],
    tip: 'Cargar las manzanas permite medir con precisión el avance del territorio.',
  },
  {
    id: 'mapas',
    title: 'Mapas',
    description: 'Guarda referencias visuales de la congregación.',
    icon: Map,
    steps: [
      {
        title: 'Elige el tipo de mapa',
        description:
          'General corresponde al mapa completo de la congregación. Por Grupo muestra las áreas asignadas a cada grupo.',
      },
      {
        title: 'Agrega las imágenes',
        description:
          'Pega uno o varios enlaces directos desde Google Drive, Dropbox, Imgur u otro servicio y guarda los cambios.',
      },
    ],
  },
  {
    id: 'asignaciones',
    title: 'Asignaciones',
    description: 'Entrega territorios y registra su avance.',
    icon: Route,
    steps: [
      {
        title: 'Elige el tipo de asignación',
        description:
          'Nueva Asignación es para trabajo grupal o congregacional con un conductor. Asignación Personal es para un integrante que trabajará individualmente.',
      },
      {
        title: 'Consulta y registra el avance',
        description:
          'Usa Ver para consultar el estado. En asignaciones a conductores, Registrar permite marcar las manzanas trabajadas.',
      },
      {
        title: 'Devuelve el territorio',
        description:
          'Cuando finalice el trabajo, pulsa Devolver. La asignación se cerrará y pasará al historial.',
      },
    ],
    tip: 'Puedes filtrar las asignaciones por territorio o persona, grupo y tipo.',
  },
  {
    id: 'historial',
    title: 'Historial',
    description: 'Consulta y exporta el trabajo completado.',
    icon: History,
    steps: [
      {
        title: 'Encuentra un registro',
        description:
          'Filtra por territorio o persona, tipo de asignación, año y mes.',
      },
      {
        title: 'Corrige una devolución',
        description:
          'Edita una asignación devuelta si necesitas ajustar el conductor o las fechas.',
      },
      {
        title: 'Exporta el formulario oficial',
        description:
          'Genera el PDF S-13-S por período o rango de meses. También puedes incluir asignaciones activas.',
      },
    ],
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    description: 'Protege la cuenta y configura la integración con IA.',
    icon: Settings,
    steps: [
      {
        title: 'Cambia la contraseña',
        description:
          'Ingresa la contraseña actual, la nueva contraseña y su confirmación.',
      },
      {
        title: 'Integra inteligencia artificial',
        description:
          'Copia la clave API, el endpoint y los prompts preparados por el sistema. Recomendamos ZAPIA para realizar la integración.',
      },
    ],
    tip: 'Mantén la clave API en privado y úsala únicamente en servicios de confianza.',
  },
]

const recommendedOrder = [
  'Crear grupos e integrantes',
  'Cargar conductores y territorios',
  'Comenzar con las asignaciones activas y su seguimiento',
  'Usar historial y exportación para control administrativo',
]

export default function TutorialPage() {
  const [selectedSection, setSelectedSection] = useState('dashboard')
  const [showVideo, setShowVideo] = useState(false)

  const selected =
    tutorialSections.find((section) => section.id === selectedSection) ??
    tutorialSections[0]
  const SelectedIcon = selected.icon

  return (
    <AppLayout title="Tutorial">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-blue-400/20 bg-[#0F1729] px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <BookOpen className="h-4 w-4" />
              Guía rápida
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Aprende a usar Territorios App
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Selecciona una sección y consulta los pasos esenciales. Para una
              explicación completa, encontrarás el video tutorial al final.
            </p>
          </div>
        </header>

        <details className="group overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-cyan-400/5 shadow-lg shadow-black/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-white">
                  Orden recomendado de configuración
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Despliega esta guía antes de comenzar
                </p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>

          <div className="border-t border-blue-400/10 px-5 py-5 sm:px-6">
            <ol className="grid gap-3 sm:grid-cols-2">
              {recommendedOrder.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0A0F1C]/50 p-3 text-sm text-slate-200"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-slate-400">
              Si tienes dudas adicionales, contacta al administrador del
              sistema.
            </p>
          </div>
        </details>

        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <nav
            aria-label="Secciones del tutorial"
            className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-[#0F1729] p-3 shadow-lg shadow-black/10 sm:grid-cols-4 lg:grid-cols-1"
          >
            {tutorialSections.map((section) => {
              const Icon = section.icon
              const isActive = section.id === selected.id

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSection(section.id)}
                  aria-pressed={isActive}
                  className={`flex min-h-20 items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:min-h-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      isActive
                        ? 'bg-white/15'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold">{section.title}</span>
                </button>
              )
            })}
          </nav>

          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0F1729] shadow-xl shadow-black/15">
            <div className="border-b border-slate-800 bg-gradient-to-r from-blue-500/10 to-transparent px-5 py-5 sm:px-7">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                  <SelectedIcon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selected.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-7">
              {selected.steps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-xl border border-slate-800 bg-[#0A0F1C]/55 p-4"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-300">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}

              {selected.tip && (
                <aside className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <p className="text-sm leading-6">
                    <strong>Importante:</strong> {selected.tip}
                  </p>
                </aside>
              )}
            </div>
          </article>
        </div>

        <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0F1729] shadow-xl shadow-black/15">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">
                <CirclePlay className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Recorrido completo
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  Video tutorial
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                  Mira el paso a paso con capturas, voz en español y ejemplos
                  de cada función del sistema.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVideo((current) => !current)}
              aria-expanded={showVideo}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              <CirclePlay className="h-5 w-5" />
              {showVideo ? 'Ocultar video' : 'Ver video'}
            </button>
          </div>

          {showVideo && (
            <div className="border-t border-slate-800 bg-black p-3 sm:p-5">
              <video
                controls
                preload="metadata"
                className="aspect-video w-full rounded-xl bg-black"
              >
                <source src={VIDEO_URL} type="video/mp4" />
                Tu navegador no puede reproducir este video.
              </video>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
