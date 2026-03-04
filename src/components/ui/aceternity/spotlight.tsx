'use client'

import { useEffect, useRef } from 'react'

import { motion, useMotionValue, useSpring } from 'framer-motion'

import { cn } from '@/lib/utils'

interface SpotlightProps {
  className?: string
  fill?: string
}

export function Spotlight({ className, fill = 'white' }: SpotlightProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)

  const springX = useSpring(mouseX, { stiffness: 500, damping: 100 })
  const springY = useSpring(mouseY, { stiffness: 500, damping: 100 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={ref} className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}>
      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full opacity-[0.08]"
        style={{
          background: `radial-gradient(circle, ${fill}, transparent 70%)`,
          left: springX,
          top: springY,
          x: '-50%',
          y: '-50%',
        }}
      />
    </div>
  )
}
