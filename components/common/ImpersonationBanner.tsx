'use client'

import { useState, useEffect } from 'react'
import { checkImpersonating, stopImpersonating } from '@/server/auth'
import { LogOut, Eye, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(false)
  const [targetName, setTargetName] = useState<string | null>(null)
  const [targetEmail, setTargetEmail] = useState<string | null>(null)
  const [stopping, setStopping] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    checkImpersonating().then((result) => {
      if (result.impersonating) {
        setImpersonating(true)
        setTargetName(result.targetName)
        setTargetEmail(result.targetEmail)
        // Animación de entrada
        requestAnimationFrame(() => setVisible(true))
      }
    })
  }, [])

  async function handleStop() {
    setStopping(true)
    const result = await stopImpersonating()
    if (result.success) {
      toast.success('Volviste a tu sesión de administrador')
      window.location.href = '/inicio'
    } else {
      toast.error(result.message)
      setStopping(false)
    }
  }

  if (!impersonating) return null

  return (
    <div
      className={`bg-gradient-to-r from-amber-600 to-orange-600 transition-all duration-500 ease-in-out overflow-hidden ${
        visible ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-2">
        <div className="flex items-center gap-2 text-white/90 text-sm min-w-0">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Vista de usuario <strong className="text-white">{targetName}</strong>
            <span className="text-white/60 ml-1">({targetEmail})</span>
          </span>
        </div>
        <button
          onClick={handleStop}
          disabled={stopping}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 hover:shadow-lg whitespace-nowrap shrink-0"
        >
          {stopping ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <LogOut className="h-3 w-3" />
          )}
          Volver a Admin
        </button>
      </div>
    </div>
  )
}
