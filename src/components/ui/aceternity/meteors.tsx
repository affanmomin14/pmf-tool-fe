'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

interface MeteorsProps {
  number?: number
  className?: string
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, i) => ({
        id: i,
        left: `${round2(seededRandom(i * 11 + 1) * 100)}%`,
        delay: `${round2(seededRandom(i * 19 + 2) * 5)}s`,
        duration: `${round2(seededRandom(i * 23 + 3) * 3 + 2)}s`,
        size: round2(seededRandom(i * 29 + 4) * 1 + 0.5),
        trailWidth: round2(50 + seededRandom(i * 37 + 5) * 80),
      })),
    [number],
  )

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {meteors.map(meteor => (
        <span
          key={meteor.id}
          className="absolute rotate-[215deg]"
          style={{
            top: '-5%',
            left: meteor.left,
            width: `${meteor.size}px`,
            height: `${meteor.size}px`,
            borderRadius: '9999px',
            background: '#10B981',
            boxShadow: `0 0 0 1px rgba(16, 185, 129, 0.05), 0 0 ${meteor.size * 2}px rgba(16, 185, 129, 0.15)`,
            animation: `meteor-fall ${meteor.duration} ${meteor.delay} linear infinite`,
          }}
        >
          <span
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              width: `${meteor.trailWidth}px`,
              height: `${meteor.size * 0.6}px`,
              right: '100%',
              background: 'linear-gradient(to right, transparent, rgba(16, 185, 129, 0.15))',
              borderRadius: '999px',
            }}
          />
        </span>
      ))}
    </div>
  )
}
