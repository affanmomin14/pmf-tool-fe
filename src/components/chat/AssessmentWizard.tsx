'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { QUESTIONS } from '@/lib/constants'
import { useAssessment } from '@/hooks/useAssessment'
import type { QuestionOption } from '@/lib/types'
import { track } from '@/lib/posthog'


import { AnalysisLoader } from './AnalysisLoader'
import { PreviewCards } from './PreviewCards'
import { Report } from './Report'

const ease = [0.25, 1, 0.5, 1] as const

/* ─────────────────────────────────────────────
 *  Progress Bar
 * ───────────────────────────────────────────── */
function WizardProgress({
    currentStep,
    totalSteps,
}: {
    currentStep: number
    totalSteps: number
}) {
    const pct = Math.min(((currentStep) / totalSteps) * 100, 100)

    return (
        <div
            className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3"
            style={{
                background: 'rgba(250, 251, 252, 0.92)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
            }}
        >
            {/* Left: title */}
            <div className="flex items-center gap-2.5">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0F172A, #334155)' }}
                >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5"
                        />
                    </svg>
                </div>
                <span className="text-sm font-semibold text-foreground hidden sm:block">PMF Diagnostic</span>
            </div>

            {/* Center: progress bar */}
            <div className="flex-1 max-w-md mx-auto">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #10B981, #0D9488)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Right: counter */}
            <span className="text-[12px] text-muted-foreground tabular-nums shrink-0">
                {currentStep}/{totalSteps}
            </span>
        </div>
    )
}



/* ─────────────────────────────────────────────
 *  Circular Progress Ring (for text input)
 * ───────────────────────────────────────────── */
const MIN_TEXT_LENGTH = 10

function ProgressRing({ progress, size = 28 }: { progress: number; size?: number }) {
    const strokeWidth = 2.5
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - Math.min(progress, 1) * circumference
    const isComplete = progress >= 1

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={isComplete ? '#10B981' : '#94A3B8'}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </svg>
            {isComplete && (
                <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                    <motion.svg
                        width={size * 0.5}
                        height={size * 0.5}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <motion.path
                            d="M20 6L9 17L4 12"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        />
                    </motion.svg>
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────
 *  Option Icons for Select
 * ───────────────────────────────────────────── */
const OPTION_ICONS: Record<string, string> = {
    'organic-search': '🔍',
    'paid-ads': '📣',
    'social-media': '📱',
    referral: '🗣️',
    outbound: '📧',
    partnerships: '🤝',
    community: '👥',
    none: '🧭',
}

/* ─────────────────────────────────────────────
 *  Insight Display Tracker (fires event once per insight)
 * ───────────────────────────────────────────── */
function InsightTracker({ insightText, questionIndex }: { insightText: string | null; questionIndex: number }) {
    const trackedRef = useRef<string | null>(null)
    useEffect(() => {
        if (insightText && insightText !== trackedRef.current) {
            trackedRef.current = insightText
            track('insight_displayed', { question_number: questionIndex + 1 })
        }
        if (!insightText) trackedRef.current = null
    }, [insightText, questionIndex])
    return null
}

/* ─────────────────────────────────────────────
 *  Question Step
 * ───────────────────────────────────────────── */
function QuestionStep({
    question,
    questionIndex,
    totalQuestions,
    onAnswer,
    disabled,
    insightText,
}: {
    question: typeof QUESTIONS[number]
    questionIndex: number
    totalQuestions: number
    onAnswer: (answer: string) => void
    disabled: boolean
    insightText: string | null
}) {
    const [value, setValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const isTextarea = question.type === 'textarea'
    const isValid = isTextarea ? value.trim().length >= MIN_TEXT_LENGTH : selectedId !== null
    const progress = isTextarea ? Math.min(value.trim().length / MIN_TEXT_LENGTH, 1) : 0

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }, [value])

    // Reset state when question changes + track question_viewed
    useEffect(() => {
        setValue('')
        setSelectedId(null)
        setIsFocused(false)
        track('question_viewed', {
            question_number: questionIndex + 1,
            question_text: question.question,
        })
    }, [questionIndex, question.question])

    const handleSubmit = () => {
        if (!isValid || disabled) return
        onAnswer(isTextarea ? value.trim() : selectedId!)
    }

    const handleSelectOption = (option: QuestionOption) => {
        if (disabled || selectedId) return
        setSelectedId(option.id)
        setTimeout(() => {
            onAnswer(option.label)
        }, 300)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && isValid) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const delays = useMemo(() => (question.options ?? []).map((_: QuestionOption, i: number) => i * 0.04), [question.options])

    return (
        <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] px-6 py-12"
        >
            <div className="w-full max-w-xl">
                {/* Step label */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-3 text-center"
                >
                    Question {questionIndex + 1} of {totalQuestions}
                </motion.p>

                {/* Question text */}
                <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease }}
                    className="text-[1.4rem] sm:text-[1.75rem] tracking-tight text-foreground leading-snug text-center mb-8"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {question.question}
                </motion.h2>

                {/* Input area */}
                {isTextarea ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4, ease }}
                        className="w-full"
                    >
                        <div
                            className="relative rounded-2xl border transition-all duration-300 overflow-hidden"
                            style={{
                                borderColor: isFocused ? 'rgba(16, 185, 129, 0.4)' : 'rgba(226, 232, 240, 0.8)',
                                boxShadow: isFocused
                                    ? '0 0 0 3px rgba(16, 185, 129, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)'
                                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                                background: '#FFFFFF',
                            }}
                        >
                            {/* Accent line */}
                            <motion.div
                                className="absolute top-0 left-0 right-0 h-[2px]"
                                style={{ background: 'linear-gradient(90deg, transparent, #10B981, #0D9488, transparent)' }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: isFocused ? 1 : 0 }}
                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                            />

                            <div className="px-4 pt-4 pb-2">
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder={question.placeholder}
                                    disabled={disabled}
                                    rows={3}
                                    className="w-full resize-none text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                                    style={{ minHeight: '72px' }}
                                    aria-label="Your answer"
                                />
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-t border-slate-100/80">
                                <div className="flex items-center gap-2.5">
                                    <ProgressRing progress={progress} />
                                    <AnimatePresence mode="wait">
                                        {value.length > 0 && !isValid ? (
                                            <motion.span
                                                key="counter"
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -4 }}
                                                className="text-[11px] text-muted-foreground/60"
                                            >
                                                {MIN_TEXT_LENGTH - value.trim().length} more characters
                                            </motion.span>
                                        ) : isValid ? (
                                            <motion.span
                                                key="ready"
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -4 }}
                                                className="text-[11px] text-emerald-600 font-medium"
                                            >
                                                Ready to send
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="hint"
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -4 }}
                                                className="text-[11px] text-muted-foreground/40"
                                            >
                                                Shift + Enter for new line
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={!isValid || disabled}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background: isValid && !disabled ? 'linear-gradient(135deg, #0F172A, #1E293B)' : '#E2E8F0',
                                        color: isValid && !disabled ? '#FFFFFF' : '#94A3B8',
                                        boxShadow: isValid && !disabled ? '0 2px 8px rgba(15, 23, 42, 0.2)' : 'none',
                                        minHeight: '36px',
                                    }}
                                    whileHover={isValid && !disabled ? { y: -1, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)' } : {}}
                                    whileTap={isValid && !disabled ? { scale: 0.97 } : {}}
                                    aria-label="Submit answer"
                                >
                                    Continue
                                    <motion.svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        animate={isValid ? { x: [0, 2, 0] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </motion.svg>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Select options */
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(question.options ?? []).map((option: QuestionOption, index: number) => {
                                const isSelected = selectedId === option.id
                                const icon = OPTION_ICONS[option.id] || '•'

                                return (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: delays[index], duration: 0.3, ease }}
                                        onClick={() => handleSelectOption(option)}
                                        disabled={disabled || (selectedId !== null && selectedId !== option.id)}
                                        className="relative text-left rounded-xl border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
                                        style={{
                                            minHeight: '52px',
                                            borderColor: isSelected ? '#10B981' : 'rgba(226, 232, 240, 0.8)',
                                            background: isSelected
                                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(13, 148, 136, 0.04))'
                                                : '#FFFFFF',
                                            boxShadow: isSelected
                                                ? '0 0 0 3px rgba(16, 185, 129, 0.1), 0 2px 8px rgba(16, 185, 129, 0.08)'
                                                : '0 1px 2px rgba(0, 0, 0, 0.02)',
                                        }}
                                        aria-label={option.label}
                                    >
                                        <div className="flex items-center gap-3 px-3.5 py-3">
                                            <span className="text-base shrink-0">{icon}</span>
                                            <span className={`text-[13px] leading-snug flex-1 ${isSelected ? 'text-emerald-800 font-semibold' : 'text-foreground/80 group-hover:text-foreground'}`}>
                                                {option.label}
                                            </span>
                                            <div className="shrink-0">
                                                <motion.div
                                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                                    style={{
                                                        borderColor: isSelected ? '#10B981' : '#E2E8F0',
                                                        background: isSelected ? '#10B981' : 'transparent',
                                                    }}
                                                    animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {isSelected && (
                                                        <motion.svg
                                                            className="w-3 h-3 text-white"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </motion.svg>
                                                    )}
                                                </motion.div>
                                            </div>
                                        </div>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Inline Insight Card — appears below input after answering */}
                <InsightTracker insightText={insightText} questionIndex={questionIndex} />
                <AnimatePresence>
                    {insightText && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            transition={{ duration: 0.4, ease }}
                            className="mt-5 overflow-hidden"
                        >
                            <div
                                className="flex items-start gap-3 px-4 py-4 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(13, 148, 136, 0.03))',
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                }}
                            >
                                <motion.div
                                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: 'linear-gradient(135deg, #10B981, #0D9488)' }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">Insight</p>
                                    <p className="text-[13px] text-foreground/80 leading-relaxed">{insightText}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────
 *  Analysis Step (with pipeline integration)
 * ───────────────────────────────────────────── */
function AnalysisStep({ onComplete, pipelineReady, error, onRetry }: { onComplete: () => void; pipelineReady: boolean; error?: string | null; onRetry?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease }}
            className="flex items-center justify-center min-h-[calc(100vh-52px)] px-6 py-12"
        >
            <div className="w-full max-w-lg">
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-4 text-center">
                        <p className="text-[13px] text-red-700">{error}</p>
                        {onRetry && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="mt-3 px-4 py-2 text-[13px] font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                )}
                <AnalysisLoader onComplete={onComplete} pipelineReady={pipelineReady} />
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────
 *  Preview Step
 * ───────────────────────────────────────────── */
function PreviewStep({
    onUnlock,
    previewData,
    loading,
    error,
}: {
    onUnlock: (email: string) => void
    previewData?: import('@/lib/types').PreviewContent | null
    loading?: boolean
    error?: string | null
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease }}
            className="flex items-center justify-center min-h-[calc(100vh-52px)] px-6 py-8"
        >
            <div className="w-full max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease }}
                    className="text-center mb-5"
                >
                    <h2
                        className="text-[1.35rem] sm:text-[1.75rem] tracking-tight text-foreground leading-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Analysis Complete
                    </h2>
                    <p className="text-[13px] text-muted-foreground mt-1">
                        Your 9-section report is ready. Enter your email to unlock.
                    </p>
                </motion.div>
                <PreviewCards onUnlock={onUnlock} previewData={previewData} loading={loading} error={error} />
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────
 *  Report Step
 * ───────────────────────────────────────────── */
function ReportStep({
    isUnlocked,
    reportData,
    reportToken,
    userEmail,
}: {
    isUnlocked: boolean
    reportData?: import('@/lib/types').ReportData | null
    reportToken?: string | null
    userEmail?: string | null
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease }}
            className="min-h-screen py-8"
        >
            <div className="w-full">
                <Report isUnlocked={isUnlocked} reportData={reportData} reportToken={reportToken} userEmail={userEmail} />
            </div>
        </motion.div>
    )
}

/* ═════════════════════════════════════════════
 *  Main Wizard
 * ═════════════════════════════════════════════ */
export function AssessmentWizard() {
    const {
        step,
        questionIndex,
        currentQuestion,
        totalQuestions,
        insightText,
        emailUnlocked,
        answerQuestion,
        completeAnalysis,
        submitEmail,
        // API state
        previewData,
        reportData,
        reportToken,
        loading,
        error,
        userEmail,
        runPipeline,
    } = useAssessment()

    // Track whether pipeline has completed
    const [pipelineReady, setPipelineReady] = useState(false)
    const pipelineStarted = useRef(false)

    // Start pipeline when entering analysis step
    useEffect(() => {
        if (step === 'analysis' && !pipelineStarted.current) {
            pipelineStarted.current = true
            runPipeline().then(() => {
                setPipelineReady(true)
            })
        }
    }, [step, runPipeline])

    // Compute progress step count:
    // questions(5) + analysis(1) = 6 steps
    const progressStep = (() => {
        switch (step) {
            case 'question': return questionIndex
            case 'analysis': return totalQuestions
            case 'preview': return totalQuestions
            case 'report': return totalQuestions + 1
            default: return 0
        }
    })()

    const totalProgressSteps = totalQuestions + 1 // questions + analysis

    // Whether the insight toast blocks answering
    const isThinking = insightText !== null

    // Stable callback for analysis completion
    const handleAnalysisComplete = useCallback(() => {
        completeAnalysis()
    }, [completeAnalysis])

    return (
        <section className="min-h-screen bg-background">
            {/* Progress bar — hide on report */}
            {step !== 'report' && (
                <WizardProgress currentStep={progressStep} totalSteps={totalProgressSteps} />
            )}

            {/* Step content */}
            <AnimatePresence mode="wait">

                {step === 'question' && currentQuestion && (
                    <QuestionStep
                        key={`q-${questionIndex}`}
                        question={currentQuestion}
                        questionIndex={questionIndex}
                        totalQuestions={totalQuestions}
                        onAnswer={answerQuestion}
                        disabled={isThinking}
                        insightText={insightText}
                    />
                )}

                {step === 'analysis' && (
                    <AnalysisStep
                        key="analysis"
                        onComplete={handleAnalysisComplete}
                        pipelineReady={pipelineReady}
                        error={error}
                        onRetry={() => runPipeline().then(() => setPipelineReady(true))}
                    />
                )}

                {step === 'preview' && (
                    <PreviewStep key="preview" onUnlock={submitEmail} previewData={previewData} loading={loading} error={error} />
                )}

                {step === 'report' && (
                    <ReportStep key="report" isUnlocked={emailUnlocked} reportData={reportData} reportToken={reportToken} userEmail={userEmail} />
                )}
            </AnimatePresence>


        </section>
    )
}
