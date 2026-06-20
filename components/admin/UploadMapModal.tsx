'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { createOrUpdateMap, uploadMapImage } from '@/server'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface UploadMapModalProps {
  type: 'GENERAL' | 'GROUP'
  groupId?: string
  onClose: () => void
}

export function UploadMapModal({ type, groupId, onClose }: UploadMapModalProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (side === 'front') {
        setFrontPreview(reader.result as string)
      } else {
        setBackPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!frontInputRef.current?.files?.[0] || !backInputRef.current?.files?.[0]) {
      toast.error('Debes seleccionar ambas imágenes')
      return
    }

    setIsUploading(true)

    try {
      const frontFile = frontInputRef.current.files[0]
      const backFile = backInputRef.current.files[0]

      const timestamp = Date.now()
      const frontFilename = `${type.toLowerCase()}_${groupId || 'general'}_front_${timestamp}.${frontFile.name.split('.').pop()}`
      const backFilename = `${type.toLowerCase()}_${groupId || 'general'}_back_${timestamp}.${backFile.name.split('.').pop()}`

      const frontFormData = new FormData()
      frontFormData.append('file', frontFile)
      const frontUploadResult = await uploadMapImage(frontFormData, frontFilename)

      if (!frontUploadResult.success) {
        throw new Error('Error al subir imagen frontal')
      }

      const backFormData = new FormData()
      backFormData.append('file', backFile)
      const backUploadResult = await uploadMapImage(backFormData, backFilename)

      if (!backUploadResult.success) {
        throw new Error('Error al subir imagen trasera')
      }

      const result = await createOrUpdateMap(
        type,
        frontUploadResult.path!,
        backUploadResult.path!,
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
      console.error('Error al subir mapas:', error)
      toast.error('Error al subir las imágenes')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isUploading && onClose()}
      />

      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#0F1729] z-10">
          <div>
            <h2 className="text-xl font-bold text-white">
              {type === 'GENERAL' ? 'Mapa General' : 'Mapa de Grupo'}
            </h2>
            <p className="text-sm text-slate-400">Sube las imágenes del frente y reverso</p>
          </div>
          <button
            onClick={() => !isUploading && onClose()}
            disabled={isUploading}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Imagen Frontal *
              </label>
              <div
                onClick={() => frontInputRef.current?.click()}
                className="relative aspect-[3/4] bg-slate-800 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors cursor-pointer overflow-hidden group"
              >
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt="Vista previa frontal"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                    <Upload className="h-12 w-12 mb-2" />
                    <p className="text-sm font-medium">Click para subir</p>
                    <p className="text-xs mt-1">PNG, JPG o WEBP</p>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'front')}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Imagen Trasera *
              </label>
              <div
                onClick={() => backInputRef.current?.click()}
                className="relative aspect-[3/4] bg-slate-800 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors cursor-pointer overflow-hidden group"
              >
                {backPreview ? (
                  <img
                    src={backPreview}
                    alt="Vista previa trasera"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                    <Upload className="h-12 w-12 mb-2" />
                    <p className="text-sm font-medium">Click para subir</p>
                    <p className="text-xs mt-1">PNG, JPG o WEBP</p>
                  </div>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'back')}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !frontPreview || !backPreview}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:from-slate-700 disabled:to-slate-800"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-5 w-5" />
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
