'use client'

import { useCallback, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface MagicCardProps {
  children: React.ReactNode
  className?: string
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
  style?: React.CSSProperties
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = 'rgba(74, 222, 128, 0.15)',
  gradientOpacity = 0,
  style,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: -gradientSize, y: -gradientSize })
  const [opacity, setOpacity] = useState(gradientOpacity)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setOpacity(1)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setOpacity(gradientOpacity)
    setMousePosition({ x: -gradientSize, y: -gradientSize })
  }, [gradientOpacity, gradientSize])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('relative overflow-hidden rounded-2xl', className)}
      style={style}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${gradientSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientColor}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  )
}
