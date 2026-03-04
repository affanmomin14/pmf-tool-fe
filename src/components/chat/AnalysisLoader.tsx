'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import { motion, useAnimation, AnimatePresence } from 'framer-motion'

import { PMF_FACTS } from '@/lib/constants'
import React from 'react'

interface AnalysisLoaderProps {
  onComplete: () => void
  pipelineReady?: boolean
}

const FACT_INTERVAL = 5000

/* SVG pulse paths from ReverseUI data-feeding-in */
const paths = [
  'M0 100H55.022C61.8914 100 68.6451 101.769 74.6324 105.137L120.368 130.863C126.355 134.231 133.109 136 139.978 136H201.5',
  'M0 60H48.2171C59.2463 60 69.7861 64.5539 77.3451 72.5854L117.655 115.415C125.214 123.446 135.754 128 146.783 128H201.5',
  'M0 188H55.022C61.8914 188 68.6451 186.231 74.6324 182.863L120.368 157.137C126.355 153.769 133.109 152 139.978 152H201.5',
  'M0 228H48.2171C59.2463 228 69.7861 223.446 77.3451 215.415L117.655 172.585C125.214 164.554 135.754 160 146.783 160H201.5',
  'M0 287H41.7852C56.4929 287 70.0142 278.929 76.994 265.983L118.49 189.017C125.47 176.071 138.991 168 153.699 168H202',
  'M0 144L201 145',
  'M0 1H41.5946C56.3171 1 69.8495 9.08744 76.823 22.0537L118.177 98.9463C125.15 111.913 138.683 120 153.405 120H201.5',
]

/* Column labels for the flowing table */
const TABLE_HEADERS = ['Dimension', 'Score', 'Status']

/* Row data for flowing table — represents analysis dimensions */
const TABLE_ROWS = [
  ['Retention', '72', 'Strong'],
  ['Positioning', '45', 'Emerging'],
  ['Distribution', '28', 'Critical'],
  ['Monetization', '58', 'Growing'],
  ['Market Fit', '63', 'Emerging'],
  ['Moat', '41', 'Attention'],
]

const ease = [0.25, 1, 0.5, 1] as const

export function AnalysisLoader({ onComplete, pipelineReady }: AnalysisLoaderProps) {
  const [factIndex, setFactIndex] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const controls = useAnimation()
  const minAnimDone = useRef(false)
  const pipelineDone = useRef(false)

  // Animate pulse gradients
  useEffect(() => {
    if (!svgRef.current) return

    controls.start({
      x1: ['-50%', '100%'],
      x2: ['50%', '150%'],
      transition: {
        duration: 1.5,
        ease: 'linear',
        repeat: Infinity,
        delay: 0.25,
      },
    })
  }, [controls])

  // Rotate facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % PMF_FACTS.length)
    }, FACT_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Minimum animation time (~11s) before allowing completion
  useEffect(() => {
    const totalDelay = 1250 + TABLE_ROWS.length * 1500 + 800
    const timer = setTimeout(() => {
      minAnimDone.current = true
      if (pipelineDone.current) onComplete()
    }, totalDelay)
    return () => clearTimeout(timer)
  }, [onComplete])

  // When pipeline API is ready, complete if min animation is done
  useEffect(() => {
    if (pipelineReady) {
      pipelineDone.current = true
      if (minAnimDone.current) onComplete()
    }
  }, [pipelineReady, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="w-full"
    >
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="text-center mb-6"
        >
          <h2
            className="text-[1.25rem] sm:text-[1.5rem] tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Analyzing your responses
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Building your personalized PMF report
          </p>
        </motion.div>

        {/* Data Feeding In animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center justify-center mb-6"
        >
          {/* Pulse SVG paths (rotated 90° to flow downward into the table) */}
          <div
            className="h-20 origin-right"
            style={{ transform: 'rotate(90deg) translateX(40px) translateY(0)' }}
          >
            <svg
              width="202"
              className="ml-auto"
              viewBox="0 0 202 288"
              fill="none"
              ref={svgRef}
            >
              {paths.map((d, index) => (
                <React.Fragment key={index}>
                  <path
                    d={d}
                    stroke="#94A3B8"
                    mask="url(#mask)"
                    strokeLinecap="round"
                    strokeOpacity="0.15"
                    strokeWidth="2"
                    strokeDasharray="0.1 3"
                  />
                  <path
                    d={d}
                    stroke={`url(#pulse-${index})`}
                    strokeLinecap="round"
                    strokeOpacity="1"
                    strokeWidth="2"
                    strokeDasharray="0.1 3"
                    mask="url(#mask)"
                  />
                </React.Fragment>
              ))}
              <defs>
                <linearGradient
                  id="maskGrad"
                  x1="202" y1="227" x2="32" y2="227"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <mask id="mask" maskUnits="userSpaceOnUse">
                  <rect width="202" height="288" fill="url(#maskGrad)" />
                </mask>
                {Array.from({ length: 7 }).map((_, index) => (
                  <motion.linearGradient
                    key={index}
                    id={`pulse-${index}`}
                    x1="-100%" y1="0" x2="0" y2="0"
                    gradientUnits="userSpaceOnUse"
                    animate={controls}
                  >
                    <stop offset="0.35" stopColor="#10B981" stopOpacity="0" />
                    <stop offset="0.45" stopColor="#10B981" />
                    <stop offset="0.55" stopColor="#10B981" />
                    <stop offset="0.65" stopColor="#10B981" stopOpacity="0" />
                  </motion.linearGradient>
                ))}
              </defs>
            </svg>
          </div>

          {/* Flowing table */}
          <div
            className="w-full max-w-[400px] overflow-hidden rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              borderColor: 'rgba(226, 232, 240, 0.8)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Window dots */}
            <div className="flex gap-1.5 border-b border-slate-100 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-slate-200" />
              <div className="h-2 w-2 rounded-full bg-slate-200" />
              <div className="h-2 w-2 rounded-full bg-slate-200" />
              <span className="ml-2 text-[10px] text-muted-foreground font-medium">PMF Analysis</span>
            </div>

            {/* Table header */}
            <div className="flex w-full overflow-hidden">
              {TABLE_HEADERS.map((header, index) => (
                <div
                  key={index}
                  className="flex h-9 items-center border-b border-r border-slate-100/80 px-3"
                  style={{ width: index === 0 ? '45%' : index === 1 ? '25%' : '30%' }}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{header}</span>
                </div>
              ))}
            </div>

            {/* Table rows — streaming in */}
            {TABLE_ROWS.map((row, i) => {
              const statusColor = row[2] === 'Strong' || row[2] === 'Growing'
                ? '#10B981'
                : row[2] === 'Critical'
                  ? '#EF4444'
                  : '#F59E0B'

              return (
                <motion.div
                  key={i}
                  className="flex w-full overflow-hidden"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    ease: 'easeOut',
                    delay: 1.25 + i * 1.5,
                    duration: 0.35
                  }}
                >
                  {/* Dimension */}
                  <div
                    className="flex h-10 items-center gap-2 border-b border-r border-slate-100/60 px-3"
                    style={{ width: '45%' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                    <span className="text-[12.5px] text-foreground/80">{row[0]}</span>
                  </div>
                  {/* Score */}
                  <div
                    className="flex h-10 items-center border-b border-r border-slate-100/60 px-3"
                    style={{ width: '25%' }}
                  >
                    <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: statusColor }}>
                      {row[1]}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 ml-0.5">/100</span>
                  </div>
                  {/* Status */}
                  <div
                    className="flex h-10 items-center border-b border-slate-100/60 px-3"
                    style={{ width: '30%' }}
                  >
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${statusColor}15`, color: statusColor }}
                    >
                      {row[2]}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Fact carousel */}
        <div
          className="rounded-xl p-4 min-h-[80px] flex items-center"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(226, 232, 240, 0.6)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={factIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-2">
                Did you know?
              </span>
              <p className="text-[13px] font-semibold text-foreground leading-snug">{PMF_FACTS[factIndex].title}</p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">
                {PMF_FACTS[factIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
