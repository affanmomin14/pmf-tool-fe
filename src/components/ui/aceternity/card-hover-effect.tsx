'use client'

import { useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface HoverEffectItem {
  id: string
  icon: string
  title: string
  description: string
  count?: number
}

interface HoverEffectProps {
  items: HoverEffectItem[]
  className?: string
  onSelect?: (id: string) => void
  disabled?: boolean
}

export function HoverEffect({ items, className, onSelect, disabled }: HoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((item, idx) => (
        <button
          key={item.id}
          className="relative group block w-full text-left cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          style={{ minHeight: '44px' }}
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => onSelect?.(item.id)}
          disabled={disabled}
          aria-label={`Select ${item.title}`}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 block rounded-2xl bg-secondary/60"
                layoutId="categoryHover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.12 } }}
                exit={{ opacity: 0, transition: { duration: 0.12, delay: 0.05 } }}
              />
            )}
          </AnimatePresence>

          <div
            className={cn(
              'relative z-10 flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-200 border',
              hoveredIndex === idx ? 'border-border bg-transparent translate-x-1' : 'border-transparent bg-card',
            )}
            style={{
              boxShadow: hoveredIndex === idx ? '0 2px 8px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <span className="text-2xl shrink-0" role="img" aria-hidden="true">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground mb-0.5">{item.title}</p>
              <p className="text-[12px] text-muted-foreground">{item.description}</p>
            </div>
            {item.count !== undefined && (
              <div className="shrink-0 text-right">
                <span className="text-[10px] text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full">
                  {item.count.toLocaleString()} checked
                </span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
