'use client'

import { useEffect, useRef, useState } from 'react'

import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

import { cn } from '@/lib/utils'

interface TracingBeamProps {
  children: React.ReactNode
  className?: string
}

export function TracingBeam({ children, className }: TracingBeamProps) {
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [svgHeight, setSvgHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  const y1 = useSpring(useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]), {
    stiffness: 500,
    damping: 90,
  })
  const y2 = useSpring(useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]), {
    stiffness: 500,
    damping: 90,
  })

  return (
    <motion.div ref={ref} className={cn('relative w-full max-w-3xl mx-auto', className)}>
      <div className="absolute -left-4 md:-left-12 top-3">
        <motion.div
          transition={{ duration: 0.2, delay: 0.5 }}
          animate={{
            boxShadow: scrollYProgress.get() > 0 ? 'none' : '0 0 0 3px rgba(16, 185, 129, 0.15)',
          }}
          className="ml-[27px] h-4 w-4 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center"
        >
          <motion.div
            transition={{ duration: 0.2, delay: 0.5 }}
            animate={{
              backgroundColor: scrollYProgress.get() > 0 ? '#10B981' : 'white',
            }}
            className="h-2 w-2 rounded-full border border-emerald-300 bg-emerald-500"
          />
        </motion.div>
        <svg viewBox={`0 0 20 ${svgHeight}`} width="20" height={svgHeight} className="ml-4 block" aria-hidden="true">
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            transition={{ duration: 10 }}
          />
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="1.5"
            className="motion-reduce:hidden"
            transition={{ duration: 10 }}
          />
          <defs>
            <motion.linearGradient id="gradient" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={y1} y2={y2}>
              <stop stopColor="#10B981" stopOpacity="0" />
              <stop stopColor="#10B981" />
              <stop offset="0.325" stopColor="#0D9488" />
              <stop offset="1" stopColor="#0D9488" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef}>{children}</div>
    </motion.div>
  )
}
