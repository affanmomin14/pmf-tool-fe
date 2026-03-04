export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  type: 'text' | 'categories' | 'question' | 'insight' | 'loading' | 'preview' | 'email-gate' | 'report' | 'cta'
  options?: CategoryOption[] | QuestionOption[]
  timestamp: number
}

export interface CategoryOption {
  id: string
  icon: string
  title: string
  description: string
  count: number
}

export interface QuestionOption {
  id: string
  label: string
  value: string
}

export interface UserResponse {
  step: number
  question: string
  answer: string
}

export interface PreviewSignal {
  type: 'risk' | 'signal' | 'strength'
  emoji: string
  title: string
  description: string
}

export interface ReportSection {
  id: string
  title: string
  icon: string
  content: string
  severity: 'critical' | 'warning' | 'positive' | 'neutral'
  metrics?: ReportMetric[]
}

export interface ReportMetric {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
}

export type ChatStep =
  | 'landing'
  | 'category-select'
  | 'questions'
  | 'analysis'
  | 'preview'
  | 'email-gate'
  | 'report'
  | 'cta'

/* ── API response types ── */

export interface PreviewContent {
  pmfScore: number
  pmfStage: string
  verdict: string
  primaryBreak: string
  strengths: string[]
}

export interface ScorecardDimension {
  dimension: string
  score: number
  label: 'critical' | 'weak' | 'moderate' | 'solid' | 'strong'
  insight: string
}

export interface ReportData {
  header: {
    companyName: string
    category: string
    subCategory: string
    assessmentDate: string
    pmfScore: number
    pmfStage: string
    verdict: string
  }
  reality_check: {
    summary: string
    strengths: string[]
    concerns: string[]
  }
  scorecard: ScorecardDimension[]
  market: {
    tam: string | null
    sam: string | null
    growthRate: string | null
    positioning: string
    opportunity: string
  }
  sales_model: {
    current: string
    recommended: string
    reasoning: string
  }
  competitors: {
    name: string
    comparison: string
    threatLevel: 'low' | 'medium' | 'high'
  }[]
  positioning: {
    current: string
    recommended: string
    gap: string
  }
  bottom_line: {
    summary: string
    primaryBreak: string
    nextSteps: string[]
  }
  recommendations: {
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    timeframe: string
  }[]
  sources?: string[]
}
