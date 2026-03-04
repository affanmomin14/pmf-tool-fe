import type { CategoryOption, PreviewSignal, ReportSection } from './types'

export const CATEGORIES: CategoryOption[] = [
  {
    id: 'retention',
    icon: '🔄',
    title: 'Retention & Engagement',
    description: 'Users sign up but churn within weeks',
    count: 2847,
  },
  {
    id: 'positioning',
    icon: '🎯',
    title: 'Positioning & Messaging',
    description: 'Struggle to articulate unique value',
    count: 2134,
  },
  {
    id: 'distribution',
    icon: '📢',
    title: 'Distribution & Growth',
    description: 'No scalable acquisition channels found',
    count: 3201,
  },
  {
    id: 'monetization',
    icon: '💰',
    title: 'Monetization & Pricing',
    description: "Users love it but won't pay for it",
    count: 1876,
  },
  {
    id: 'market-fit',
    icon: '🧩',
    title: 'Market & Segment Fit',
    description: 'Not sure who the ideal customer is',
    count: 2563,
  },
]

export const QUESTIONS = [
  {
    step: 1,
    question: 'What does your product do in one sentence, and who is the primary user?',
    type: 'textarea' as const,
    placeholder:
      'e.g., "We help remote teams track async standups. Primary users are engineering managers at 50-200 person companies."',
  },
  {
    step: 2,
    question: 'What is the single strongest signal that users find value in your product?',
    type: 'textarea' as const,
    placeholder:
      'e.g., "40% of users who complete onboarding return within 48 hours" or "Users tell us they can\'t go back to their old workflow."',
  },
  {
    step: 3,
    question: 'What is your primary distribution channel today?',
    type: 'select' as const,
    options: [
      { id: 'organic-search', label: 'Organic Search / SEO', value: 'organic-search' },
      { id: 'paid-ads', label: 'Paid Ads (Google, Meta, etc.)', value: 'paid-ads' },
      { id: 'social-media', label: 'Social Media / Content', value: 'social-media' },
      { id: 'referral', label: 'Word of Mouth / Referral', value: 'referral' },
      { id: 'outbound', label: 'Outbound Sales / Cold Email', value: 'outbound' },
      { id: 'partnerships', label: 'Partnerships / Integrations', value: 'partnerships' },
      { id: 'community', label: 'Community / Events', value: 'community' },
      { id: 'none', label: 'No clear channel yet', value: 'none' },
    ],
  },
  {
    step: 4,
    question: 'What happens when you ask a paying customer "What would you use if our product didn\'t exist?"',
    type: 'textarea' as const,
    placeholder:
      'e.g., "Most say they\'d go back to spreadsheets" or "They mention Competitor X, but say we\'re easier to use."',
  },
  {
    step: 5,
    question: 'What is the biggest risk that could prevent you from reaching PMF in the next 6 months?',
    type: 'textarea' as const,
    placeholder:
      'e.g., "Running out of runway before finding a scalable acquisition channel" or "Enterprise buyers have a 6-month sales cycle we can\'t sustain."',
  },
]

export const MICRO_INSIGHTS: Record<string, string[]> = {
  '1': [
    'Interesting. Clarity of target user is a strong PMF signal. Let me dig deeper.',
    'Got it. Founders who can articulate this in one sentence are 2.3x more likely to find PMF.',
    'Clear product definition detected. This is a positive signal for your PMF journey.',
  ],
  '2': [
    "That retention signal tells me a lot. Most pre-PMF companies can't point to one metric. You can.",
    'Valuable insight. The best PMF signals are behavioral, not verbal. Let me factor this in.',
    'This is key data. Return usage patterns are one of the strongest PMF indicators.',
  ],
  '3': [
    'Your channel choice reveals a lot about your growth trajectory. Analyzing implications now.',
    "Distribution is where most post-MVP startups get stuck. I'm mapping your channel to PMF benchmarks.",
    'Channel-market fit is as important as product-market fit. Noting this for your report.',
  ],
  '4': [
    'The "what would you use instead" test is the Sean Ellis acid test for PMF. Processing your response.',
    'Substitution analysis is revealing. This tells me about your competitive moat.',
    'This answer reveals your positioning strength. Very few founders ask this question early enough.',
  ],
  '5': [
    'Understanding your perceived risk helps me calibrate the entire analysis. Building your report now.',
    'Risk awareness is a PMF superpower. Founders who name their risks clearly overcome them 4x faster.',
    'Final piece of the puzzle. I now have enough to generate a comprehensive PMF diagnostic.',
  ],
}

export const LOADING_LABELS = [
  'Analyzing your responses...',
  'Cross-referencing with 10,000+ PMF patterns...',
  'Identifying retention signals...',
  'Evaluating market positioning...',
  'Mapping distribution channels...',
  'Building competitive landscape...',
  'Generating strategic recommendations...',
  'Compiling your PMF report...',
]

export const PMF_FACTS = [
  { title: 'Only 1 in 4', description: 'startups achieve true product-market fit before Series A.' },
  { title: 'The #1 reason', description: 'startups fail is building something nobody wants (42% of cases).' },
  {
    title: 'Retention > Growth',
    description: 'Companies with 40%+ monthly retention are 3x more likely to reach PMF.',
  },
  {
    title: 'Sean Ellis Test',
    description: 'If 40%+ users say they\'d be "very disappointed" without your product, you have PMF.',
  },
  {
    title: 'Channel-Market Fit',
    description: 'is as important as product-market fit. Most founders discover this too late.',
  },
  {
    title: 'The PMF Score',
    description: 'Companies scoring above 70 on PMF diagnostics raise 2.1x more in their next round.',
  },
]

export const PREVIEW_SIGNALS: PreviewSignal[] = [
  {
    type: 'risk',
    emoji: '🔴',
    title: 'Distribution Channel Risk',
    description: 'Your current channel may not scale to your target market segment. Critical pivot point identified.',
  },
  {
    type: 'signal',
    emoji: '🟡',
    title: 'Positioning Gap Detected',
    description:
      'Your value proposition resonates but lacks differentiation clarity. Adjustable with messaging refinement.',
  },
  {
    type: 'strength',
    emoji: '🟢',
    title: 'Strong Retention Signal',
    description: 'User engagement patterns suggest core value delivery. This is your strongest PMF indicator.',
  },
]

export const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'reality-check',
    title: 'Reality Check',
    icon: '🔍',
    content:
      'Based on your responses, your product shows early signs of value delivery but has critical gaps in distribution and positioning that must be addressed before scaling.',
    severity: 'warning',
    metrics: [
      { label: 'PMF Score', value: '47/100', trend: 'neutral' },
      { label: 'Confidence', value: 'Medium', trend: 'neutral' },
    ],
  },
  {
    id: 'market-analysis',
    title: 'Market Analysis',
    icon: '📊',
    content:
      "Your target market is viable but competitive. The segment you've identified has 3-5 established players, but your unique angle on the problem creates whitespace opportunity.",
    severity: 'neutral',
    metrics: [
      { label: 'Market Size', value: 'Medium', trend: 'up' },
      { label: 'Competition', value: 'High', trend: 'down' },
    ],
  },
  {
    id: 'retention-deep-dive',
    title: 'Retention Deep Dive',
    icon: '🔄',
    content:
      'Your retention signals suggest product value is being delivered, but the activation-to-habit loop has friction. Focus on reducing time-to-value in onboarding.',
    severity: 'positive',
    metrics: [
      { label: 'Activation Signal', value: 'Strong', trend: 'up' },
      { label: 'Habit Loop', value: 'Weak', trend: 'down' },
    ],
  },
  {
    id: 'positioning-audit',
    title: 'Positioning Audit',
    icon: '🎯',
    content:
      'Your one-liner needs sharpening. Users understand what you do but not why they should switch from their current solution. The "10x better" narrative is missing.',
    severity: 'warning',
    metrics: [
      { label: 'Clarity', value: 'Good', trend: 'up' },
      { label: 'Differentiation', value: 'Weak', trend: 'down' },
    ],
  },
  {
    id: 'distribution-strategy',
    title: 'Distribution Strategy',
    icon: '📢',
    content:
      "Your current channel shows promise but hasn't been validated at scale. Recommend testing 2 additional channels before doubling down on your primary.",
    severity: 'critical',
    metrics: [
      { label: 'Channel Fit', value: 'Low', trend: 'down' },
      { label: 'CAC Efficiency', value: 'Unknown', trend: 'neutral' },
    ],
  },
  {
    id: 'monetization-review',
    title: 'Monetization Review',
    icon: '💰',
    content:
      'Pricing signals indicate willingness to pay exists in your market. Consider value-based pricing tiers aligned with your strongest retention cohort.',
    severity: 'neutral',
    metrics: [
      { label: 'WTP Signal', value: 'Present', trend: 'up' },
      { label: 'Price Sensitivity', value: 'Medium', trend: 'neutral' },
    ],
  },
  {
    id: 'competitive-moat',
    title: 'Competitive Moat',
    icon: '🏰',
    content:
      'Your substitution analysis reveals a moderate moat. Users have alternatives but prefer your approach. Strengthen this by building network effects or data advantages.',
    severity: 'warning',
    metrics: [
      { label: 'Moat Strength', value: 'Moderate', trend: 'neutral' },
      { label: 'Switching Cost', value: 'Low', trend: 'down' },
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    icon: '⚠️',
    content:
      'Your identified risk aligns with the most common pre-PMF failure pattern. Mitigation strategies are available and should be prioritized in your next sprint.',
    severity: 'critical',
    metrics: [
      { label: 'Risk Level', value: 'High', trend: 'down' },
      { label: 'Mitigatable', value: 'Yes', trend: 'up' },
    ],
  },
  {
    id: 'action-plan',
    title: 'Sprint 0 Action Plan',
    icon: '🚀',
    content:
      'Based on this analysis, your immediate priorities should be: (1) Sharpen positioning with the "switching" narrative, (2) Test 2 new distribution channels, (3) Instrument your activation funnel to identify drop-off points.',
    severity: 'positive',
    metrics: [
      { label: 'Priority Actions', value: '3', trend: 'neutral' },
      { label: 'Timeline', value: '4 weeks', trend: 'neutral' },
    ],
  },
]
