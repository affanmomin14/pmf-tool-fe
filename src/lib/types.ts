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

/* ── PRD-aligned report data ── */

export interface ReportData {
  header: {
    product_name: string
    category: string
    pmf_score: number
    benchmark_score: number
    pmf_stage: 'pre_pmf' | 'approaching' | 'early_pmf' | 'strong'
    primary_break: string
    category_risk: 'low' | 'medium' | 'high'
    verdict: string
  }
  reality_check: {
    comparisons: Array<{
      you_said: string
      research_shows: string
      severity: 'critical' | 'warning' | 'aligned'
      question_ref: 'q1' | 'q2' | 'q3' | 'q4' | 'q5'
    }>
    root_cause: string
  }
  scorecard: {
    dimensions: Array<{
      name: string
      score: number
      benchmark: number
      status: 'critical' | 'at_risk' | 'on_track' | 'strong'
      evidence: string
      confidence?: 'low' | 'medium' | 'high'
    }>
  }
  market: {
    tam: { value: string; description: string }
    sam: { value: string; description: string }
    growth_rate: { value: string; description: string }
    regions: Array<{
      name: string
      percentage: number
      value: string
      note: string
    }>
    real_number_analysis: string
  }
  sales_model: {
    comparison: {
      you_said: string
      research_shows: string
      severity: string
    }
    models_table: Array<{
      model: string
      who_uses: string
      acv_range: string
      conversion: string
      your_fit: string
    }>
    diagnosis: string
    options: Array<{
      title: string
      icon: string
      pros: string[]
      cons: string[]
      timeline: string
      best_if: string
    }>
  }
  competitors: {
    competitor_list: Array<{
      name: string
      rating: number
      funding: string
      tier: 'direct' | 'incumbent' | 'adjacent' | 'invisible'
    }>
    tiers: Array<{
      tier_name: string
      companies: string
      why: string
    }>
    complaints: Array<{
      complaint: string
      percentage: string
      opportunity: string
    }>
  }
  positioning: {
    current: {
      text: string
      critique: string[]
    }
    recommended: {
      text: string
      improvements: string[]
    }
  }
  bottom_line: {
    verdict: string
    verdict_detail: string
    working: string[]
    not_working: string[]
    score_progression: Array<{
      label: string
      score: string
      detail: string
    }>
    one_thing: {
      title: string
      explanation: string
    }
    research_stats: Array<{
      number: string
      label: string
    }>
  }
  recommendations: Array<{
    rank: number
    title: string
    action: string
    evidence: string
    timeline: string
    effort: 'low' | 'medium' | 'high'
  }>
  sources: Array<{
    name: string
    year: string
    used_for: string
    source_url?: string | null
  }>
}
