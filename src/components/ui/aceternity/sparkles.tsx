'use client'

import { useEffect, useRef, useMemo } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'

interface SparkleType {
  id: string
  x: string
  y: string
  size: number
  delay: number
  duration: number
  color: string
}

interface SparklesProps {
  children?: React.ReactNode
  className?: string
  sparkleCount?: number
  colors?: string[]
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function generateSparkle(seed: number, colors: string[]): SparkleType {
  return {
    id: `sparkle-${seed}`,
    x: `${round2(seededRandom(seed * 7 + 1) * 100)}%`,
    y: `${round2(seededRandom(seed * 13 + 2) * 100)}%`,
    size: round2(seededRandom(seed * 17 + 3) * 3 + 1.5),
    delay: round2(seededRandom(seed * 23 + 4) * 2),
    duration: round2(seededRandom(seed * 29 + 5) * 1.5 + 1),
    color: colors[Math.floor(seededRandom(seed * 31 + 6) * colors.length)],
  }
}

export function Sparkles({
  children,
  className,
  sparkleCount = 15,
  colors = ['#10B981', '#0D9488', '#34D399', '#6EE7B7'],
}: SparklesProps) {
  const sparkles = useMemo(
    () => Array.from({ length: sparkleCount }, (_, i) => generateSparkle(i, colors)),
    [sparkleCount, colors],
  )

  const counterRef = useRef(sparkleCount)

  useEffect(() => {
    // Periodically regenerate sparkles by forcing key changes via DOM
    // This is handled by the animation loop itself — each sparkle has its own delay/duration
  }, [])

  // We use the counter ref for any future regeneration needs
  void counterRef

  return (
    <span className={cn('relative inline-block', className)}>
      <span className="relative z-10">{children}</span>
      <AnimatePresence>
        {sparkles.map(sparkle => (
          <motion.svg
            key={sparkle.id}
            className="absolute pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180] }}
            transition={{
              duration: sparkle.duration,
              delay: sparkle.delay,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: sparkle.duration * 0.5,
            }}
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size * 2,
              height: sparkle.size * 2,
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" fill={sparkle.color} />
          </motion.svg>
        ))}
      </AnimatePresence>
    </span>
  )
}
