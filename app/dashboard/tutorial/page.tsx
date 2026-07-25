'use client'

import { AppLayout } from '@/components/common/AppLayout'
import {
  BookOpen,
  MapPin,
  Users,
  TrendingUp,
  Map,
  UserCircle,
  PlayCircle,
  CheckCircle2,
  History,
  Settings,
} from 'lucide-react'
import { useState } from 'react'

interface TutorialSection {
  id: string
  title: string
  icon: any
  description: string
  steps: {
    title: string
    description: string
    tip?: string
  }[]
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: TrendingUp,
    description: 'VisiÃ³n general del estado de los territorios',
    steps: [
      {
        title: 'EstadÃ­sticas principales',
        description: 'El dashboard muestra tres mÃ©tricas clave: Activos (territorios en progreso), Atrasados (sin asignar en +6 meses) y Total Trabajados (asignaciones completadas).',
      },
      {
        title: 'Territorios Activos',
        description: 'Visualiza los territorios actualmente en progreso con navegaciÃ³n entre tarjetas.',
      },
      {
        title: 'Territorios Atrasados',
        description: 'Lista de territorios que no se asignaron en mÃ¡s de 6 meses, requieren atenciÃ³n prioritaria.',
      },
      {
        title: 'Frecuencia de Trabajo',
        description: 'Muestra los territorios mÃ¡s trabajados con grÃ¡fico de barras indicando la cantidad de asignaciones completadas.',
        tip: 'Esta vista te da una lectura rÃ¡pida del estado general antes de crear los programas de salidas.',
      },
    ],
  },
  {
    id: 'grupos',
    title: 'Grupos',
    icon: Users,
    description: 'Estructura base de la congregaciÃ³n',
    steps: [
      {
        title: 'Crear un grupo',
        description: 'Usa "Nuevo Grupo" para crear grupos. Campos principales: nombre del grupo, superintendente y auxiliar.',
      },
      {
        title: 'Ver integrantes',
        description: 'Haz clic en el nÃºmero de integrantes para ver el detalle interno del grupo y administrar sus miembros.',
      },
      {
        title: 'Agregar integrantes',
        description: 'Desde el detalle del grupo, usa "Agregar Integrante" para incorporar nuevos publicadores.',
        tip: 'Los integrantes son necesarios agregar cuando se les quiere asignar un territorio personal.',
      },
      {
        title: 'Habilitar como conductor',
        description: 'Toca el botÃ³n "Conductor" sobre un integrante para habilitarlo como conductor del grupo.',
      },
    ],
  },
  {
    id: 'conductores',
    title: 'Conductores',
    icon: UserCircle,
    description: 'Alta manual de conductores por grupo',
    steps: [
      {
        title: 'Crear conductor',
        description: 'Usa "Nuevo Conductor" para dar de alta un conductor nuevo de manera manual.',
      },
      {
        title: 'Seleccionar grupo y nombre',
        description: 'En el formulario selecciona primero el grupo y luego el nombre del conductor.',
        tip: 'TambiÃ©n puedes elegir un miembro existente y asignarle formalmente el rol de conductor.',
      },
      {
        title: 'Ver detalles',
        description: 'La tabla muestra grupo, territorios activos asignados y total de asignaciones histÃ³ricas de cada conductor.',
      },
    ],
  },
  {
    id: 'territorios',
    title: 'Territorios',
    icon: MapPin,
    description: 'Carga de territorios, grupo y manzanas',
    steps: [
      {
        title: 'Crear territorio',
        description: 'Cada territorio se carga con nÃºmero, grupo asignado y opcionalmente una descripciÃ³n de la zona.',
      },
      {
        title: 'Cargar manzanas',
        description: 'Si el territorio tiene manzanas, cargalas: una letra por cada manzana en orden alfabÃ©tico (ej: A, B, C, D).',
        tip: 'Esta informaciÃ³n permite medir el avance dentro de una asignaciÃ³n por cada manzana.',
      },
      {
        title: 'Filtros disponibles',
        description: 'Filtra territorios por nÃºmero/zona, por grupo y por estado de asignaciÃ³n (Todos, Asignados, Libres).',
      },
      {
        title: 'Ver bloques',
        description: 'Usa el botÃ³n "Ver bloques" para revisar las manzanas cargadas en cada territorio.',
      },
    ],
  },
  {
    id: 'mapas',
    title: 'Mapas',
    icon: Map,
    description: 'VisualizaciÃ³n de mapas generales y por grupo',
    steps: [
      {
        title: 'Mapa General',
        description: 'Agrega un mapa general de todos los territorios usando una URL externa (Google Drive, Dropbox, etc.).',
      },
      {
        title: 'Mapa por Grupo',
        description: 'Carga un mapa especÃ­fico mostrando la divisiÃ³n de territorios por grupos.',
      },
      {
        title: 'NavegaciÃ³n entre imÃ¡genes',
        description: 'Si un mapa tiene varias imÃ¡genes, usa las flechas para navegar entre ellas con efecto flip.',
        tip: 'Puedes cambiar o reemplazar mapas cuando sea necesario.',
      },
    ],
  },
  {
    id: 'asignaciones',
    title: 'Asignaciones',
    icon: TrendingUp,
    description: 'Trabajo por conductor o asignaciÃ³n personal',
    steps: [
      {
        title: 'Nueva AsignaciÃ³n (Conductor)',
        description: 'Se utiliza para trabajo por conductor, normalmente grupal o congregacional.',
      },
      {
        title: 'Nueva AsignaciÃ³n Personal',
        description: 'Se utiliza para asignar un territorio a una persona en forma individual con campo adicional de notas.',
      },
      {
        title: 'Filtros',
        description: 'Filtra asignaciones por bÃºsqueda (territorio/conductor), por grupo y por tipo (Conductor/Personal).',
      },
      {
        title: 'Ver progreso',
        description: 'Usa el botÃ³n "Ver" para abrir el detalle y seguir el progreso por manzanas de cada asignaciÃ³n activa.',
      },
    ],
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento del Avance',
    icon: CheckCircle2,
    description: 'Control de progreso por manzanas',
    steps: [
      {
        title: 'Abrir detalle',
        description: 'Desde Asignaciones, usa "Ver" para abrir el detalle de la asignaciÃ³n activa.',
      },
      {
        title: 'Marcar manzanas',
        description: 'El sistema muestra cuÃ¡ntas manzanas hay y cuÃ¡ntas fueron completadas. Marca cada manzana como Pendiente o Completada.',
        tip: 'Esto permite saber con claridad cuÃ¡nto del territorio ya fue trabajado.',
      },
      {
        title: 'Devolver territorio',
        description: 'Usa "Devolver" para cerrar la asignaciÃ³n y pasar el territorio a completado, indicando la fecha de devoluciÃ³n.',
      },
    ],
  },
  {
    id: 'historial',
    title: 'Historial',
    icon: History,
    description: 'Consulta y correcciÃ³n de registros',
    steps: [
      {
        title: 'Ver asignaciones finalizadas',
        description: 'Historial concentra todas las asignaciones devueltas mostrando territorio, persona, tipo, grupo, fechas y duraciÃ³n.',
      },
      {
        title: 'Filtros avanzados',
        description: 'Filtra por nombre/nÃºmero, por tipo de asignaciÃ³n y acota por aÃ±o o mes especÃ­fico.',
      },
      {
        title: 'Editar registros',
        description: 'Si una asignaciÃ³n ya devuelta necesita correcciÃ³n, edÃ­tala desde el historial para ajustar fechas o conductor.',
      },
      {
        title: 'Exportar a PDF',
        description: 'Usa "Exportar a PDF" para generar los formularios oficiales S-13-S con filtros de perÃ­odo y rangos de territorios.',
        tip: 'La exportaciÃ³n estÃ¡ pensada para registro formal y seguimiento mensual.',
      },
    ],
  },
  {
    id: 'configuracion',
    title: 'ConfiguraciÃ³n',
    icon: Settings,
    description: 'Cambio de contraseÃ±a e integraciÃ³n con IA',
    steps: [
      {
        title: 'Cambiar contraseÃ±a',
        description: 'Ingresa la contraseÃ±a actual, la nueva y su confirmaciÃ³n. RecibirÃ¡s un email de confirmaciÃ³n.',
      },
      {
        title: 'API Key personal',
        description: 'La secciÃ³n de integraciÃ³n con IA muestra tu API key personal que identifica tu usuario automÃ¡ticamente.',
        tip: 'No necesitas enviar el tenantId en las llamadas, la API key lo identifica.',
      },
      {
        title: 'Prompts listos',
        description: 'Copia los prompts pre-configurados para conectar asistentes de IA con tu sistema.',
      },
      {
        title: 'IntegraciÃ³n con ZAPIA',
        description: 'Se recomienda ZAPIA para crear agentes sin programaciÃ³n. El sistema ofrece un prompt especÃ­fico optimizado.',
      },
    ],
  },
]

export default function TutorialPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const selected = tutorialSections.find((s) => s.id === selectedSection)

  return (
    <AppLayout title="Tutorial">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Tutorial del Sistema</h1>
              <p className="text-sm text-slate-400">
                Aprende a usar todas las funcionalidades paso a paso
              </p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de secciones */}
          <div className="lg:col-span-1 space-y-2">
            {tutorialSections.map((section) => {
              const Icon = section.icon
              const isSelected = selectedSection === section.id

              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50'
                      : 'bg-[#0F1729] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-500/20' : 'bg-slate-800/50'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isSelected ? 'text-blue-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm ${
                          isSelected ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {section.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {section.description}
                      </p>
                    </div>
                    {isSelected && (
                      <PlayCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Contenido de la secciÃ³n seleccionada */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-12 text-center">
                <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Selecciona una secciÃ³n
                </h3>
                <p className="text-sm text-slate-400">
                  Elige un tema de la izquierda para ver el tutorial detallado
                </p>
              </div>
            ) : (
              <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-6 space-y-6">
                {/* TÃ­tulo de secciÃ³n */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <selected.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selected.title}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {selected.description}
                    </p>
                  </div>
                </div>

                {/* Pasos */}
                <div className="space-y-4">
                  {selected.steps.map((step, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-400">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                            {step.title}
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </h4>
                          <p className="text-sm text-slate-300 mb-2">
                            {step.description}
                          </p>
                          {step.tip && (
                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                              <p className="text-xs text-blue-300">
                                ðŸ’¡ <strong>Tip:</strong> {step.tip}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer informativo */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Orden recomendado de configuraciÃ³n
              </h3>
              <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                <li>Crear grupos e integrantes</li>
                <li>Cargar conductores y territorios</li>
                <li>Comenzar con las asignaciones activas y su seguimiento</li>
                <li>Usar historial y exportaciÃ³n para control administrativo</li>
              </ol>
              <p className="text-sm text-slate-400 mt-3">
                Si tienes dudas adicionales, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
