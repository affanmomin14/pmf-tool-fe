'use client'

import { useState, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'

interface MultiStepLoaderProps {
  steps: { text: string }[]
  loading: boolean
  duration?: number
  onComplete?: () => void
  className?: string
}

export function MultiStepLoader({ steps, loading, duration = 1200, onComplete, className }: MultiStepLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!loading) return
    if (currentStep >= steps.length) {
      onComplete?.()
      return
    }
    const timeout = setTimeout(() => {
      setCurrentStep(prev => prev + 1)
    }, duration)
    return () => clearTimeout(timeout)
  }, [currentStep, loading, steps.length, duration, onComplete])

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const status = index < currentStep ? 'complete' : index === currentStep ? 'active' : 'pending'
          return (
            <motion.div
              key={step.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Step indicator */}
              <div className="relative flex items-center justify-center w-7 h-7 shrink-0">
                <AnimatePresence mode="wait">
                  {status === 'complete' ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : status === 'active' ? (
                    <motion.div key="active" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative">
                      <div className="w-7 h-7 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      className="w-7 h-7 rounded-full border-2 border-border flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step text */}
              <span
                className={cn(
                  'text-[13px] transition-colors duration-300',
                  status === 'complete' && 'text-emerald-600 font-medium',
                  status === 'active' && 'text-foreground font-semibold',
                  status === 'pending' && 'text-muted-foreground/50',
                )}
              >
                {step.text}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
