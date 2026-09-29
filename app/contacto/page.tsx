'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/common/AppLayout'
import { getCurrentUserCongregation, getCurrentUserInfo } from '@/server/auth'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const CONTACT_PHONE = (process.env.NEXT_PUBLIC_TELEFONO_CONTACTO || '').replace(/\D/g, '')

const MOTIVOS = [
  'Consulta general',
  'Error o problema',
  'Sugerencia',
  'Otro',
] as const

export default function ContactoPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [congregacion, setCongregacion] = useState('')
  const [motivo, setMotivo] = useState<string>(MOTIVOS[0])
  const [mensaje, setMensaje] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getCurrentUserInfo(), getCurrentUserCongregation()])
      .then(([info, cong]) => {
        if (!active) return
        if (info) {
          setEmail(info.email)
          setNombre(info.email.split('@')[0])
        }
        if (cong) setCongregacion(cong)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingInfo(false)
      })
    return () => {
      active = false
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      toast.error('Completá nombre, email y mensaje')
      return
    }
    if (mensaje.trim().length < 10) {
      toast.error('El mensaje es muy corto (mínimo 10 caracteres)')
      return
    }
    if (!CONTACT_PHONE) {
      toast.error('El contacto por WhatsApp no está configurado')
      return
    }

    setSending(true)
    const texto = [
      'Hola, escribo desde la app Territorios por el siguiente motivo:',
      '',
      `• Nombre: ${nombre.trim()}`,
      `• Email: ${email.trim()}`,
      congregacion.trim() ? `• Congregación: ${congregacion.trim()}` : null,
      `• Motivo: ${motivo}`,
      '',
      mensaje.trim(),
    ]
      .filter((line) => line !== null)
      .join('\n')

    window.open(`https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(texto)}`, '_blank')
    toast.success('Se abrió WhatsApp con tu mensaje listo para enviar')
    setSending(false)
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm px-4 py-2.5 disabled:opacity-50'
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5'

  return (
    <AppLayout title="Contacto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Contacto / Soporte</h1>
            <p className="text-sm text-slate-400">
              Completá el formulario y se abrirá WhatsApp con tu mensaje listo
            </p>
          </div>
        </div>

        {!CONTACT_PHONE && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            El contacto por WhatsApp no está configurado en este momento.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#0F1729] rounded-xl border border-slate-800 p-5 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contacto-nombre" className={labelClass}>
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                id="contacto-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                disabled={loadingInfo}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contacto-email" className={labelClass}>
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="contacto-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loadingInfo}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contacto-congregacion" className={labelClass}>
                Congregación
              </label>
              <input
                id="contacto-congregacion"
                type="text"
                value={congregacion}
                onChange={(e) => setCongregacion(e.target.value)}
                placeholder="Tu congregación"
                disabled={loadingInfo}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contacto-motivo" className={labelClass}>
                Motivo
              </label>
              <select
                id="contacto-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="contacto-mensaje" className={labelClass}>
              Mensaje <span className="text-red-400">*</span>
            </label>
            <textarea
              id="contacto-mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Contanos en qué te podemos ayudar..."
              rows={5}
              minLength={10}
              className={`${inputClass} resize-y min-h-28`}
            />
          </div>

          <button
            type="submit"
            disabled={sending || !CONTACT_PHONE}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Abriendo WhatsApp...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar por WhatsApp
              </>
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
