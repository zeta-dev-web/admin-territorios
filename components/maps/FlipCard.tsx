'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface FlipCardProps {
  images: string[]
  title: string
}

export function FlipCard({ images, title }: FlipCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <div className="relative">
        <div className="relative w-full aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
          <img
            src={currentImage}
            alt={`${title} - Imagen ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />

          {/* Navegación */}
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors md:opacity-0 md:group-hover:opacity-100"
                title="Anterior"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors md:opacity-0 md:group-hover:opacity-100"
                title="Siguiente"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </>
          )}

          {/* Zoom */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsZoomed(true) }}
            className="absolute top-2 right-2 md:top-4 md:right-4 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
            title="Zoom"
          >
            <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4">
            <h3 className="text-white font-semibold text-sm md:text-base">{title}</h3>
            {images.length > 1 && (
              <p className="text-slate-300 text-xs md:text-sm">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>
        </div>

        {/* Dots indicadores */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-blue-500 w-4'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal zoom */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-2 right-2 md:top-4 md:right-4 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
            title="Cerrar"
          >
            <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </button>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={4}
              centerOnInit
              centerZoomedOut
              limitToBounds={false}
              panning={{ velocityDisabled: true }}
              doubleClick={{ disabled: false, mode: 'zoomIn' }}
              wheel={{ disabled: false }}
            >
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                <img
                  src={currentImage}
                  alt="Vista ampliada"
                  className="max-w-[90vw] max-h-[70vh] w-auto h-auto object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Navegación en zoom */}
          {images.length > 1 && (
            <div className="flex-shrink-0 pb-4 px-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(e as any) }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <span className="text-white text-sm">
                  {currentIndex + 1} / {images.length}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(e as any) }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>
              <p className="text-white/60 text-xs text-center mt-2">
                <span className="hidden md:inline">Rueda para zoom • Arrastra para mover • Click fuera para cerrar</span>
                <span className="md:hidden">Pellizca para zoom • Arrastra para mover</span>
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
