'use client'

import { useState, useCallback, useRef } from 'react'

import type { PreviewContent, ReportData } from '@/lib/types'
import { QUESTIONS } from '@/lib/constants'
import {
  createAssessment as apiCreateAssessment,
  submitResponse as apiSubmitResponse,
  completeAssessment as apiCompleteAssessment,
  getAssessmentStatus as apiGetAssessmentStatus,
  getReport as apiGetReport,
  submitLead as apiSubmitLead,
} from '@/lib/api'
import { track, identifyUser } from '@/lib/posthog'

export type AssessmentStep = 'question' | 'analysis' | 'preview' | 'report'

// Map FE category ids → BE problemType enum values
const CATEGORY_TO_PROBLEM_TYPE: Record<string, string> = {
  retention: 'retention',
  positioning: 'product_quality',
  distribution: 'distribution',
  monetization: 'monetization',
  'market-fit': 'market_fit',
}

export function useAssessment() {
  const [step, setStep] = useState<AssessmentStep>('question')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [insightText, setInsightText] = useState<string | null>(null)
  const [emailUnlocked, setEmailUnlocked] = useState(false)

  // API state
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [reportToken, setReportToken] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<PreviewContent | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Track time spent per question
  const questionStartTime = useRef<number>(Date.now())

  // Prevent duplicate submissions
  const submittedQuestions = useRef<Set<number>>(new Set())

  const currentQuestion = QUESTIONS[questionIndex] ?? null
  const totalQuestions = QUESTIONS.length

  // Create assessment on first question answer if not yet created
  const ensureAssessment = useCallback(
    async (categoryId?: string) => {
      if (assessmentId) return assessmentId
      const problemType = CATEGORY_TO_PROBLEM_TYPE[categoryId || 'market-fit'] || 'market_fit'
      const result = await apiCreateAssessment(problemType)
      setAssessmentId(result.id)
      track('assessment_started', { assessment_id: result.id })
      return result.id
    },
    [assessmentId],
  )

  const answerQuestion = useCallback(
    async (answer: string) => {
      const q = QUESTIONS[questionIndex]
      if (!q) return

      // Calculate time spent
      const timeSpentMs = Date.now() - questionStartTime.current

      // Show loading state — disable input
      setInsightText('Saving your response...')
      setError(null)

      try {
        // Ensure assessment exists
        const aId = await ensureAssessment()

        // Skip if already submitted (prevents double-submit)
        if (submittedQuestions.current.has(q.step)) {
          // Already submitted, just advance
        } else {
          // Determine answerText vs answerValue
          const isSelect = q.type === 'select'
          const payload = {
            questionId: q.step,
            ...(isSelect ? { answerValue: answer } : { answerText: answer }),
            timeSpentMs,
            questionOrder: q.step,
          }

          const result = await apiSubmitResponse(aId, payload)
          submittedQuestions.current.add(q.step)

          track('question_answered', {
            question_number: q.step,
            question_type: q.type,
            answer_length: answer.length,
            time_spent_ms: timeSpentMs,
          })

          // Use BE micro-insight if available
          const insight = result.microInsight?.insightText || 'Processing your response...'
          setInsightText(insight)
        }

        // After a brief pause for the insight, advance to next question
        const nextIndex = questionIndex + 1
        setTimeout(() => {
          setInsightText(null)
          questionStartTime.current = Date.now()
          if (nextIndex < QUESTIONS.length) {
            setQuestionIndex(nextIndex)
          } else {
            setStep('analysis')
          }
        }, 2000)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save response'
        setInsightText(null)
        setError(message)
      }
    },
    [questionIndex, ensureAssessment],
  )

  const runPipeline = useCallback(async () => {
    if (!assessmentId) return
    setLoading(true)
    setError(null)
    track('analysis_started', { assessment_id: assessmentId })
    const startTime = Date.now()
    try {
      const completeResult = await apiCompleteAssessment(assessmentId)

      // If the server returned the report directly (cached/idempotent), use it
      if (completeResult.reportToken) {
        setReportToken(completeResult.reportToken)
        setPreviewData(completeResult.previewContent)
        track('analysis_completed', { assessment_id: assessmentId, duration_ms: Date.now() - startTime })
        return
      }

      // Server returned 202 — poll for completion
      const POLL_INTERVAL = 5000
      const MAX_POLL_TIME = 5 * 60 * 1000 // 5 minutes

      const poll = (): Promise<void> =>
        new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const status = await apiGetAssessmentStatus(assessmentId)

              if (status.status === 'report_generated' || status.status === 'unlocked') {
                clearInterval(interval)
                if (status.reportToken) {
                  setReportToken(status.reportToken)
                }
                if (status.previewContent) {
                  setPreviewData(status.previewContent)
                }
                track('analysis_completed', {
                  assessment_id: assessmentId,
                  duration_ms: Date.now() - startTime,
                })
                resolve()
              }

              if (Date.now() - startTime > MAX_POLL_TIME) {
                clearInterval(interval)
                reject(new Error('Analysis is taking longer than expected. Please try refreshing.'))
              }
            } catch (pollErr) {
              clearInterval(interval)
              reject(pollErr)
            }
          }, POLL_INTERVAL)
        })

      await poll()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline failed'
      setError(message)
      track('analysis_failed', { assessment_id: assessmentId, error: message })
    } finally {
      setLoading(false)
    }
  }, [assessmentId])

  const completeAnalysis = useCallback(() => {
    setStep('preview')
  }, [])

  const submitEmail = useCallback(
    async (email: string) => {
      if (!assessmentId || !reportToken) return
      setLoading(true)
      setError(null)
      setUserEmail(email)
      try {
        await apiSubmitLead(assessmentId, email)
        track('email_submitted', { email_domain: email.split('@')[1] })
        identifyUser(email)

        // Fetch full unlocked report
        const reportResult = await apiGetReport(reportToken)
        if (reportResult.report) {
          setReportData(reportResult.report as unknown as ReportData)
        }

        track('report_unlocked', { assessment_id: assessmentId, report_token: reportToken })
        setEmailUnlocked(true)
        setStep('report')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unlock report')
      } finally {
        setLoading(false)
      }
    },
    [assessmentId, reportToken],
  )

  return {
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
    assessmentId,
    reportToken,
    previewData,
    reportData,
    loading,
    error,
    userEmail,
    runPipeline,
    ensureAssessment,
  }
}
