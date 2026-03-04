'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls?: string[]
  label?: string
  sublabel?: string
}

export function AvatarCircles({ className, numPeople, avatarUrls = [], label, sublabel }: AvatarCirclesProps) {
  const initials = ['S', 'M', 'A', 'P', 'J']
  const gradients = [
    'from-emerald-400 to-teal-500',
    'from-teal-400 to-cyan-500',
    'from-green-400 to-emerald-500',
    'from-cyan-400 to-blue-500',
  ]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex -space-x-2.5">
        {avatarUrls.length > 0
          ? avatarUrls.map((url, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-background overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                <Image src={url} alt="" width={36} height={36} className="w-full h-full object-cover" />
              </div>
            ))
          : initials.slice(0, 4).map((initial, i) => (
              <div
                key={i}
                className={cn(
                  'w-9 h-9 rounded-full border-2 border-background flex items-center justify-center bg-gradient-to-br text-[11px] font-bold text-white',
                  gradients[i],
                )}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                {initial}
              </div>
            ))}
        {numPeople && (
          <div
            className="w-9 h-9 rounded-full border-2 border-background flex items-center justify-center bg-card text-[10px] font-semibold text-muted-foreground"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            +{numPeople > 999 ? `${(numPeople / 1000).toFixed(0)}k` : numPeople}
          </div>
        )}
      </div>
      {(label || sublabel) && (
        <div>
          {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
          {sublabel && <p className="text-xs text-text-muted">{sublabel}</p>}
        </div>
      )}
    </div>
  )
}
