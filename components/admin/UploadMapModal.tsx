'use client'

import { useState } from 'react'
import { X, Link, Loader2, Plus, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react'
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
  const [urls, setUrls] = useState<string[]>(['', ''])
  const [errors, setErrors] = useState<Record<number, boolean>>({})

  const title = type === 'GENERAL' ? 'Mapa General' : `Mapa de ${groupName || 'Grupo'}`

  const addUrl = () => {
    setUrls([...urls, ''])
  }

  const removeUrl = (index: number) => {
    if (urls.length <= 1) return
    setUrls(urls.filter((_, i) => i !== index))
    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
    setErrors(prev => ({ ...prev, [index]: false }))
  }

  const markError = (index: number) => {
    setErrors(prev => ({ ...prev, [index]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validUrls = urls.filter(u => u.trim())
    if (validUrls.length === 0) {
      toast.error('Debes ingresar al menos una URL')
      return
    }

    // Validar formato URL
    for (const url of validUrls) {
      try {
        new URL(url)
      } catch {
        toast.error(`URL inválida: ${url}`)
        return
      }
    }

    setIsSaving(true)

    try {
      const result = await createOrUpdateMap(
        type,
        validUrls,
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

      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#0F1729] z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">
              Agregá URLs de imágenes — podés poner 1, 2, 5, las que quieras
            </p>
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
                y pega acá el enlace directo.
              </p>
              <p className="mt-1">
                <strong>Google Drive:</strong> Compartí el archivo →{' '}
                <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">
                  https://drive.google.com/uc?export=view&amp;id=FILE_ID
                </code>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {urls.map((url, index) => (
              <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Imagen {index + 1}
                  </label>
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrl(index)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Quitar imagen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://example.com/imagen.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    disabled={isSaving}
                  />
                </div>
                {url && !errors[index] && (
                  <div className="mt-2 aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                    <img
                      src={url}
                      alt={`Vista previa ${index + 1}`}
                      className="w-full h-full object-contain"
                      onError={() => markError(index)}
                    />
                  </div>
                )}
                {errors[index] && url && (
                  <p className="text-xs text-red-400 mt-1">
                    No se pudo cargar la vista previa. Verificá que la URL sea correcta.
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addUrl}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar otra imagen
          </button>

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
              disabled={isSaving || urls.every(u => !u.trim())}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:from-slate-700 disabled:to-slate-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-5 w-5" />
                  <span>Guardar {urls.filter(u => u.trim()).length} imagen{urls.filter(u => u.trim()).length !== 1 ? 'es' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
