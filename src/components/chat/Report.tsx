'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { REPORT_SECTIONS } from '@/lib/constants'
import type { ReportSection, ReportMetric, ReportData } from '@/lib/types'
import { sendReportEmail } from '@/lib/api'
import { track } from '@/lib/posthog'

interface ReportProps {
  isUnlocked: boolean
  reportData?: ReportData | null
  reportToken?: string | null
  userEmail?: string | null
}

/* ═══════════════════════════════════════════════════════
   FALLBACK DATA
   ═══════════════════════════════════════════════════════ */

const FALLBACK_RADAR = [
  { dimension: 'Retention', score: 72, fullMark: 100 },
  { dimension: 'Positioning', score: 45, fullMark: 100 },
  { dimension: 'Distribution', score: 28, fullMark: 100 },
  { dimension: 'Monetization', score: 58, fullMark: 100 },
  { dimension: 'Market Fit', score: 63, fullMark: 100 },
  { dimension: 'Moat', score: 41, fullMark: 100 },
]

const FUNNEL_DATA = [
  { stage: 'Awareness', value: 100, color: '#6366F1', icon: '👁' },
  { stage: 'Activation', value: 72, color: '#8B5CF6', icon: '⚡' },
  { stage: 'Retention', value: 48, color: '#A855F7', icon: '🔄' },
  { stage: 'Revenue', value: 31, color: '#10B981', icon: '💰' },
  { stage: 'Referral', value: 18, color: '#14B8A6', icon: '📣' },
]

/* ═══════════════════════════════════════════════════════
   SEVERITY CONFIG
   ═══════════════════════════════════════════════════════ */

const SEVERITY_CONFIG: Record<string, { accent: string; gradient: string; label: string; glow: string }> = {
  critical: {
    accent: '#EF4444',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
    label: 'Critical',
    glow: 'rgba(239,68,68,0.15)',
  },
  warning: {
    accent: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
    label: 'Needs Attention',
    glow: 'rgba(245,158,11,0.15)',
  },
  positive: {
    accent: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
    label: 'Strong',
    glow: 'rgba(16,185,129,0.15)',
  },
  neutral: {
    accent: '#6366F1',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
    label: 'Info',
    glow: 'rgba(99,102,241,0.15)',
  },
}

const TREND: Record<string, { icon: string; color: string }> = {
  up: { icon: '↑', color: '#10B981' },
  down: { icon: '↓', color: '#EF4444' },
  neutral: { icon: '→', color: '#64748B' },
}

const STAGE_LABELS: Record<string, string> = {
  pre_pmf: 'Pre-PMF',
  approaching: 'Emerging',
  early_pmf: 'Early PMF',
  strong: 'Strong',
}

const ease = [0.25, 1, 0.5, 1] as const

function scoreToSeverity(score: number): ReportSection['severity'] {
  if (score <= 3) return 'critical'
  if (score <= 5) return 'warning'
  if (score <= 8) return 'neutral'
  return 'positive'
}

function scoreToColor(score: number): string {
  if (score >= 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

/* ═══════════════════════════════════════════════════════
   MAP BE → FE SECTIONS
   ═══════════════════════════════════════════════════════ */

function mapReportToSections(report: ReportData): ReportSection[] {
  const sections: ReportSection[] = []

  sections.push({
    id: 'reality-check',
    title: 'Reality Check',
    icon: '🔍',
    content: report.reality_check.summary,
    severity: report.header.pmfScore <= 30 ? 'critical' : report.header.pmfScore <= 50 ? 'warning' : 'neutral',
    metrics: [
      { label: 'PMF Score', value: `${report.header.pmfScore}/100`, trend: 'neutral' },
      { label: 'Strengths', value: `${report.reality_check.strengths.length}`, trend: 'up' },
      { label: 'Concerns', value: `${report.reality_check.concerns.length}`, trend: 'down' },
    ],
  })

  sections.push({
    id: 'market-analysis',
    title: 'Market Analysis',
    icon: '📊',
    content: `${report.market.positioning} ${report.market.opportunity}`,
    severity: 'neutral',
    metrics: [
      ...(report.market.tam ? [{ label: 'TAM', value: report.market.tam, trend: 'up' as const }] : []),
      ...(report.market.growthRate ? [{ label: 'Growth Rate', value: report.market.growthRate, trend: 'up' as const }] : []),
    ],
  })

  const retentionDim = report.scorecard.find(d => d.dimension.toLowerCase().includes('retention'))
  if (retentionDim) {
    sections.push({
      id: 'retention-deep-dive',
      title: 'Retention Deep Dive',
      icon: '🔄',
      content: retentionDim.insight,
      severity: scoreToSeverity(retentionDim.score),
      metrics: [{ label: 'Score', value: `${retentionDim.score}/10`, trend: retentionDim.score >= 7 ? 'up' : 'down' }],
    })
  }

  sections.push({
    id: 'positioning-audit',
    title: 'Positioning Audit',
    icon: '🎯',
    content: `Current: ${report.positioning.current}. Gap: ${report.positioning.gap}. Recommended: ${report.positioning.recommended}`,
    severity: (() => {
      const dim = report.scorecard.find(d => d.dimension.toLowerCase().includes('position'))
      return dim ? scoreToSeverity(dim.score) : 'neutral'
    })(),
  })

  sections.push({
    id: 'distribution-strategy',
    title: 'Distribution Strategy',
    icon: '📢',
    content: `Current: ${report.sales_model.current}. Recommended: ${report.sales_model.recommended}. ${report.sales_model.reasoning}`,
    severity: (() => {
      const dim = report.scorecard.find(d => d.dimension.toLowerCase().includes('distribut') || d.dimension.toLowerCase().includes('acquisition'))
      return dim ? scoreToSeverity(dim.score) : 'neutral'
    })(),
  })

  sections.push({
    id: 'monetization-review',
    title: 'Monetization Review',
    icon: '💰',
    content: report.bottom_line.summary,
    severity: 'neutral',
    metrics: report.bottom_line.nextSteps.map((s, i) => ({ label: `Step ${i + 1}`, value: s.slice(0, 40), trend: 'neutral' as const })),
  })

  const competitors = report.competitors.slice(0, 3)
  sections.push({
    id: 'competitive-moat',
    title: 'Competitive Moat',
    icon: '🏰',
    content: competitors.map(c => `${c.name}: ${c.comparison} (${c.threatLevel} threat)`).join('. '),
    severity: (() => {
      const dim = report.scorecard.find(d => d.dimension.toLowerCase().includes('moat') || d.dimension.toLowerCase().includes('compet'))
      return dim ? scoreToSeverity(dim.score) : 'warning'
    })(),
  })

  sections.push({
    id: 'risk-assessment',
    title: 'Risk Assessment',
    icon: '⚠️',
    content: `Primary break: ${report.bottom_line.primaryBreak}. ${report.reality_check.concerns.join('. ')}`,
    severity: 'critical',
  })

  const recs = report.recommendations.slice(0, 5)
  sections.push({
    id: 'action-plan',
    title: 'Sprint 0 Action Plan',
    icon: '🚀',
    content: recs.map((r, i) => `(${i + 1}) ${r.title}: ${r.description}`).join(' '),
    severity: 'positive',
    metrics: recs.map(r => ({ label: r.title.slice(0, 20), value: r.timeframe, trend: r.priority === 'high' ? 'up' as const : 'neutral' as const })),
  })

  return sections
}

/* ═══════════════════════════════════════════════════════
   ACETERNITY-STYLE SPOTLIGHT CARD
   Mouse-tracking radial gradient + glow border
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
      style={{
        boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03)`,
      }}
    >
      {/* Spotlight radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      {/* Glow border on hover */}
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
   CIRCULAR SCORE GAUGE
   ═══════════════════════════════════════════════════════ */

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - score / 100)

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <svg width={200} height={200} viewBox="0 0 200 200" style={{ filter: `drop-shadow(0 0 16px ${color}40)` }}>
        <circle cx={100} cy={100} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
        <motion.circle
          cx={100} cy={100} r={radius}
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ delay: 0.4, duration: 1.8, ease: [0.25, 1, 0.5, 1] }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
        <circle cx={100} cy={100} r={radius - 18} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[44px] font-bold text-white tabular-nums leading-none tracking-tight">
          <AnimatedCounter target={score} />
        </span>
        <span className="text-[13px] text-slate-400 font-medium mt-1">/100</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CUSTOM TOOLTIPS
   ═══════════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="report-tooltip px-4 py-3 text-[12px]">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-300">
          {p.name === 'projected' ? 'Projected' : 'Current'}:{' '}
          <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   INSIGHT CARD (replaces plain text cards)
   Aceternity spotlight + expandable content
   ═══════════════════════════════════════════════════════ */

function InsightCard({ section, index, isBlurred }: { section: ReportSection; index: number; isBlurred: boolean }) {
  const s = SEVERITY_CONFIG[section.severity]
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate = section.content.length > 120
  const cardRef = useRef<HTMLDivElement>(null)

  // Track section viewed via IntersectionObserver
  useEffect(() => {
    if (isBlurred || !cardRef.current) return
    const el = cardRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track('report_section_viewed', { section_title: section.title, section_index: index })
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isBlurred, section.title, index])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease }}
      ref={cardRef}
      className="h-full flex flex-col"
      style={{
        filter: isBlurred ? 'blur(6px)' : 'none',
        userSelect: isBlurred ? 'none' : 'auto',
        pointerEvents: isBlurred ? 'none' : 'auto',
      }}
    >
      <SpotlightCard className="h-full flex flex-col" accentColor={s.accent} glowColor={s.glow}>
        <div className="p-6 flex-1 flex flex-col">
          {/* Top row: icon + title + badge */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
              style={{ background: s.gradient, border: `1px solid ${s.accent}15` }}
            >
              {section.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-slate-900 truncate">{section.title}</h3>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: `${s.accent}12`, color: s.accent, border: `1px solid ${s.accent}20` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.accent, boxShadow: `0 0 6px ${s.accent}60` }} />
                  {s.label}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="ml-15">
            <AnimatePresence mode="wait">
              <motion.p
                key={expanded ? 'full' : 'collapsed'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[13.5px] text-slate-500 leading-[1.7]"
              >
                {shouldTruncate && !expanded ? section.content.slice(0, 120) + '…' : section.content}
              </motion.p>
            </AnimatePresence>
            {shouldTruncate && (
              <button
                onClick={() => setExpanded(prev => !prev)}
                className="text-[12px] font-semibold mt-2 transition-colors hover:underline"
                style={{ color: s.accent }}
              >
                {expanded ? '← Show less' : 'Read more →'}
              </button>
            )}
          </div>

          {/* Metrics row */}
          {section.metrics && section.metrics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-4 ml-15">
              {section.metrics.map(m => {
                const t = TREND[m.trend]
                return (
                  <div
                    key={m.label}
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100"
                  >
                    <span className="text-slate-400 font-medium">{m.label}</span>
                    <span className="font-semibold text-slate-700">{m.value}</span>
                    <span className="font-bold text-[10px]" style={{ color: t.color }}>{t.icon}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN REPORT
   ═══════════════════════════════════════════════════════ */

export function Report({ isUnlocked, reportData, reportToken, userEmail }: ReportProps) {
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  // Track report_viewed on mount
  useEffect(() => {
    track('report_viewed', {
      pmf_score: reportData?.header.pmfScore ?? null,
      pmf_stage: reportData?.header.pmfStage ?? null,
    })
  }, [reportData?.header.pmfScore, reportData?.header.pmfStage])

  const scorePct = reportData?.header.pmfScore ?? 47
  const scoreColor = scoreToColor(scorePct)
  const stageLabel = reportData?.header.pmfStage
    ? (STAGE_LABELS[reportData.header.pmfStage] || 'Emerging')
    : 'Emerging'
  const verdictText = reportData?.header.verdict
    || 'Your product shows early PMF signals but needs critical improvements in distribution and positioning.'

  const radarData = useMemo(() => {
    if (!reportData?.scorecard) return FALLBACK_RADAR
    return reportData.scorecard.map(d => ({
      dimension: d.dimension,
      score: d.score * 10,
      fullMark: 100,
    }))
  }, [reportData])

  const dimensionScores = useMemo(() => {
    if (!reportData?.scorecard) return [
      { label: 'Retention', score: 72, color: '#10B981' },
      { label: 'Positioning', score: 45, color: '#F59E0B' },
      { label: 'Distribution', score: 28, color: '#EF4444' },
      { label: 'Monetization', score: 58, color: '#10B981' },
      { label: 'Market Fit', score: 63, color: '#10B981' },
      { label: 'Moat', score: 41, color: '#F59E0B' },
    ]
    return reportData.scorecard.map(d => ({
      label: d.dimension,
      score: d.score * 10,
      color: scoreToColor(d.score * 10),
    }))
  }, [reportData])

  const growthData = useMemo(() => {
    const base = scorePct
    const improvement = Math.min(base + 31, 95)
    return [
      { month: 'Now', current: base, projected: base },
      { month: 'Wk 2', current: base, projected: base + Math.round((improvement - base) * 0.16) },
      { month: 'Wk 4', current: base, projected: base + Math.round((improvement - base) * 0.35) },
      { month: 'Wk 6', current: base, projected: base + Math.round((improvement - base) * 0.55) },
      { month: 'Wk 8', current: base, projected: base + Math.round((improvement - base) * 0.77) },
      { month: 'Wk 12', current: base, projected: improvement },
    ]
  }, [scorePct])

  const reportSections = useMemo(() => {
    if (reportData) return mapReportToSections(reportData)
    return REPORT_SECTIONS
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {/* ════════════════════════════════════════════════════
          FULL-WIDTH DASHBOARD
         ════════════════════════════════════════════════════ */}
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
              Your PMF Insights Report
            </h1>
            <p className="text-[13px] text-slate-400 mt-1">
              Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                {emailSent ? '✅ Report Sent' : emailSending ? 'Sending…' : '📧 Send to Email'}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Score Hero + Charts Bento Grid ── */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* PMF Score Hero — spans 5 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="lg:col-span-5 report-hero p-8 flex flex-col justify-between min-h-[380px]"
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
                  <ScoreGauge score={scorePct} color={scoreColor} />
                  <div className="flex-1">
                    <p className="text-[14px] text-slate-300 leading-relaxed mb-5">{verdictText}</p>
                    {/* Mini dimension pills */}
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

            {/* Radar Chart — spans 4 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-4"
            >
              <SpotlightCard className="h-full" accentColor="#6366F1" glowColor="rgba(99,102,241,0.12)">
                <div className="p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Dimension Scores</p>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#E2E8F0" strokeWidth={0.5} />
                        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} tickLine={false} />
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
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Right column — Score bars + Funnel stacked — spans 3 cols */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              {/* Score Bars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                <SpotlightCard accentColor="#10B981" glowColor="rgba(16,185,129,0.12)">
                  <div className="p-5">
                    <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-4">Breakdown</p>
                    <div className="space-y-3">
                      {dimensionScores.map((item, i) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium w-[60px] text-right shrink-0 truncate">
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
                          <span className="text-[10px] font-bold tabular-nums w-6 text-right" style={{ color: item.color }}>
                            {item.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>

              {/* AARRR Funnel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <SpotlightCard accentColor="#8B5CF6" glowColor="rgba(139,92,246,0.12)">
                  <div className="p-5">
                    <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-4">AARRR Funnel</p>
                    <div className="space-y-2.5">
                      {FUNNEL_DATA.map((stage, i) => (
                        <div key={stage.stage} className="flex items-center gap-2">
                          <span className="text-sm">{stage.icon}</span>
                          <div className="flex-1 h-6 bg-slate-50 rounded-md overflow-hidden relative">
                            <motion.div
                              className="h-full rounded-md flex items-center justify-end pr-2"
                              style={{ background: `linear-gradient(90deg, ${stage.color}25, ${stage.color})` }}
                              initial={{ width: '0%' }}
                              animate={{ width: `${stage.value}%` }}
                              transition={{ delay: 0.6 + i * 0.1, duration: 0.7, ease }}
                            >
                              <span className="text-[9px] font-bold text-white drop-shadow-sm">{stage.value}%</span>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            </div>
          </div>

          {/* Growth Trajectory — full width below bento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-5"
          >
            <SpotlightCard accentColor="#10B981" glowColor="rgba(16,185,129,0.1)">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Growth Trajectory</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Projected improvement with Sprint 0 execution</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="inline-block w-4 h-0.5 bg-emerald-500 rounded-full" />
                      Projected
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="inline-block w-4 h-0.5 bg-slate-300 rounded-full" style={{ borderTop: '1px dashed #94A3B8' }} />
                      Current
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={growthData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projGFull" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="currGFull" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeWidth={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[Math.max(scorePct - 20, 0), Math.min(scorePct + 50, 100)]} tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="current" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#currGFull)" name="current" />
                    <Area type="monotone" dataKey="projected" stroke="#10B981" strokeWidth={2.5} fill="url(#projGFull)" name="projected" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>

        {/* ── Insight Cards (replaces old text cards) ── */}
        <div className="max-w-7xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">
              Detailed Analysis
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {reportSections.map((section, i) => (
              <InsightCard key={section.id} section={section} index={i} isBlurred={!isUnlocked && i > 1} />
            ))}
            {!isUnlocked && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none z-30"
                style={{ background: 'linear-gradient(to bottom, transparent, var(--background))' }}
              />
            )}
          </div>
        </div>

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
              {/* Dot grid bg */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
              {/* Glow */}
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
                  🚀 Book Your Sprint 0
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
