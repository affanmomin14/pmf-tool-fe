'use client'

import { useRef } from 'react'

import { cn } from '@/lib/utils'

interface BackgroundBeamsProps {
  className?: string
}

export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const beams = [
    { x1: '10%', x2: '35%', delay: 0, duration: 7 },
    { x1: '25%', x2: '50%', delay: 1.5, duration: 9 },
    { x1: '45%', x2: '70%', delay: 3, duration: 8 },
    { x1: '60%', x2: '85%', delay: 0.8, duration: 10 },
    { x1: '75%', x2: '95%', delay: 2.2, duration: 7.5 },
    { x1: '15%', x2: '45%', delay: 4, duration: 8.5 },
    { x1: '55%', x2: '80%', delay: 1, duration: 9.5 },
    { x1: '85%', x2: '100%', delay: 3.5, duration: 6.5 },
  ]

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 23, 42, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 1) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Beams */}
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
            <stop offset="40%" stopColor="rgba(16, 185, 129, 0.06)" />
            <stop offset="60%" stopColor="rgba(13, 148, 136, 0.04)" />
            <stop offset="100%" stopColor="rgba(13, 148, 136, 0)" />
          </linearGradient>
        </defs>
        {beams.map((beam, i) => (
          <line
            key={i}
            x1={beam.x1}
            y1="0"
            x2={beam.x2}
            y2="100%"
            stroke="url(#beam-gradient)"
            strokeWidth="1"
            opacity="0.5"
          >
            <animate
              attributeName="opacity"
              values="0;0.6;0"
              dur={`${beam.duration}s`}
              begin={`${beam.delay}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}
      </svg>

      {/* Floating orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full left-1/4 -top-48"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          animation: 'float-slow 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full right-1/4 top-1/3"
        style={{
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.04) 0%, transparent 70%)',
          animation: 'float-slow 10s ease-in-out infinite 2s',
        }}
      />
    </div>
  )
}
