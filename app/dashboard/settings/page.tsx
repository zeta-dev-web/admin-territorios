'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/common/AppLayout'
import { changeOwnPassword, getCurrentUserInfo } from '@/server/auth'
import { toast } from 'react-hot-toast'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  Fingerprint,
  Copy,
  Check,
  Bot,
  Terminal,
  ExternalLink,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

function buildAiPrompt(tenantId: string): string {
  return [
    'Eres un asistente de IA para la app Territorios App, un sistema de gestion de territorios para congregaciones.',
    '',
    'Tu tarea es ayudar al usuario a gestionar sus territorios, asignaciones, conductores, grupos, mapas, etc. a traves de una API REST.',
    '',
    '## Instrucciones',
    '',
    '1. **Endpoint**: POST a la URL del sistema (preguntale al usuario cual es la URL de su instancia)',
    "2. **Autenticacion**: envia el header `Authorization: Bearer <API_KEY>` (preguntale al usuario su API Key)",
    '3. **Tenant ID**: el tenant de este usuario es `' + tenantId + '`. Inclui `"tenantId": "' + tenantId + '"` en TODAS las llamadas.',
    '4. **Formato del body**:',
    '   ```json',
    '   {',
    '     "action": "nombreDeLaAccion",',
    '     "params": { ... },',
    '     "tenantId": "' + tenantId + '"',
    '   }',
    '   ```',
    '',
    '## Acciones disponibles',
    '',
    'Usa `{ "action": "listActions" }` para descubrir todas las acciones disponibles.',
    '',
    '## Ejemplo',
    '',
    'Para listar todos los territorios:',
    '```json',
    '{',
    '  "action": "getAllTerritories",',
    '  "params": { "page": 1, "pageSize": 10 },',
    '  "tenantId": "' + tenantId + '"',
    '}',
    '```',
    '',
    'Responde siempre en espanol, con un tono profesional y claro. Ayuda al usuario a gestionar sus datos de forma eficiente.',
  ].join('\n')
}

function buildZapiaPrompt(tenantId: string): string {
  return [
    'Sos un asistente conectado a una API REST que administra la app Territorios App.',
    '',
    '## Configuracion de la API',
    '',
    '- **Endpoint base**: Preguntale al usuario la URL de su instancia',
    '- **API Key**: Preguntale al usuario su API Key',
    '- **Tenant ID**: ' + tenantId,
    '',
    '## Como hacer las llamadas',
    '',
    'Cada llamada que hagas a la API debe ser un POST con este formato:',
    '',
    '```json',
    '{',
    '  "action": "nombreDeLaAccion",',
    '  "params": {},',
    '  "tenantId": "' + tenantId + '"',
    '}',
    '```',
    '',
    '## Acciones disponibles',
    '',
    'Primero llama a `listActions` para descubrir que acciones tenes disponibles. Despues usa las que necesites segun lo que te pida el usuario.',
    '',
    '## Reglas',
    '',
    '- Responde siempre en espanol argentino, claro y directo',
    '- Si necesitas la URL de la instancia o la API Key, pediselas al usuario',
    '- No inventes acciones que no existen — siempre usa `listActions` primero para ver que esta disponible',
    '- Ayuda al usuario a sacar el maximo provecho del sistema',
  ].join('\n')
}

export default function SettingsPage() {
  // ── Password state ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // ── User info state ──
  const [userInfo, setUserInfo] = useState<{
    userId: string
    email: string
    tenantId: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState<'tenant' | 'prompt' | 'zapia' | null>(null)
  const [showAiSection, setShowAiSection] = useState(false)

  useEffect(() => {
    getCurrentUserInfo().then(setUserInfo)
  }, [])

  // ── Handlers ──

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos')
      return
    }

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }

    setIsLoading(true)
    try {
      const result = await changeOwnPassword({
        currentPassword,
        newPassword,
      })

      if (result.success) {
        toast.success('Contraseña actualizada correctamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  async function copyToClipboard(text: string, type: 'tenant' | 'prompt' | 'zapia') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      const msgs = {
        tenant: 'Tenant ID copiado',
        prompt: 'Prompt copiado',
        zapia: 'Prompt para ZAPIA copiado',
      }
      toast.success(msgs[type])
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Error al copiar')
    }
  }

  return (
    <AppLayout title="Configuración">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* ── HEADER ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Configuración</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Administrá tu cuenta y las integraciones del sistema
          </p>
        </div>

        {/* ── FILA 1: CONTRASEÑA + TENANT ID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── CAMBIAR CONTRASEÑA ── */}
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Cambiar Contraseña</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Actualizá tu contraseña de acceso
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Actualizar Contraseña
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 bg-slate-800/30 rounded-lg p-3 sm:p-4 border border-slate-700/50">
              <p className="text-xs sm:text-sm text-slate-400">
                Al cambiar tu contraseña recibirás un email de confirmación.
              </p>
            </div>
          </div>

          {/* ── TU TENANT ID ── */}
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Fingerprint className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tu Tenant ID</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Identificador único de tus datos
                </p>
              </div>
            </div>

            {userInfo ? (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-medium">
                      Tenant ID
                    </p>
                    <p className="text-sm font-mono text-white break-all select-all">
                      {userInfo.tenantId}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(userInfo.tenantId, 'tenant')}
                    className="shrink-0 w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    title="Copiar Tenant ID"
                  >
                    {copied === 'tenant' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-medium">
                    Email
                  </p>
                  <p className="text-sm text-white">{userInfo.email}</p>
                </div>

                <div className="mt-3">
                  <span
                    className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + (
                      userInfo.role === 'ADMIN'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-slate-500/10 text-slate-400'
                    )}
                  >
                    {userInfo.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <Loader2 className="h-5 w-5 text-slate-400 animate-spin shrink-0" />
                <p className="text-sm text-slate-400">Cargando información...</p>
              </div>
            )}

            <div className="mt-4 bg-slate-800/30 rounded-lg p-3 sm:p-4 border border-slate-700/50">
              <p className="text-xs sm:text-sm text-slate-400">
                Este ID identifica tus datos en el sistema. Lo necesitás para las integraciones con IA.
                Cada usuario tiene su propio Tenant ID único.
              </p>
            </div>
          </div>
        </div>

        {/* ── FILA 2: INTEGRACIÓN IA (colapsable) ── */}
        <div className="bg-[#0F1729] rounded-xl border border-slate-800">
          <button
            onClick={() => setShowAiSection(!showAiSection)}
            className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/30 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-white">Integración con IA</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Conectá tus datos con asistentes de IA
                </p>
              </div>
            </div>
            {showAiSection ? (
              <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
            )}
          </button>

          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            {!showAiSection && (
              <p className="text-xs text-slate-500 -mt-2">
                Endpoint /api/agent, API Key, prompts listos para copiar
              </p>
            )}

            {showAiSection && userInfo && (
              <div className="space-y-6 mt-0">
                <hr className="border-slate-800" />

                {/* Info en grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Terminal className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white mb-1">Endpoint</p>
                      <code className="text-xs font-mono text-red-400 block break-all">
                        /api/agent
                      </code>
                      <p className="text-xs text-slate-500 mt-1">POST con JSON + API Key</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <KeyRound className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white mb-1">API Key</p>
                      <code className="text-xs font-mono text-red-400 block">AI_API_KEY</code>
                      <p className="text-xs text-slate-500 mt-1">Header: Authorization: Bearer</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Fingerprint className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white mb-1">Tenant ID</p>
                      <code className="text-xs font-mono text-red-400 block truncate">
                        {userInfo.tenantId}
                      </code>
                      <p className="text-xs text-slate-500 mt-1">Incluilo en cada request</p>
                    </div>
                  </div>
                </div>

                {/* Prompt principal */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">
                      Prompt para tu asistente de IA
                    </p>
                    <button
                      onClick={() => copyToClipboard(buildAiPrompt(userInfo.tenantId), 'prompt')}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copied === 'prompt' ? (
                        <><Check className="h-3.5 w-3.5 text-green-500" /><span className="text-green-500">Copiado</span></>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" />Copiar</>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-900/70 rounded-lg p-3 sm:p-4 border border-slate-700 overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed select-all">
                    {buildAiPrompt(userInfo.tenantId)}
                  </pre>
                </div>

                {/* ZAPIA */}
                <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 sm:p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Recomendación: ZAPIA</h3>
                      <p className="text-xs text-slate-400">Creá agentes de IA personalizados sin programar</p>
                    </div>
                    <a
                      href="https://zapia.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-xs text-green-500 hover:text-green-400 transition-colors font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />Ir
                    </a>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-300">Prompt para ZAPIA</p>
                    <button
                      onClick={() => copyToClipboard(buildZapiaPrompt(userInfo.tenantId), 'zapia')}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copied === 'zapia' ? (
                        <><Check className="h-3.5 w-3.5 text-green-500" /><span className="text-green-500">Copiado</span></>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" />Copiar</>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-900/70 rounded-lg p-3 border border-slate-700 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed select-all">
                    {buildZapiaPrompt(userInfo.tenantId)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
