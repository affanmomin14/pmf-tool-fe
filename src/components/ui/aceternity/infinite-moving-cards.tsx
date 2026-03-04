'use client'

import { useEffect, useRef, useCallback } from 'react'

import { cn } from '@/lib/utils'

interface InfiniteMovingCardsProps {
  items: {
    quote: string
    name: string
    role: string
    metric?: string
  }[]
  direction?: 'left' | 'right'
  speed?: 'fast' | 'normal' | 'slow'
  pauseOnHover?: boolean
  className?: string
}

export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLUListElement>(null)

  const setupAnimation = useCallback(() => {
    if (!containerRef.current || !scrollerRef.current) return
    const scrollerContent = Array.from(scrollerRef.current.children)
    scrollerContent.forEach(item => {
      const duplicatedItem = item.cloneNode(true)
      scrollerRef.current?.appendChild(duplicatedItem)
    })

    const animationDuration = speed === 'fast' ? '20s' : speed === 'normal' ? '40s' : '80s'
    containerRef.current.style.setProperty('--animation-duration', animationDuration)
    containerRef.current.style.setProperty('--animation-direction', direction === 'left' ? 'forwards' : 'reverse')
    scrollerRef.current.classList.add('animate-scroll')
  }, [direction, speed])

  useEffect(() => {
    setupAnimation()
  }, [setupAnimation])

  return (
    <div
      ref={containerRef}
      className={cn(
        'scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap',
          pauseOnHover && 'hover:[animation-play-state:paused]',
        )}
      >
        {items.map(item => (
          <li key={item.name} className="w-[350px] max-w-full relative flex-shrink-0 card-elevated px-8 py-6">
            {item.metric && (
              <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 mb-3">
                {item.metric}
              </span>
            )}
            <blockquote>
              <p className="text-[14px] leading-relaxed text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
            </blockquote>
            <div className="flex items-center gap-3 mt-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #0F172A, #334155)' }}
              >
                {item.name[0]}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">{item.role}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
