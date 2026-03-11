const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error?.message || `API error: ${res.status}`)
  }

  return json.data as T
}

export function createAssessment(problemType: string) {
  return request<{ id: string; problemType: string; status: string; createdAt: string }>(
    '/api/assessments',
    { method: 'POST', body: JSON.stringify({ problemType }) },
  )
}

export function submitResponse(
  assessmentId: string,
  payload: {
    questionId: number
    answerText?: string
    answerValue?: string
    timeSpentMs: number
    questionOrder: number
  },
) {
  // Strip undefined values so they're omitted from JSON (BE uses .optional(), not .nullable())
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined && v !== null),
  )
  return request<{
    response: { id: string; questionId: number; answerText: string | null; answerValue: string | null; questionOrder: number }
    microInsight: { insightText: string; source: string } | null
  }>(`/api/assessments/${assessmentId}/responses`, {
    method: 'POST',
    body: JSON.stringify(clean),
  })
}

export function completeAssessment(assessmentId: string) {
  return request<{
    reportToken: string
    pmfScore: number
    pmfStage: string
    previewContent: {
      pmfScore: number
      pmfStage: string
      verdict: string
      primaryBreak: string
      strengths: string[]
    }
  }>(`/api/assessments/${assessmentId}/complete`, { method: 'POST' })
}

export function getAssessmentStatus(assessmentId: string) {
  return request<{
    id: string
    status: string
    pipelineErrorMessage?: string | null
    reportToken?: string
    previewContent?: {
      pmfScore: number
      pmfStage: string
      verdict: string
      primaryBreak: string
      strengths: string[]
    }
    pmfScore?: number
    pmfStage?: string
  }>(`/api/assessments/${assessmentId}`)
}

export function getReport(token: string) {
  return request<{
    isExpired: boolean
    isUnlocked: boolean
    report: Record<string, unknown> | null
    previewContent: {
      pmfScore: number
      pmfStage: string
      verdict: string
      primaryBreak: string
      strengths: string[]
    }
    pmfScore?: number
    pmfStage?: string
    primaryBreak?: string
  }>(`/api/reports/${token}`)
}

export function submitLead(assessmentId: string, email: string) {
  return request<{ leadId: string; isUnlocked: boolean; reportToken: string }>(
    '/api/leads',
    { method: 'POST', body: JSON.stringify({ assessmentId, email }) },
  )
}

export function sendReportEmail(token: string, email: string) {
  return request<{ sent: boolean }>(
    `/api/reports/${token}/email`,
    { method: 'POST', body: JSON.stringify({ email }) },
  )
}

export function fetchCategories() {
  return request<unknown[]>('/api/system/categories')
}
