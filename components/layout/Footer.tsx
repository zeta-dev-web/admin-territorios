'use client';

import { Code2, MapPin, CalendarDays } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-recursos relative border-t">
      {/* Efecto de brillo superior */}
      <div className="footer-glow-top absolute top-0 left-0 right-0 h-px"></div>
      
      {/* Grid de fondo tecnológico */}
      <div className="footer-grid absolute inset-0 opacity-5">
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
              <div className="footer-brand-glow absolute inset-2 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <BrandMark size={52} className="relative h-[52px] w-[52px]" />
            </div>
            
            <div className="text-left">
              <h3 className="footer-title text-lg font-bold">
                Recursos App
              </h3>
              <p className="footer-subtitle text-xs flex items-center gap-1.5 mt-0.5">
                <Code2 className="w-3 h-3" />
                Sistema unificado de congregación
              </p>
            </div>
          </div>

          {/* Sección central - Propósito del sistema */}
          <div className="hidden lg:flex items-center gap-8 text-xs">
            <div className="footer-feature footer-feature--territorios flex items-center gap-2 transition-colors cursor-default">
              <MapPin className="w-4 h-4" />
              <span>Gestión de Territorios</span>
            </div>
            <div className="footer-feature footer-feature--vymc flex items-center gap-2 transition-colors cursor-default">
              <CalendarDays className="w-4 h-4" />
              <span>Gestión de VYMC</span>
            </div>
            <div className="footer-feature footer-feature--ia flex items-center gap-2 transition-colors cursor-default">
              <Code2 className="w-4 h-4" />
              <span>Integración con IA</span>
            </div>
          </div>

          {/* Sección derecha - Copyright */}
          <div className="text-center md:text-right">
            <p className="footer-copyright text-sm font-medium mb-1">
              © {currentYear} Todos los derechos reservados
            </p>
            <div className="flex items-center justify-center md:justify-end gap-2">
              <span className="footer-dev-label text-xs">Desarrollado por</span>
              <div className="footer-dev-badge group relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all">
                <div className="footer-dev-shine absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                <Code2 className="footer-dev-icon w-3.5 h-3.5 relative z-10" />
                <span className="footer-dev-name text-sm font-bold relative z-10">
                  Zeta Dev
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea decorativa inferior */}
        <div className="footer-bottom mt-6 pt-4 border-t">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="footer-version cursor-default">
              Versión 3.0
            </span>
            <span className="footer-separator">•</span>
            <a
              href="/terminos-y-condiciones"
              className="footer-link transition-colors"
            >
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>

      {/* Efecto de brillo inferior animado */}
      <div className="footer-glow-bottom absolute bottom-0 left-1/4 right-1/4 h-px animate-pulse"></div>
    </footer>
  );
}
