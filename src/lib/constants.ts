import type { CategoryOption, PreviewSignal } from './types'

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
    question: 'What does your product do?',
    type: 'textarea' as const,
    placeholder:
      'Describe your product in 1-2 sentences. If you have a URL, include it.',
  },
  {
    step: 2,
    question: 'Who is this built for?',
    type: 'textarea' as const,
    placeholder:
      'Be as specific as possible. e.g., "Series A B2B SaaS founders with 10-50 employees hiring their first marketer"',
  },
  {
    step: 3,
    question: 'How do people find and start using it?',
    type: 'select' as const,
    options: [
      { id: 'self_serve', label: 'They sign up and use it themselves', value: 'self_serve' },
      { id: 'sales_assisted', label: 'They book a demo or talk to us first', value: 'sales_assisted' },
      { id: 'founder_led', label: 'I personally sell it — DMs, calls, network', value: 'founder_led' },
      { id: 'partner_channel', label: 'Through a partner, marketplace, or integration', value: 'partner_channel' },
      { id: 'undefined', label: "We haven't figured this out yet", value: 'undefined' },
    ],
  },
  {
    step: 4,
    question: 'What feels most stuck right now?',
    type: 'textarea' as const,
    placeholder:
      'e.g., "Nobody knows about us", "People sign up but never come back", "Users love it but won\'t pay"',
  },
  {
    step: 5,
    question: 'Where are you at right now? Users, revenue, timeline — whatever you have.',
    type: 'textarea' as const,
    placeholder:
      'e.g., "200 beta users, no revenue, 6 months in" or "$8K MRR, 50 paying customers, launched 3 months ago"',
  },
]

export const MICRO_INSIGHTS: Record<string, string[]> = {
  '1': [
    'Got it. Products that can be described in one sentence are 2.3x more likely to find PMF.',
    'Clear product definition detected. This helps me identify the right competitive set.',
    'Noted. I\'ll compare your positioning against the top players in this space.',
  ],
  '2': [
    'ICP specificity is one of the strongest PMF predictors. The more specific, the better.',
    'Interesting. I\'ll score this against how focused the top companies in your space are.',
    'Got it. Vague ICPs are the #1 reason founders waste runway on the wrong channels.',
  ],
  '3': [
    '72% of SaaS products under $1K/mo use self-serve as their main channel. Let me compare.',
    'Distribution is where most post-MVP startups get stuck. Mapping your model to category benchmarks.',
    'Channel-market fit is as important as product-market fit. Noting this for your report.',
  ],
  '4': [
    'This tells me where to focus the report. I\'ll cross-reference with what research shows.',
    'Pain points are signals. I\'ll map this to the most common failure patterns in your category.',
    'Noted. This will drive your primary break analysis and top recommendations.',
  ],
  '5': [
    'Traction data is the foundation for Demand and Trust scoring. Processing now.',
    'Median time from beta to first dollar for funded startups: 4.2 months. Let me benchmark you.',
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

