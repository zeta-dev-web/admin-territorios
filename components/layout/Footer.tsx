'use client';

import { Code2, Shield, Cpu } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-[#0A0F1C] via-[#0F1729] to-[#0A0F1C] border-t border-slate-800/50">
      {/* Efecto de brillo superior */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      {/* Grid de fondo tecnológico */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(59, 130, 246) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(59, 130, 246) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contenido principal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Sección izquierda - Branding */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-2 bg-cyan-400 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <BrandMark size={52} className="relative h-[52px] w-[52px]" />
            </div>
            
            <div className="text-left">
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Territorios App
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3 h-3" />
                Sistema de gestión de territorios para congregaciones
              </p>
            </div>
          </div>

          {/* Sección central - Propósito del sistema */}
          <div className="hidden lg:flex items-center gap-8 text-xs">
            <div className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors cursor-default">
              <Cpu className="w-4 h-4" />
              <span>Gestión de Territorios</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-default">
              <Code2 className="w-4 h-4" />
              <span>Integración con IA</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-default">
              <Shield className="w-4 h-4" />
              <span>Exportación a formulario S-13-S</span>
            </div>
          </div>

          {/* Sección derecha - Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-300 font-medium mb-1">
              © {currentYear} Todos los derechos reservados
            </p>
            <div className="flex items-center justify-center md:justify-end gap-2">
              <span className="text-xs text-slate-400">Desarrollado por</span>
              <div className="group relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-cyan-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                <Code2 className="w-3.5 h-3.5 text-blue-400 relative z-10" />
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 relative z-10">
                  Zeta Dev
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea decorativa inferior */}
        <div className="mt-6 pt-4 border-t border-slate-800/50">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="hover:text-slate-400 transition-colors cursor-default">
              Versión 2.0
            </span>
            <span className="text-slate-700">•</span>
            <a
              href="/terminos-y-condiciones"
              className="hover:text-slate-300 transition-colors"
            >
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>

      {/* Efecto de brillo inferior animado */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-pulse"></div>
    </footer>
  );
}
