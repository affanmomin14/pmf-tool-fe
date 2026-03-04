'use client'

import { useState, useCallback, useRef } from 'react'

import type { UserResponse, PreviewContent, ReportData } from '@/lib/types'
import { QUESTIONS } from '@/lib/constants'
import {
  createAssessment as apiCreateAssessment,
  submitResponse as apiSubmitResponse,
  completeAssessment as apiCompleteAssessment,
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
  const [responses, setResponses] = useState<UserResponse[]>([])
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

      const newResponse: UserResponse = {
        step: q.step,
        question: q.question,
        answer,
      }
      setResponses(prev => [...prev, newResponse])

      // Calculate time spent
      const timeSpentMs = Date.now() - questionStartTime.current

      try {
        // Ensure assessment exists
        const aId = await ensureAssessment()

        // Determine answerText vs answerValue
        const isSelect = q.type === 'select'
        const payload = {
          questionId: q.step,
          ...(isSelect ? { answerValue: answer } : { answerText: answer }),
          timeSpentMs,
          questionOrder: q.step,
        }

        const result = await apiSubmitResponse(aId, payload)

        track('question_answered', {
          question_number: q.step,
          question_type: q.type,
          answer_length: answer.length,
          time_spent_ms: timeSpentMs,
          ...(q.step === 3 ? { answer_value: answer } : {}),
        })

        // Use BE micro-insight if available, fallback to generic
        const insight = result.microInsight?.insightText || 'Processing your response...'
        setInsightText(insight)
      } catch {
        // Fallback: show generic insight, don't block the flow
        setInsightText('Processing your response...')
      }

      // After a brief pause for the insight toast, advance
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
      const result = await apiCompleteAssessment(assessmentId)
      setReportToken(result.reportToken)
      setPreviewData(result.previewContent)
      track('analysis_completed', { assessment_id: assessmentId, duration_ms: Date.now() - startTime })
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
    responses,
    insightText,
    emailUnlocked,
    answerQuestion,
    completeAnalysis,
    submitEmail,
    // New API state
    assessmentId,
    reportToken,
    previewData,
    reportData,
    loading,
    error,
    userEmail,
    runPipeline,
  }
}
