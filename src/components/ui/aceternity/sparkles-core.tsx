'use client'

import { useRef, useEffect, useCallback } from 'react'

import { cn } from '@/lib/utils'

interface SparklesCoreProps {
    className?: string
    background?: string
    minSize?: number
    maxSize?: number
    particleDensity?: number
    particleColor?: string
    speed?: number
}

export function SparklesCore({
    className,
    background = 'transparent',
    minSize = 0.4,
    maxSize = 1.4,
    particleDensity = 120,
    particleColor = '#10B981',
    speed = 1,
}: SparklesCoreProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(undefined)
    const particles = useRef<Particle[]>([])
    const mousePos = useRef({ x: 0, y: 0 })

    interface Particle {
        x: number
        y: number
        size: number
        speedX: number
        speedY: number
        opacity: number
        opacitySpeed: number
        maxOpacity: number
    }

    const initParticles = useCallback(
        (width: number, height: number) => {
            particles.current = Array.from({ length: particleDensity }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * (maxSize - minSize) + minSize,
                speedX: (Math.random() - 0.5) * 0.3 * speed,
                speedY: (Math.random() - 0.5) * 0.3 * speed,
                opacity: Math.random() * 0.3,
                opacitySpeed: (Math.random() * 0.006 + 0.002) * speed,
                maxOpacity: Math.random() * 0.35 + 0.1,
            }))
        },
        [particleDensity, maxSize, minSize, speed],
    )

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resizeCanvas = () => {
            const rect = canvas.parentElement?.getBoundingClientRect()
            if (!rect) return
            canvas.width = rect.width
            canvas.height = rect.height
            initParticles(canvas.width, canvas.height)
        }

        resizeCanvas()

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        }

        canvas.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('resize', resizeCanvas)

        const animate = () => {
            if (!ctx || !canvas) return

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.current.forEach(p => {
                p.x += p.speedX
                p.y += p.speedY

                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                p.opacity += p.opacitySpeed
                if (p.opacity >= p.maxOpacity || p.opacity <= 0.03) {
                    p.opacitySpeed = -p.opacitySpeed
                }

                // Mouse interaction — subtle attraction
                const dx = mousePos.current.x - p.x
                const dy = mousePos.current.y - p.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 100) {
                    const force = (100 - dist) / 100
                    p.x += dx * force * 0.004
                    p.y += dy * force * 0.004
                }

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = particleColor
                ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
                ctx.fill()
            })

            ctx.globalAlpha = 1
            animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            canvas.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [initParticles, particleColor])

    return (
        <div className={cn('relative w-full h-full', className)} style={{ background }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    )
}
