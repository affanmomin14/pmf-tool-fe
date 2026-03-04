'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EmailGateProps {
  onSubmit: (email: string) => void
  disabled: boolean
}

export function EmailGate({ onSubmit, disabled }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    onSubmit(email)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="px-5 py-2"
    >
      <div className="max-w-lg mx-auto">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0F172A, #334155)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Your 9-section report is ready</p>
              <p className="text-[12px] text-muted-foreground">
                Enter your email to unlock charts, scores &amp; PDF download
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="founder@startup.com"
                disabled={disabled}
                className={`rounded-xl h-12 px-4 text-[14px] bg-white transition-colors ${error
                    ? 'border-red-300 focus-visible:ring-red-200'
                    : 'focus-visible:ring-emerald-200 focus-visible:border-emerald-300'
                  }`}
                aria-label="Email address"
                autoComplete="email"
              />
              {isValid && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-red-600">
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={!isValid || disabled}
              className="w-full rounded-xl h-12 text-[14px] font-semibold cursor-pointer text-white shadow-sm hover:shadow-md transition-all"
              style={{
                background: isValid && !disabled ? 'linear-gradient(135deg, #0F172A, #1E293B)' : undefined,
              }}
              variant={isValid && !disabled ? 'default' : 'secondary'}
              aria-label="Unlock report"
            >
              Unlock Full Report
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">No spam. We&apos;ll only send your report.</p>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
