'use client'

import { useRef } from 'react'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'

import { cn } from '@/lib/utils'

interface HeroHighlightProps {
  children: React.ReactNode
  className?: string
  containerClassName?: string
}

export function HeroHighlight({ children, className, containerClassName }: HeroHighlightProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={cn('relative group', containerClassName)}>
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.06),
              transparent 80%
            )
          `,
        }}
      />
      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  )
}

interface HighlightProps {
  children: React.ReactNode
  className?: string
}

export function Highlight({ children, className }: HighlightProps) {
  return (
    <motion.span
      initial={{ backgroundSize: '0% 100%' }}
      whileInView={{ backgroundSize: '100% 100%' }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.5 }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        'relative inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-emerald-200/60 via-teal-200/60 to-cyan-200/60',
        className,
      )}
    >
      {children}
    </motion.span>
  )
}
