'use client'

import { useState, useEffect } from 'react'

import { motion } from 'framer-motion'

import { PREVIEW_SIGNALS, REPORT_SECTIONS } from '@/lib/constants'
import type { PreviewContent, PreviewSignal } from '@/lib/types'

interface PreviewCardsProps {
  onUnlock: (email: string) => void
  previewData?: PreviewContent | null
  loading?: boolean
  error?: string | null
}

const SEVERITY_MAP: Record<string, { bg: string; border: string; icon: string; badge: string; barColor: string }> = {
  risk: { bg: '#FEF2F2', border: '#FED7D7', icon: '🔴', badge: 'Critical Risk', barColor: '#EF4444' },
  signal: { bg: '#FFFBEB', border: '#FDE68A', icon: '🟡', badge: 'Attention', barColor: '#F59E0B' },
  strength: { bg: '#ECFDF5', border: '#A7F3D0', icon: '🟢', badge: 'Strength', barColor: '#10B981' },
}

const LOCKED_SECTIONS = REPORT_SECTIONS.slice(3, 6)

const ease = [0.25, 1, 0.5, 1] as const

const STAGE_LABELS: Record<string, string> = {
  pre_pmf: 'Pre-PMF',
  approaching: 'Emerging',
  early_pmf: 'Early PMF',
  strong: 'Strong',
}

function deriveSignals(preview: PreviewContent): PreviewSignal[] {
  const signals: PreviewSignal[] = []

  // Primary break → risk signal
  if (preview.primaryBreak) {
    signals.push({
      type: 'risk',
      emoji: '🔴',
      title: `${preview.primaryBreak} Risk`,
      description: `Your weakest dimension. This is a critical area to address before scaling.`,
    })
  }

  // Strengths → strength/signal
  if (preview.strengths?.[0]) {
    signals.push({
      type: 'strength',
      emoji: '🟢',
      title: 'Key Strength Detected',
      description: preview.strengths[0],
    })
  }

  if (preview.strengths?.[1]) {
    signals.push({
      type: 'signal',
      emoji: '🟡',
      title: 'Positive Signal',
      description: preview.strengths[1],
    })
  }

  // Pad with fallbacks if needed
  if (signals.length === 0) return PREVIEW_SIGNALS
  return signals.slice(0, 3)
}

function AnimatedScore({ target }: { target: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let frame: number
    const start = Date.now()
    const duration = 1500
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return <>{count}</>
}

export function PreviewCards({ onUnlock, previewData, loading, error }: PreviewCardsProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const score = previewData?.pmfScore ?? 47
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
  const scoreLabel = previewData?.pmfStage
    ? (STAGE_LABELS[previewData.pmfStage] || 'Emerging')
    : (score >= 70 ? 'Strong' : score >= 40 ? 'Emerging' : 'Pre-PMF')
  const circumference = 2 * Math.PI * 38

  const signals = previewData ? deriveSignals(previewData) : PREVIEW_SIGNALS

  const verdictText = previewData?.verdict
    || 'Early signals detected. Improvements needed in distribution & positioning.'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValidEmail = emailRegex.test(email)

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) {
      setEmailError('Please enter a valid email')
      return
    }
    setEmailError('')
    onUnlock(email)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="max-w-md mx-auto flex flex-col" style={{ maxHeight: 'calc(100vh - 100px)' }}>

        {/* Top section: Score + label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="flex items-center gap-4 mb-4"
        >
          {/* Compact score ring */}
          <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
            <svg width={80} height={80} className="-rotate-90">
              <circle cx={40} cy={40} r={34} fill="none" stroke="#E2E8F0" strokeWidth={5} />
              <motion.circle
                cx={40} cy={40} r={34}
                fill="none" stroke={scoreColor} strokeWidth={5} strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
                transition={{ delay: 0.3, duration: 1.5, ease }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-foreground tabular-nums leading-none">
                <AnimatedScore target={score} />
              </span>
              <span className="text-[8px] text-muted-foreground font-medium">/100</span>
            </div>
          </div>

          <div>
            <span
              className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-1"
              style={{ background: `${scoreColor}15`, color: scoreColor }}
            >
              {scoreLabel}
            </span>
            <p className="text-[12px] text-muted-foreground leading-snug max-w-[220px]">
              {verdictText}
            </p>
          </div>
        </motion.div>

        {/* Signal cards — compact */}
        <div className="flex flex-col gap-1.5 mb-3">
          {signals.map((signal, i) => {
            const s = SEVERITY_MAP[signal.type]
            return (
              <motion.div
                key={signal.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease }}
                className="rounded-lg px-3 py-2.5 border"
                style={{ background: s.bg, borderColor: s.border }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{signal.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{signal.description}</p>
                  </div>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${s.barColor}12`, color: s.barColor }}>
                    {s.badge}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Blurred locked sections */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="relative mb-4"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            6 more sections locked
          </p>
          <div className="space-y-1 relative">
            {LOCKED_SECTIONS.map((section, i) => (
              <div
                key={section.id}
                className="rounded-lg px-3 py-2 border flex items-center gap-2"
                style={{
                  background: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  filter: `blur(${1.5 + i * 0.8}px)`,
                }}
              >
                <span className="text-sm">{section.icon}</span>
                <span className="text-[11px] text-foreground/60">{section.title}</span>
              </div>
            ))}
            <div
              className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none rounded-lg"
              style={{ background: 'linear-gradient(to bottom, transparent, var(--background))' }}
            />
          </div>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-red-500 mb-2 text-center">
            {error}
          </motion.p>
        )}

        {/* Inline email gate */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <form onSubmit={handleUnlock} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                placeholder="founder@startup.com"
                className="w-full h-11 px-3.5 text-[13px] rounded-xl border bg-white outline-none transition-all focus:ring-2"
                style={{
                  borderColor: emailError ? '#FCA5A5' : 'rgba(226, 232, 240, 0.8)',
                  ...(email && !emailError ? { borderColor: 'rgba(16, 185, 129, 0.3)' } : {}),
                }}
                aria-label="Email address"
                autoComplete="email"
                disabled={loading}
              />
              {isValidEmail && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={!isValidEmail || loading}
              className="shrink-0 flex items-center gap-1.5 px-5 h-11 rounded-xl text-[13px] font-semibold cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background: isValidEmail && !loading ? 'linear-gradient(135deg, #0F172A, #1E293B)' : '#CBD5E1',
                boxShadow: isValidEmail && !loading ? '0 2px 10px rgba(15, 23, 42, 0.2)' : 'none',
              }}
              whileHover={isValidEmail && !loading ? { y: -1, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)' } : {}}
              whileTap={isValidEmail && !loading ? { scale: 0.97 } : {}}
              aria-label="Unlock full report"
            >
              {loading ? (
                <span className="animate-pulse">Unlocking...</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Unlock
                </>
              )}
            </motion.button>
          </form>
          {emailError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-red-500 mt-1 ml-1">{emailError}</motion.p>
          )}
          <p className="text-[9px] text-muted-foreground text-center mt-2">No spam. We&apos;ll only send your report.</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
