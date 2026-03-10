'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

import { Button } from '@/components/ui/button'
import type { ReportData } from '@/lib/types'
import { sendReportEmail } from '@/lib/api'
import { track } from '@/lib/posthog'

interface ReportProps {
  isUnlocked: boolean
  reportData?: ReportData | null
  reportToken?: string | null
  userEmail?: string | null
  isPrint?: boolean
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════ */

// Helper to remove placeholder strings
function isValidContent(str: string | null | undefined): str is string {
  if (!str) return false
  const placeholders = ['data not available', '[not available]']
  return !placeholders.some(p => str.toLowerCase().includes(p))
}

const STAGE_LABELS: Record<string, string> = {
  pre_pmf: 'Pre-PMF',
  approaching: 'Emerging',
  early_pmf: 'Early PMF',
  strong: 'Strong',
}

const ease = [0.25, 1, 0.5, 1] as const

function scoreToColor(score: number): string {
  if (score >= 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

const DEFAULT_STATUS = { color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' }

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  at_risk: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  on_track: { color: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
  strong: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
}

const DEFAULT_SEVERITY = { color: '#64748B', bg: 'rgba(100,116,139,0.08)' }

const SEVERITY_COLORS: Record<string, { color: string; bg: string }> = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  aligned: { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
}

const DEFAULT_TIER_COLOR = '#64748B'

const TIER_COLORS: Record<string, string> = {
  direct: '#EF4444',
  incumbent: '#F59E0B',
  adjacent: '#6366F1',
  invisible: '#64748B',
}

const DEFAULT_EFFORT = { color: '#64748B', bg: 'rgba(100,116,139,0.1)' }

const EFFORT_COLORS: Record<string, { color: string; bg: string }> = {
  low: { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  high: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

/* ═══════════════════════════════════════════════════════
   SPOTLIGHT CARD (Aceternity-style)
   ═══════════════════════════════════════════════════════ */

function SpotlightCard({
  children,
  className = '',
  accentColor = '#6366F1',
  glowColor = 'rgba(99,102,241,0.15)',
}: {
  children: React.ReactNode
  className?: string
  accentColor?: string
  glowColor?: string
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  return (
    <div
      ref={divRef}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-all duration-500 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl transition-opacity duration-500"
        style={{
          opacity,
          border: `1px solid ${accentColor}30`,
          boxShadow: `inset 0 0 0 1px ${accentColor}10`,
        }}
      />
      <div className="relative z-20">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════ */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let frame: number
    const start = Date.now()
    const duration = 1200
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
  return <>{count}{suffix}</>
}

/* ═══════════════════════════════════════════════════════
   SCORE GAUGE
   ═══════════════════════════════════════════════════════ */

function ScoreGauge({ score, color, isPrint = false }: { score: number; color: string; isPrint?: boolean }) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - score / 100)
  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <svg width={200} height={200} viewBox="0 0 200 200" style={{ filter: isPrint ? 'none' : `drop-shadow(0 0 16px ${color}40)` }}>
        <circle cx={100} cy={100} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
        {isPrint ? (
          <circle
            cx={100} cy={100} r={radius}
            fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
        ) : (
          <motion.circle
            cx={100} cy={100} r={radius}
            fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: 0.4, duration: 1.8, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
        )}
        <circle cx={100} cy={100} r={radius - 18} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[44px] font-bold text-white tabular-nums leading-none tracking-tight">
          {isPrint ? score : <AnimatedCounter target={score} />}
        </span>
        <span className="text-[13px] text-slate-400 font-medium mt-1">/100</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION WRAPPER (numbered sections with blur support)
   ═══════════════════════════════════════════════════════ */

function SectionWrapper({
  number,
  title,
  children,
  isBlurred,
  delay = 0,
  className = '',
}: {
  number: string
  title: string
  children: React.ReactNode
  isBlurred: boolean
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
      className={`mb-10 ${className}`}
      style={{
        filter: isBlurred ? 'blur(6px)' : 'none',
        userSelect: isBlurred ? 'none' : 'auto',
        pointerEvents: isBlurred ? 'none' : 'auto',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg tabular-nums">
          {number}
        </span>
        <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">{title}</h2>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 01: REALITY CHECK
   ═══════════════════════════════════════════════════════ */

function RealityCheckSection({ data, hasLowConfidence }: { data: ReportData['reality_check'], hasLowConfidence?: boolean }) {
  if (!data.comparisons || data.comparisons.length === 0) {
    return <p className="text-[13px] text-slate-400 italic">Reality check data unavailable</p>
  }
  return (
    <div className="space-y-4">
      {hasLowConfidence && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 mb-2">
          <div className="flex gap-3">
            <span className="text-amber-500 text-lg shrink-0 pt-0.5">⚠️</span>
            <div>
              <p className="text-[13px] font-semibold text-amber-900 mb-1">Limited Market Data Found</p>
              <p className="text-[12px] text-amber-800/80 leading-relaxed">
                We couldn't find extensive public data (like G2 reviews, pricing, or TAM reports) for your specific niche.
                Scores marked with a <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border border-amber-300 bg-amber-100 text-[9px] font-bold mx-1">?</span> have lower confidence.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {data.comparisons.map((c, i) => {
          const sev = SEVERITY_COLORS[c.severity] || DEFAULT_SEVERITY
          return (
            <SpotlightCard key={i} accentColor={sev.color} glowColor={`${sev.color}15`}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}20` }}
                  >
                    {c.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{c.question_ref.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">You Said</p>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{c.you_said}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Research Shows</p>
                    <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{c.research_shows}</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          )
        })}
        {data.root_cause && isValidContent(data.root_cause) && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Root Cause</p>
            <p className="text-[13.5px] text-slate-700 leading-relaxed">{data.root_cause}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 02: SCORECARD (7 dimension cards)
   ═══════════════════════════════════════════════════════ */

function ScorecardSection({ data }: { data: ReportData['scorecard'] }) {
  if (!data.dimensions || data.dimensions.length === 0) {
    return <p className="text-[13px] text-slate-400 italic">Scorecard data unavailable</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {data.dimensions.map((dim) => {
        const st = STATUS_CONFIG[dim.status] || DEFAULT_STATUS
        const pct = dim.score * 10
        return (
          <SpotlightCard key={dim.name} accentColor={st.color} glowColor={`${st.color}15`}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[13px] font-semibold text-slate-900">{dim.name}</h4>
                  {dim.confidence === 'low' && (
                    <span title="Low confidence due to limited data" className="text-[10px] text-amber-500 cursor-help flex items-center justify-center w-3 h-3 rounded-full border border-amber-200 bg-amber-50">
                      ?
                    </span>
                  )}
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                >
                  {dim.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-[28px] font-bold tabular-nums leading-none" style={{ color: st.color }}>
                  {dim.score}
                </span>
                <span className="text-[12px] text-slate-400 mb-0.5">/10</span>
                <span className="text-[11px] text-slate-400 ml-auto mb-0.5">
                  Benchmark: {dim.benchmark}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: st.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3, duration: 0.7, ease }}
                />
              </div>
              {dim.evidence && isValidContent(dim.evidence) && (
                <p className="text-[12px] text-slate-500 leading-relaxed">{dim.evidence}</p>
              )}
            </div>
          </SpotlightCard>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 03: MARKET
   ═══════════════════════════════════════════════════════ */

function MarketSection({ data }: { data: ReportData['market'] }) {
  const sizes = [
    { label: 'TAM', ...data.tam, color: '#6366F1' },
    { label: 'SAM', ...data.sam, color: '#8B5CF6' },
    { label: 'GROWTH', ...data.growth_rate, color: '#A855F7' },
  ].filter(s => isValidContent(s.value))

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sizes.map((s) => (
            <SpotlightCard key={s.label} accentColor={s.color} glowColor={`${s.color}15`}>
              <div className="p-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
                <p className="text-[24px] font-bold text-slate-900 mb-1">{s.value}</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">{s.description}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}

      {data.regions.length > 0 && (
        <SpotlightCard accentColor="#6366F1" glowColor="rgba(99,102,241,0.1)">
          <div className="p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Regional Breakdown</p>
            <div className="space-y-2.5">
              {data.regions.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[12px] text-slate-600 font-medium w-[120px] shrink-0">{r.name}</span>
                  <div className="flex-1 h-4 bg-slate-50 rounded-md overflow-hidden">
                    <motion.div
                      className="h-full rounded-md bg-indigo-500"
                      style={{ opacity: 0.2 + (r.percentage / 100) * 0.8 }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${r.percentage}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 tabular-nums w-[40px] text-right">{r.percentage}%</span>
                  <span className="text-[11px] text-slate-500 w-[80px] text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SpotlightCard>
      )}

      {data.real_number_analysis && isValidContent(data.real_number_analysis) && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[13px] text-slate-600 leading-relaxed">{data.real_number_analysis}</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 04: SALES MODEL
   ═══════════════════════════════════════════════════════ */

function SalesModelSection({ data }: { data: ReportData['sales_model'] }) {
  const compSev = SEVERITY_COLORS[data.comparison.severity] || SEVERITY_COLORS.warning
  return (
    <div className="space-y-4">
      {/* Comparison card */}
      <SpotlightCard accentColor={compSev.color} glowColor={`${compSev.color}15`}>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">You Said</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">{data.comparison.you_said}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Research Shows</p>
              <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{data.comparison.research_shows}</p>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Models table */}
      <SpotlightCard accentColor="#6366F1" glowColor="rgba(99,102,241,0.1)">
        <div className="p-5 relative">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">GTM Model Comparison</p>
          <div className="overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-[12px] min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-3 text-slate-400 font-semibold">Model</th>
                  <th className="text-left py-2 pr-3 text-slate-400 font-semibold">Who Uses</th>
                  <th className="text-left py-2 pr-3 text-slate-400 font-semibold">ACV Range</th>
                  <th className="text-left py-2 pr-3 text-slate-400 font-semibold">Conversion</th>
                  <th className="text-left py-2 text-slate-400 font-semibold">Your Fit</th>
                </tr>
              </thead>
              <tbody>
                {data.models_table.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2.5 pr-3 font-medium text-slate-700">{row.model}</td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {isValidContent(row.who_uses) ? row.who_uses : '-'}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500 tabular-nums">
                      {isValidContent(row.acv_range) ? row.acv_range : '-'}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500 tabular-nums">
                      {isValidContent(row.conversion) ? row.conversion : '-'}
                    </td>
                    <td className="py-2.5 text-slate-600 font-medium">
                      {isValidContent(row.your_fit) ? row.your_fit : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SpotlightCard>

      {/* Diagnosis */}
      {data.diagnosis && isValidContent(data.diagnosis) && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[13px] text-slate-600 leading-relaxed">{data.diagnosis}</p>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.options.map((opt, i) => (
          <SpotlightCard key={i} accentColor="#8B5CF6" glowColor="rgba(139,92,246,0.1)">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{opt.icon}</span>
                <h4 className="text-[14px] font-semibold text-slate-900">{opt.title}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">Pros</p>
                  <ul className="space-y-1">
                    {opt.pros.map((p, j) => (
                      <li key={j} className="text-[11px] text-slate-600 flex gap-1.5">
                        <span className="text-emerald-500 shrink-0">+</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-red-500 uppercase mb-1">Cons</p>
                  <ul className="space-y-1">
                    {opt.cons.map((c, j) => (
                      <li key={j} className="text-[11px] text-slate-600 flex gap-1.5">
                        <span className="text-red-400 shrink-0">-</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                <span>Timeline: <strong className="text-slate-600">{opt.timeline}</strong></span>
                <span>Best if: <strong className="text-slate-600">{opt.best_if}</strong></span>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 05: COMPETITORS
   ═══════════════════════════════════════════════════════ */

function CompetitorsSection({ data }: { data: ReportData['competitors'] }) {
  if (!data.competitor_list || data.competitor_list.length === 0) {
    return <p className="text-[13px] text-slate-400 italic">Competitor data unavailable</p>
  }
  return (
    <div className="space-y-4">
      {/* Competitor list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.competitor_list.map((c, i) => {
          const tierColor = TIER_COLORS[c.tier] || DEFAULT_TIER_COLOR
          return (
            <SpotlightCard key={i} accentColor={tierColor} glowColor={`${tierColor}15`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[13px] font-semibold text-slate-900">{c.name}</h4>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}
                  >
                    {c.tier}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  {isValidContent(String(c.rating)) && typeof c.rating === 'number' && (
                    <span>Rating: <strong className="text-slate-700">{c.rating}/5</strong></span>
                  )}
                  {isValidContent(c.funding) && (
                    <span>Funding: <strong className="text-slate-700">{c.funding}</strong></span>
                  )}
                </div>
                {/* Rating bar */}
                {isValidContent(String(c.rating)) && typeof c.rating === 'number' && (
                  <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: tierColor }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${(Number(c.rating) / 5) * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease }}
                    />
                  </div>
                )}
              </div>
            </SpotlightCard>
          )
        })}
      </div>

      {/* Tiers explanation */}
      <SpotlightCard accentColor="#6366F1" glowColor="rgba(99,102,241,0.1)">
        <div className="p-5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Competitive Tiers</p>
          <div className="space-y-3">
            {data.tiers.map((t, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[12px] font-bold text-indigo-500 w-[100px] shrink-0">{t.tier_name}</span>
                <div>
                  <p className="text-[12px] text-slate-700 font-medium">{t.companies}</p>
                  <p className="text-[11px] text-slate-500">{t.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SpotlightCard>

      {/* Complaint gaps */}
      <SpotlightCard accentColor="#F59E0B" glowColor="rgba(245,158,11,0.1)">
        <div className="p-5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Complaint Gaps (Your Opportunity)</p>
          <div className="space-y-3">
            {data.complaints.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100/50">
                {isValidContent(String(c.percentage)) && (
                  <span className="text-[12px] font-bold text-amber-600 tabular-nums shrink-0">{c.percentage}</span>
                )}
                <div className="flex-1">
                  <p className="text-[12px] text-slate-700 font-medium">{c.complaint}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{c.opportunity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SpotlightCard>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 06: POSITIONING
   ═══════════════════════════════════════════════════════ */

function PositioningSection({ data }: { data: ReportData['positioning'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current */}
      <SpotlightCard accentColor="#EF4444" glowColor="rgba(239,68,68,0.1)">
        <div className="p-5">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-3">Current Positioning</p>
          <p className="text-[14px] text-slate-800 font-medium leading-relaxed mb-4 italic">
            &ldquo;{data.current.text}&rdquo;
          </p>
          <div className="space-y-2">
            {data.current.critique.map((c, i) => (
              <div key={i} className="flex gap-2 text-[12px] text-slate-600">
                <span className="text-red-400 shrink-0">&#x2717;</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </SpotlightCard>

      {/* Recommended */}
      <SpotlightCard accentColor="#10B981" glowColor="rgba(16,185,129,0.1)">
        <div className="p-5">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3">Recommended Positioning</p>
          <p className="text-[14px] text-slate-800 font-medium leading-relaxed mb-4 italic">
            &ldquo;{data.recommended.text}&rdquo;
          </p>
          <div className="space-y-2">
            {data.recommended.improvements.map((imp, i) => (
              <div key={i} className="flex gap-2 text-[12px] text-slate-600">
                <span className="text-emerald-500 shrink-0">&#x2713;</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </SpotlightCard>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 07: THE BOTTOM LINE
   ═══════════════════════════════════════════════════════ */

function BottomLineSection({ data }: { data: ReportData['bottom_line'] }) {
  return (
    <div className="space-y-4">
      {/* Verdict */}
      <div
        className="p-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #334155 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-[18px] text-white font-semibold leading-relaxed mb-2">{data.verdict}</p>
        <p className="text-[13px] text-slate-400 leading-relaxed">{data.verdict_detail}</p>
      </div>

      {/* Working / Not Working */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SpotlightCard accentColor="#10B981" glowColor="rgba(16,185,129,0.1)">
          <div className="p-5">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3">What's Working</p>
            <ul className="space-y-2">
              {data.working.map((w, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-slate-600">
                  <span className="text-emerald-500 shrink-0 mt-0.5">&#x2713;</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </SpotlightCard>
        <SpotlightCard accentColor="#EF4444" glowColor="rgba(239,68,68,0.1)">
          <div className="p-5">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-3">What's Not Working</p>
            <ul className="space-y-2">
              {data.not_working.map((nw, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-slate-600">
                  <span className="text-red-400 shrink-0 mt-0.5">&#x2717;</span>
                  <span>{nw}</span>
                </li>
              ))}
            </ul>
          </div>
        </SpotlightCard>
      </div>

      {/* Score Progression */}
      <SpotlightCard accentColor="#6366F1" glowColor="rgba(99,102,241,0.1)">
        <div className="p-5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Score Progression</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.score_progression.map((sp, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[20px] font-bold text-indigo-600 tabular-nums">{sp.score}</p>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{sp.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sp.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </SpotlightCard>

      {/* One Thing */}
      <div
        className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50"
      >
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">The One Thing</p>
        <p className="text-[16px] font-semibold text-slate-900 mb-2">{data.one_thing.title}</p>
        <p className="text-[13px] text-slate-600 leading-relaxed">{data.one_thing.explanation}</p>
      </div>

      {/* Research Stats */}
      {data.research_stats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {data.research_stats.map((rs, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[16px] font-bold text-indigo-600 tabular-nums">{rs.number}</span>
              <span className="text-[11px] text-slate-500">{rs.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 08: RECOMMENDATIONS
   ═══════════════════════════════════════════════════════ */

function RecommendationsSection({ data }: { data: ReportData['recommendations'] }) {
  if (!data || data.length === 0) {
    return <p className="text-[13px] text-slate-400 italic">Recommendations unavailable</p>
  }
  return (
    <div className="space-y-3">
      {data.map((rec) => {
        const effort = EFFORT_COLORS[rec.effort] || DEFAULT_EFFORT
        return (
          <SpotlightCard key={rec.rank} accentColor="#6366F1" glowColor="rgba(99,102,241,0.1)">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-[14px] font-bold shrink-0"
                >
                  {rec.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-[14px] font-semibold text-slate-900">{rec.title}</h4>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: effort.bg, color: effort.color }}
                    >
                      {rec.effort} effort
                    </span>
                    <span className="text-[10px] text-slate-400">{rec.timeline}</span>
                  </div>
                  <p className="text-[12.5px] text-slate-700 leading-relaxed mb-1">{rec.action}</p>
                  {rec.evidence && isValidContent(rec.evidence) && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{rec.evidence}</p>
                  )}
                </div>
              </div>
            </div>
          </SpotlightCard>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 09: SOURCES
   ═══════════════════════════════════════════════════════ */

function SourcesSection({ data }: { data: ReportData['sources'] }) {
  return (
    <SpotlightCard accentColor="#64748B" glowColor="rgba(100,116,139,0.1)">
      <div className="p-5 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pr-3 text-slate-400 font-semibold">Source</th>
              <th className="text-left py-2 pr-3 text-slate-400 font-semibold">Year</th>
              <th className="text-left py-2 text-slate-400 font-semibold">Used For</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2 pr-3 text-slate-700 font-medium">
                  {s.source_url ? (
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-500 tabular-nums">{s.year}</td>
                <td className="py-2 text-slate-500">{s.used_for}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SpotlightCard>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN REPORT
   ═══════════════════════════════════════════════════════ */

export function Report({ isUnlocked, reportData, reportToken, userEmail, isPrint = false }: ReportProps) {
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  useEffect(() => {
    track('report_viewed', {
      pmf_score: reportData?.header.pmf_score ?? null,
      pmf_stage: reportData?.header.pmf_stage ?? null,
    })
  }, [reportData?.header.pmf_score, reportData?.header.pmf_stage])

  const scorePct = reportData?.header.pmf_score ?? 0
  const scoreColor = scoreToColor(scorePct)
  const stageLabel = reportData?.header.pmf_stage
    ? (STAGE_LABELS[reportData.header.pmf_stage] || reportData.header.pmf_stage)
    : 'Analysis pending'
  const verdictText = reportData?.header.verdict || 'Analysis pending'

  const radarData = useMemo(() => {
    if (!reportData?.scorecard?.dimensions) return []
    return reportData.scorecard.dimensions.map(d => ({
      dimension: d.name,
      score: d.score * 10,
      fullMark: 100,
    }))
  }, [reportData])

  const dimensionScores = useMemo(() => {
    if (!reportData?.scorecard?.dimensions) return []
    return reportData.scorecard.dimensions.map(d => ({
      label: d.name,
      score: d.score * 10,
      color: scoreToColor(d.score * 10),
    }))
  }, [reportData])

  const handleSendEmail = async () => {
    if (!reportToken || !userEmail) return
    setEmailSending(true)
    track('report_pdf_emailed', { report_token: reportToken })
    try {
      await sendReportEmail(reportToken, userEmail)
      setEmailSent(true)
    } catch {
      // Silently fail
    } finally {
      setEmailSending(false)
    }
  }

  const canView = isPrint || isUnlocked
  const hasLowConfidence = useMemo(() => {
    return reportData?.scorecard?.dimensions?.some(d => d.confidence === 'low') || false
  }, [reportData])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className={isPrint ? 'print-mode' : ''}>
      <div className="w-full px-6 sm:px-10 lg:px-16 py-10">

        {/* ── Header Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10 max-w-7xl mx-auto"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">Live Report</span>
            </div>
            <h1
              className="text-[32px] sm:text-[38px] text-slate-900 tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {reportData?.header.product_name || 'Your PMF Insights Report'}
            </h1>
            <p className="text-[13px] text-slate-400 mt-1">
              {reportData?.header.category || 'PMF Diagnostic'} &middot; Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {isUnlocked && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Button
                variant={emailSent ? 'secondary' : 'outline'}
                className="rounded-xl text-[13px] font-medium cursor-pointer gap-2 h-10 border-slate-200 hover:border-slate-300"
                onClick={handleSendEmail}
                disabled={emailSent || emailSending}
              >
                {emailSent ? 'Report Sent' : emailSending ? 'Sending...' : 'Send to Email'}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Header Bento Grid: Score Hero + Radar + Breakdown ── */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* PMF Score Hero -- 6 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="lg:col-span-6 report-hero p-8 flex flex-col justify-center min-h-[380px] rounded-2xl overflow-hidden"
            >
              <div className="relative z-10 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Overall Score</span>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}
                  >
                    {stageLabel}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8">
                  <ScoreGauge score={scorePct} color={scoreColor} isPrint={isPrint} />
                  <div className="flex-1">
                    <p className="text-[14px] text-slate-300 leading-relaxed mb-5">{verdictText}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                      {dimensionScores.map(d => (
                        <div
                          key={d.label}
                          className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color, boxShadow: `0 0 4px ${d.color}60` }} />
                          <span className="text-slate-400">{d.label}</span>
                          <span className="font-bold" style={{ color: d.color }}>{d.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Radar Chart -- 6 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-6 min-h-[380px]"
            >
              <SpotlightCard className="h-full" accentColor="#6366F1" glowColor="rgba(99,102,241,0.12)">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Dimension Scores</p>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {radarData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                          <PolarGrid stroke="#E2E8F0" strokeWidth={0.5} />
                          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748B', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 9 : 11, fontWeight: 500 }} tickLine={false} />
                          <Radar
                            dataKey="score" stroke="#6366F1" fill="url(#radarGradFull)" fillOpacity={0.3} strokeWidth={2}
                            dot={{ r: 4, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                          />
                          <defs>
                            <linearGradient id="radarGradFull" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Breakdown bars -- 7 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="lg:col-span-7 min-h-[280px]"
            >
              <SpotlightCard className="h-full" accentColor="#10B981" glowColor="rgba(16,185,129,0.12)">
                <div className="p-6 h-full flex flex-col">
                  <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-5">Breakdown</p>
                  <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                    {dimensionScores.map((item, i) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 font-medium w-[120px] text-right shrink-0">
                          {item.label}
                        </span>
                        <div className="flex-1 h-5 bg-slate-50 rounded-md overflow-hidden">
                          <motion.div
                            className="h-full rounded-md"
                            style={{ background: `linear-gradient(90deg, ${item.color}30, ${item.color})` }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ delay: 0.5 + i * 0.08, duration: 0.7, ease }}
                          />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums w-7 text-right" style={{ color: item.color }}>
                          {item.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Key Stats -- 5 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="lg:col-span-5 min-h-[280px]"
            >
              <SpotlightCard className="h-full" accentColor="#8B5CF6" glowColor="rgba(139,92,246,0.12)">
                <div className="p-6 h-full flex flex-col">
                  <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-5">Key Metrics</p>
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-[12px] text-slate-500">PMF Score</span>
                      <span className="text-[18px] font-bold tabular-nums" style={{ color: scoreColor }}>{scorePct}/100</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-[12px] text-slate-500">Benchmark</span>
                      <span className="text-[18px] font-bold tabular-nums text-slate-600">{reportData?.header.benchmark_score ?? 70}/100</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-[12px] text-slate-500">Primary Break</span>
                      <span className="text-[13px] font-semibold text-red-500">{reportData?.header.primary_break ?? 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <span className="text-[12px] text-slate-500">Category Risk</span>
                      <span
                        className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{
                          color: reportData?.header.category_risk === 'high' ? '#EF4444' : reportData?.header.category_risk === 'medium' ? '#F59E0B' : '#10B981',
                          background: reportData?.header.category_risk === 'high' ? 'rgba(239,68,68,0.1)' : reportData?.header.category_risk === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                        }}
                      >
                        {reportData?.header.category_risk ?? 'medium'}
                      </span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

          </div>
        </div>

        {/* ── Detailed Sections (01-09) ── */}
        {reportData && (
          <div className="max-w-7xl mx-auto">
            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">
                Detailed Analysis
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </motion.div>

            {/* 01 — Reality Check (always visible) */}
            <SectionWrapper number="01" title="Reality Check" isBlurred={false} delay={0.45}>
              <RealityCheckSection data={reportData.reality_check} hasLowConfidence={hasLowConfidence} />
            </SectionWrapper>

            {/* 02 — Scorecard */}
            <SectionWrapper number="02" title="Scorecard" isBlurred={!canView} delay={0.5}>
              <ScorecardSection data={reportData.scorecard} />
            </SectionWrapper>

            {/* 03 — Market */}
            <SectionWrapper number="03" title="Market" isBlurred={!canView} delay={0.55} className={isPrint ? 'print-break-before' : ''}>
              <MarketSection data={reportData.market} />
            </SectionWrapper>

            {/* 04 — Sales Model */}
            <SectionWrapper number="04" title="Sales Model" isBlurred={!canView} delay={0.6}>
              <SalesModelSection data={reportData.sales_model} />
            </SectionWrapper>

            {/* 05 — Competitors */}
            <SectionWrapper number="05" title="Competitors" isBlurred={!canView} delay={0.65} className={isPrint ? 'print-break-before' : ''}>
              <CompetitorsSection data={reportData.competitors} />
            </SectionWrapper>

            {/* 06 — Positioning */}
            <SectionWrapper number="06" title="Positioning" isBlurred={!canView} delay={0.7}>
              <PositioningSection data={reportData.positioning} />
            </SectionWrapper>

            {/* 07 — The Bottom Line */}
            <SectionWrapper number="07" title="The Bottom Line" isBlurred={!canView} delay={0.75} className={isPrint ? 'print-break-before' : ''}>
              <BottomLineSection data={reportData.bottom_line} />
            </SectionWrapper>

            {/* 08 — Recommendations */}
            <SectionWrapper number="08" title="Recommendations Based on Research" isBlurred={!canView} delay={0.8}>
              <RecommendationsSection data={reportData.recommendations} />
            </SectionWrapper>

            {/* 09 — Sources */}
            <SectionWrapper number="09" title="Sources" isBlurred={!canView} delay={0.85}>
              <SourcesSection data={reportData.sources} />
            </SectionWrapper>

            {/* Blur overlay for locked content */}
            {!canView && (
              <div className="relative -mt-[600px] mb-10 pointer-events-none z-30">
                <div
                  className="h-[600px]"
                  style={{ background: 'linear-gradient(to bottom, transparent, var(--background) 80%)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Sprint 0 CTA ── */}
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="max-w-7xl mx-auto mb-10"
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #334155 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
              <div
                className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent)' }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent)' }}
              />

              <div className="relative z-10 py-14 px-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-400 mb-5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
                  Next Step
                </div>
                <h3 className="text-[28px] sm:text-[32px] text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Ready to act on these insights?
                </h3>
                <p className="text-[15px] text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                  Book a Sprint 0 session to turn this diagnostic into a 4-week execution plan with measurable milestones.
                </p>
                <a
                  href="https://cal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="report-shimmer relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-[2px]"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    boxShadow: '0 8px 28px -4px rgba(16,185,129,0.45), 0 0 0 1px rgba(16,185,129,0.2)',
                    overflow: 'hidden',
                  }}
                >
                  Book Your Sprint 0
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
