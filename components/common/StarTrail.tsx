'use client'

import { useEffect, useRef } from 'react'

interface StarParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  color: string
  spin: number
  rotation: number
}

const STAR_COLORS = ['#ffffff', '#ffffff', '#ffffff', '#fda4af', '#93c5fd', '#67e8f9']

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  rotation: number,
  color: string,
  alpha: number
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
  ctx.fillStyle = color
  ctx.beginPath()
  const inner = outer * 0.38
  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (i * Math.PI) / 4
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Estrellas pequeñas que siguen al cursor (respeta prefers-reduced-motion). */
export function StarTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<StarParticle[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastSpawn = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const spawn = (x: number, y: number) => {
      const particles = particlesRef.current
      if (particles.length >= 90) particles.shift()
      const angle = Math.random() * Math.PI * 2
      const speed = 0.35 + Math.random() * 1.15
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.12,
        size: 1.4 + Math.random() * 2.6,
        life: 0,
        maxLife: 480 + Math.random() * 420,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        spin: (Math.random() - 0.5) * 0.14,
        rotation: Math.random() * Math.PI * 2,
      })
    }

    let lastFrame = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(48, now - lastFrame)
      lastFrame = now
      const particles = particlesRef.current
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const p of particles) {
        p.life += dt
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.985
        p.vy *= 0.985
        p.rotation += p.spin
        const t = Math.min(1, p.life / p.maxLife)
        const alpha = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82
        drawStar(ctx, p.x, p.y, p.size * (1 + t * 0.9), p.rotation, p.color, alpha * 0.95)
      }

      particlesRef.current = particles.filter((p) => p.life < p.maxLife)
      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }

    const onMove = (event: MouseEvent) => {
      const now = performance.now()
      if (now - lastSpawn < 22) return
      lastSpawn = now
      const count = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) spawn(event.clientX, event.clientY)
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  )
}
