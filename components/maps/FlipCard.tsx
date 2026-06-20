'use client'

import { useState } from 'react'
import { RotateCw, ZoomIn, X } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface FlipCardProps {
  frontImage: string
  backImage: string
  title: string
}

export function FlipCard({ frontImage, backImage, title }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomImage, setZoomImage] = useState<string>('')

  const handleZoom = (image: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setZoomImage(image)
    setIsZoomed(true)
  }

  return (
    <>
      <div className="relative">
        <div className="perspective-1000">
          <div
            className={`flip-card-inner relative w-full aspect-video transition-transform duration-700 transform-style-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="absolute inset-0 backface-hidden">
              <div className="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
                <img
                  src={frontImage}
                  alt={`${title} - Frente`}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={(e) => handleZoom(frontImage, e)}
                  className="absolute top-2 right-2 md:top-4 md:right-4 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                  title="Zoom"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4">
                  <h3 className="text-white font-semibold text-sm md:text-base">{title}</h3>
                  <p className="text-slate-300 text-xs md:text-sm hidden md:block">
                    Click para girar • Click en <ZoomIn className="inline h-3 w-3" /> para zoom
                  </p>
                  <p className="text-slate-300 text-xs md:hidden">
                    Toca para girar • <ZoomIn className="inline h-3 w-3" /> para zoom
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <div className="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
                <img
                  src={backImage}
                  alt={`${title} - Reverso`}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={(e) => handleZoom(backImage, e)}
                  className="absolute top-2 right-2 md:top-4 md:right-4 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                  title="Zoom"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4">
                  <h3 className="text-white font-semibold text-sm md:text-base">{title}</h3>
                  <p className="text-slate-300 text-xs md:text-sm hidden md:block">
                    Click para girar • Click en <ZoomIn className="inline h-3 w-3" /> para zoom
                  </p>
                  <p className="text-slate-300 text-xs md:hidden">
                    Toca para girar • <ZoomIn className="inline h-3 w-3" /> para zoom
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsFlipped(!isFlipped)
          }}
          className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 p-1.5 md:p-2 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-colors z-10"
          title="Girar mapa"
        >
          <RotateCw className="h-4 w-4 md:h-5 md:w-5 text-white" />
        </button>
      </div>

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
                  src={zoomImage}
                  alt="Vista ampliada"
                  className="max-w-[90vw] max-h-[70vh] w-auto h-auto object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>

          <div className="flex-shrink-0 pb-2 md:pb-4 px-2">
            <div className="bg-black/60 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-center mx-auto w-fit pointer-events-none">
              <p className="text-white text-xs md:text-sm">
                <span className="hidden md:inline">Rueda/scroll para zoom • Arrastra para mover • Click fuera para cerrar</span>
                <span className="md:hidden">Pellizca para zoom • Arrastra para mover</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
