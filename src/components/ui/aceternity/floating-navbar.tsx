'use client'

import { useState, useSyncExternalStore } from 'react'

import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'

import { cn } from '@/lib/utils'

interface FloatingNavbarProps {
  navItems: {
    name: string
    link: string
  }[]
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

export function FloatingNavbar({ navItems, ctaLabel = 'Get Started', onCtaClick, className }: FloatingNavbarProps) {
  const { scrollYProgress } = useScroll()
  const [visible, setVisible] = useState(true)

  useMotionValueEvent(scrollYProgress, 'change', current => {
    const prev = scrollYProgress.getPrevious() ?? 0
    const direction = current - prev
    if (current < 0.05) {
      setVisible(true)
    } else {
      setVisible(direction < 0)
    }
  })

  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  )
  if (!mounted) return null

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        initial={{ opacity: 1, y: -100 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex max-w-fit fixed top-6 inset-x-0 mx-auto z-[5000] items-center justify-center gap-1 rounded-full px-2 py-2',
          'border border-border/50 bg-white/80 backdrop-blur-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)]',
          className,
        )}
      >
        {navItems.map(item => (
          <a
            key={item.name}
            href={item.link}
            className="relative px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.name}
          </a>
        ))}

        <button
          onClick={onCtaClick}
          className="relative ml-1 px-4 py-1.5 rounded-full text-[13px] font-medium text-white transition-all hover:shadow-lg cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            minHeight: '36px',
          }}
        >
          {ctaLabel}
        </button>
      </motion.nav>
    </AnimatePresence>
  )
}
