'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface LampEffectProps {
  children: React.ReactNode
  className?: string
}

export function LampEffect({ children, className }: LampEffectProps) {
  return (
    <div
      className={cn('relative flex flex-col items-center justify-center overflow-hidden w-full pt-24 pb-16', className)}
    >
      {/* Ambient glow — light-theme-friendly */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Primary radial glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[30%]"
          style={{
            width: '56rem',
            height: '24rem',
            background:
              'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, rgba(13,148,136,0.06) 40%, transparent 70%)',
          }}
        />

        {/* Secondary accent orb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute top-8 left-1/2 -translate-x-1/2"
          style={{
            width: '32rem',
            height: '12rem',
            background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Thin accent line */}
        <motion.div
          initial={{ width: '0rem', opacity: 0 }}
          animate={{ width: '18rem', opacity: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
          className="absolute top-[11rem] left-1/2 -translate-x-1/2 h-[1px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(16,185,129,0.35), rgba(13,148,136,0.35), transparent)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
