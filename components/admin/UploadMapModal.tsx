'use client'

import { useState } from 'react'
import { X, Link, Loader2, Image as ImageIcon, ExternalLink, AlertCircle } from 'lucide-react'
import { createOrUpdateMap } from '@/server'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface UploadMapModalProps {
  type: 'GENERAL' | 'GROUP'
  groupId?: string
  groupName?: string
  onClose: () => void
}

export function UploadMapModal({ type, groupId, groupName, onClose }: UploadMapModalProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [frontUrl, setFrontUrl] = useState('')
  const [backUrl, setBackUrl] = useState('')
  const [frontError, setFrontError] = useState(false)
  const [backError, setBackError] = useState(false)

  const title = type === 'GENERAL' ? 'Mapa General' : `Mapa de ${groupName || 'Grupo'}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!frontUrl.trim() || !backUrl.trim()) {
      toast.error('Debes ingresar ambas URLs')
      return
    }

    // Validar formato URL
    try {
      new URL(frontUrl)
      new URL(backUrl)
    } catch {
      toast.error('Una de las URLs no tiene un formato válido')
      return
    }

    setIsSaving(true)

    try {
      const result = await createOrUpdateMap(
        type,
        frontUrl.trim(),
        backUrl.trim(),
        groupId
      )

      if (result.success) {
        toast.success(result.message)
        onClose()
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error al guardar mapa:', error)
      toast.error('Error al guardar el mapa')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#0F1729] z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">Ingresa las URLs externas de las imágenes</p>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">¿Cómo obtener la URL directa?</p>
              <p>
                Subí tus imágenes a Google Drive, Dropbox, Imgur o cualquier servicio similar
                y pega acá el enlace directo a la imagen.
              </p>
              <p className="mt-1">
                <strong>Google Drive:</strong> Compartí el archivo → 
                <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs mx-1">
                  https://drive.google.com/uc?export=view&amp;id=FILE_ID
                </code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                URL Imagen Frontal *
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="url"
                  value={frontUrl}
                  onChange={(e) => { setFrontUrl(e.target.value); setFrontError(false) }}
                  onError={() => setFrontError(true)}
                  placeholder="https://example.com/mapa-frente.jpg"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  disabled={isSaving}
                />
              </div>
              {frontUrl && !frontError && (
                <div className="mt-2 aspect-[3/4] bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={frontUrl}
                    alt="Vista previa frontal"
                    className="w-full h-full object-contain"
                    onError={() => setFrontError(true)}
                  />
                </div>
              )}
              {frontError && frontUrl && (
                <p className="text-xs text-red-400 mt-1">No se pudo cargar la vista previa. Verificá que la URL sea correcta.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                URL Imagen Trasera *
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="url"
                  value={backUrl}
                  onChange={(e) => { setBackUrl(e.target.value); setBackError(false) }}
                  onError={() => setBackError(true)}
                  placeholder="https://example.com/mapa-reverso.jpg"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  disabled={isSaving}
                />
              </div>
              {backUrl && !backError && (
                <div className="mt-2 aspect-[3/4] bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={backUrl}
                    alt="Vista previa trasera"
                    className="w-full h-full object-contain"
                    onError={() => setBackError(true)}
                  />
                </div>
              )}
              {backError && backUrl && (
                <p className="text-xs text-red-400 mt-1">No se pudo cargar la vista previa. Verificá que la URL sea correcta.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !frontUrl.trim() || !backUrl.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:from-slate-700 disabled:to-slate-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5" />
                  <span>Guardar Mapa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
