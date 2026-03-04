'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

interface ShootingStarsProps {
  className?: string
  starCount?: number
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function ShootingStars({ className, starCount = 12 }: ShootingStarsProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: starCount }, (_, i) => ({
        id: i,
        top: `${round2(seededRandom(i * 7 + 1) * 60)}%`,
        left: `${round2(seededRandom(i * 13 + 2) * 100)}%`,
        delay: `${round2(seededRandom(i * 17 + 3) * 8)}s`,
        duration: `${round2(seededRandom(i * 23 + 4) * 2 + 1.5)}s`,
        size: round2(seededRandom(i * 29 + 5) * 1.5 + 0.5),
        opacity: round2(seededRandom(i * 31 + 6) * 0.3 + 0.1),
      })),
    [starCount],
  )

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size * 80}px`,
            background: `linear-gradient(to bottom, rgba(16, 185, 129, ${star.opacity}), transparent)`,
            borderRadius: '999px',
            transform: 'rotate(-45deg)',
            animation: `shooting-star ${star.duration} ${star.delay} linear infinite`,
          }}
        />
      ))}
    </div>
  )
}
