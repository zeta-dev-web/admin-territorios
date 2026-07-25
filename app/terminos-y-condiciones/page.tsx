import { Shield, AlertTriangle, FileText, Database, Scale } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones - Gestión de Territorios',
  description: 'Términos y condiciones de uso del sistema',
}

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Términos y Condiciones</h1>
              <p className="text-sm text-slate-400 mt-1">
                Última actualización: Enero 2025
              </p>
            </div>
          </div>
        </div>

        {/* Advertencia importante */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Importante</h2>
              <p className="text-sm text-slate-300">
                Al utilizar este sistema, usted acepta los siguientes términos y condiciones. 
                Por favor, léalos cuidadosamente antes de continuar usando la aplicación.
              </p>
            </div>
          </div>
        </div>

        {/* Contenido de términos */}
        <div className="space-y-8">
          {/* 1. Naturaleza del Sistema */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">1. Naturaleza del Sistema</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                El sistema <strong>"Territorios App"</strong> es una herramienta de gestión proporcionada 
                <strong> "TAL CUAL ES"</strong> (AS IS) sin garantías de ningún tipo, ya sean expresas o implícitas.
              </p>
              <p>
                Este software puede presentar <strong>errores, fallas técnicas, interrupciones del servicio, 
                pérdida de datos o comportamientos inesperados</strong> en cualquier momento.
              </p>
            </div>
          </section>

          {/* 2. Responsabilidad sobre los Datos */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">2. Responsabilidad sobre los Datos</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="font-semibold text-white">
                Es RESPONSABILIDAD EXCLUSIVA del usuario:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Mantener copias de respaldo (backups)</strong> de todos los registros, 
                  datos, asignaciones, territorios e información cargada en el sistema.
                </li>
                <li>
                  <strong>Exportar periódicamente</strong> los datos importantes a formatos externos 
                  (PDF, hojas de cálculo, documentos físicos, etc.).
                </li>
                <li>
                  <strong>Verificar la exactitud</strong> de la información ingresada y procesada 
                  por el sistema.
                </li>
                <li>
                  <strong>Implementar sus propios procedimientos</strong> de resguardo y 
                  recuperación de datos.
                </li>
              </ul>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                <p className="font-semibold text-red-300">
                  ⚠️ ADVERTENCIA: No garantizamos la integridad, disponibilidad ni permanencia 
                  de los datos almacenados en el sistema.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Limitación de Responsabilidad */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Scale className="h-4 w-4 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-white">3. Limitación de Responsabilidad</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <strong>Zeta Dev</strong> y los desarrolladores del sistema <strong>NO SE HACEN RESPONSABLES</strong> por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pérdida, corrupción o eliminación de datos por cualquier causa.</li>
                <li>Errores en los cálculos, reportes o exportaciones generadas por el sistema.</li>
                <li>Interrupciones del servicio, caídas del sistema o indisponibilidad temporal o permanente.</li>
                <li>Daños directos, indirectos, incidentales, consecuentes o punitivos derivados del uso o imposibilidad de uso del sistema.</li>
                <li>Accesos no autorizados, brechas de seguridad o vulnerabilidades del sistema.</li>
                <li>Decisiones administrativas, organizativas o de gestión tomadas con base en la información del sistema.</li>
              </ul>
            </div>
          </section>

          {/* 4. Protección de Datos y Privacidad */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">4. Protección de Datos y Privacidad</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                El usuario es <strong>único responsable</strong> del cumplimiento de las leyes aplicables 
                de protección de datos personales en su jurisdicción, incluyendo pero no limitado a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Obtención de consentimientos necesarios para el procesamiento de datos personales.</li>
                <li>Implementación de medidas de seguridad adecuadas.</li>
                <li>Notificación a las autoridades competentes en caso de incidentes de seguridad.</li>
                <li>Garantía de los derechos de acceso, rectificación, cancelación y oposición (ARCO) de los titulares de datos.</li>
              </ul>
              <p className="mt-3">
                <strong>Zeta Dev NO se hace responsable</strong> por el incumplimiento de regulaciones 
                de protección de datos (GDPR, CCPA, LOPD, leyes locales, etc.) por parte del usuario.
              </p>
            </div>
          </section>

          {/* 5. Uso Apropiado */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">5. Uso Apropiado</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>El usuario se compromete a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utilizar el sistema únicamente para los fines para los que fue diseñado.</li>
                <li>No intentar acceder a áreas restringidas o datos de otros usuarios.</li>
                <li>No utilizar el sistema para actividades ilegales o no autorizadas.</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                <li>No realizar ingeniería inversa, descompilar o modificar el sistema.</li>
              </ul>
            </div>
          </section>

          {/* 6. Modificaciones */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">6. Modificaciones del Servicio</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Nos reservamos el derecho de modificar, suspender o discontinuar el sistema (o cualquier 
                parte del mismo) en cualquier momento, con o sin previo aviso.
              </p>
              <p>
                Estos términos y condiciones pueden ser actualizados periódicamente. El uso continuado 
                del sistema después de cualquier cambio constituye la aceptación de los nuevos términos.
              </p>
            </div>
          </section>

          {/* 7. Aceptación */}
          <section className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">7. Aceptación de Términos</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="font-semibold text-white">
                Al utilizar este sistema, usted reconoce que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ha leído, comprendido y aceptado estos términos y condiciones.</li>
                <li>Es consciente de las limitaciones y riesgos del sistema.</li>
                <li>Asume toda la responsabilidad sobre el resguardo de sus datos.</li>
                <li>Exime a Zeta Dev de cualquier responsabilidad relacionada con el uso del sistema.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-400">
              Sistema desarrollado por <strong className="text-blue-400">Zeta Dev</strong>
            </p>
            <p className="text-xs text-slate-500">
              Para consultas o soporte, contacte al administrador de su sistema.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Volver al Sistema
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
