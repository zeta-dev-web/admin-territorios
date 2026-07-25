'use client'

import { useState } from 'react'
import { AlertTriangle, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { acceptTerms } from '@/server/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function TermsModal() {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50
    if (isAtBottom && !hasScrolled) {
      setHasScrolled(true)
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const result = await acceptTerms()
      if (result.success) {
        toast.success('Términos aceptados correctamente')
        router.refresh()
      } else {
        toast.error(result.message || 'Error al aceptar términos')
      }
    } catch (error) {
      toast.error('Error al aceptar términos')
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1729] rounded-xl border border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Términos y Condiciones</h2>
              <p className="text-sm text-slate-400">
                Por favor, lee y acepta los términos antes de continuar
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onScroll={handleScroll}
        >
          {/* Advertencia importante */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Importante</h3>
                <p className="text-sm text-slate-300">
                  Al continuar, aceptas los siguientes términos y condiciones. Lee cuidadosamente 
                  antes de aceptar.
                </p>
              </div>
            </div>
          </div>

          {/* Términos resumidos */}
          <div className="space-y-4">
            <section className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Responsabilidad sobre los Datos
              </h3>
              <div className="space-y-2 text-sm text-slate-300 ml-8">
                <p className="font-semibold text-white">
                  Es tu responsabilidad exclusiva:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Mantener <strong>copias de respaldo (backups)</strong> de todos los datos</li>
                  <li>Exportar periódicamente la información a formatos externos</li>
                  <li>Verificar la exactitud de los datos ingresados</li>
                </ul>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
                  <p className="font-semibold text-red-300 text-xs">
                    ⚠️ NO garantizamos la integridad, disponibilidad ni permanencia de los datos almacenados.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Limitación de Responsabilidad
              </h3>
              <div className="text-sm text-slate-300 ml-8">
                <p className="mb-2">
                  <strong>Zeta Dev NO se hace responsable</strong> por:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Pérdida, corrupción o eliminación de datos</li>
                  <li>Errores en cálculos, reportes o exportaciones</li>
                  <li>Interrupciones del servicio o caídas del sistema</li>
                  <li>Accesos no autorizados o brechas de seguridad</li>
                </ul>
              </div>
            </section>

            <section className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Protección de Datos y Privacidad
              </h3>
              <div className="text-sm text-slate-300 ml-8">
                <p>
                  Eres el <strong>único responsable</strong> del cumplimiento de las leyes de protección 
                  de datos personales (GDPR, CCPA, LOPD, etc.) en tu jurisdicción.
                </p>
              </div>
            </section>

            <section className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                Naturaleza del Sistema
              </h3>
              <div className="text-sm text-slate-300 ml-8">
                <p>
                  El sistema se proporciona <strong>"TAL CUAL ES" (AS IS)</strong> sin garantías de ningún tipo. 
                  Puede presentar fallas técnicas, errores o comportamientos inesperados.
                </p>
              </div>
            </section>
          </div>

          {/* Link a términos completos */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              📄 Para leer los términos completos, visita:{' '}
              <a
                href="/terminos-y-condiciones"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Términos y Condiciones
              </a>
            </p>
          </div>

          {!hasScrolled && (
            <div className="text-center text-sm text-slate-400 py-2">
              ↓ Desplázate hacia abajo para continuar ↓
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="p-6 border-t border-slate-800">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAccept}
              disabled={!hasScrolled || isAccepting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {hasScrolled ? 'Acepto los Términos y Condiciones' : 'Lee hasta el final para continuar'}
                </>
              )}
            </button>
            
            {!hasScrolled && (
              <p className="text-xs text-center text-slate-500">
                Debes leer los términos completos antes de aceptar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
