'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ShimmerButtonProps {
  className?: string
  children?: ReactNode
  onClick?: () => void
  'aria-label'?: string
}

export function ShimmerButton({ className, children, onClick, ...props }: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center gap-2.5 overflow-hidden',
        'px-8 py-4 text-[15px] font-semibold text-white cursor-pointer',
        'rounded-full transition-all duration-300 ease-out',
        'hover:-translate-y-[2px] hover:shadow-[0_16px_40px_-8px_rgba(16,185,129,0.4)]',
        'active:translate-y-[1px] active:scale-[0.98]',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25), 0 2px 6px rgba(15, 23, 42, 0.12)',
        minHeight: '52px',
      }}
      onClick={onClick}
      {...props}
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div
          className="absolute inset-0 -translate-x-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 60%, transparent 100%)',
            animation: 'shimmer-sweep 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Green accent line at top */}
      <div
        className="absolute top-0 left-[20%] right-[20%] h-[1px] opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #10B981 50%, transparent 100%)',
        }}
      />

      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  )
}
