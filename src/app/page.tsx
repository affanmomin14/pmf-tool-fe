'use client'

import { useState, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { track } from '@/lib/posthog'
import { FloatingNavbar } from '@/components/ui/aceternity/floating-navbar'
import { InfiniteMovingCards } from '@/components/ui/aceternity/infinite-moving-cards'
import { Spotlight } from '@/components/ui/aceternity/spotlight'
import { ShimmerButton } from '@/components/ui/magicui/shimmer-button'
import { MagicCard } from '@/components/ui/magicui/magic-card'
import { HeroSection } from '@/components/landing/HeroSection'
import { AssessmentWizard } from '@/components/chat/AssessmentWizard'

const ease = [0.25, 1, 0.5, 1] as const

const NAV_ITEMS = [
  { name: 'How it Works', link: '#how-it-works' },
  { name: 'Testimonials', link: '#testimonials' },
]

const TESTIMONIALS = [
  {
    quote:
      'We were about to double down on paid ads. The PMF report showed us retention was the real problem. Saved months and $40K in ad spend.',
    name: 'Akash M.',
    role: 'Co-founder, NoteStack',
    metric: 'Saved $40K',
  },
  {
    quote:
      'The positioning audit was spot-on. We changed our homepage copy and saw a 34% increase in signup-to-activation.',
    name: 'Elena V.',
    role: 'CEO, Briefcase',
    metric: '+34% activation',
  },
  {
    quote:
      'Best free tool for early-stage founders. The Sprint 0 plan gave us a clear 4-week roadmap we actually executed.',
    name: 'Jordan T.',
    role: 'Founder, Climbr',
    metric: 'PMF in 8 weeks',
  },
  {
    quote:
      "I've used every PMF framework out there. This is the only one that gives actionable insights, not just theory.",
    name: 'Priya S.',
    role: 'CTO, DataLayer',
    metric: '2x iteration speed',
  },
  {
    quote: 'The competitive moat section alone was worth it. Completely reframed our go-to-market strategy.',
    name: 'Marcus L.',
    role: 'Founder, Brevity',
    metric: '3x pipeline growth',
  },
  {
    quote:
      'Used this before our Series A pitch. The data-backed insights gave us credibility with VCs that a slide deck alone never could.',
    name: 'Sarah K.',
    role: 'CEO, DataStack',
    metric: '$2.5M raised',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick your challenge',
    description:
      'Select from 5 critical PMF dimensions — retention, positioning, distribution, monetization, or market fit.',
    icon: '🎯',
  },
  {
    step: '02',
    title: 'Answer 5 questions',
    description: 'Our AI asks targeted questions and generates real-time micro-insights as you respond.',
    icon: '💬',
  },
  {
    step: '03',
    title: 'Get your report',
    description: 'Receive a 9-section diagnostic with risk signals, strengths, and a Sprint 0 action plan.',
    icon: '📊',
  },
]

export default function Home() {
  const [showChat, setShowChat] = useState(false)

  const handleStartAssessment = useCallback((source: string = 'hero') => {
    track('cta_clicked', { source })
    setShowChat(true)
    setTimeout(() => {
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Aceternity: Floating Navbar */}
      {!showChat && <FloatingNavbar navItems={NAV_ITEMS} ctaLabel="Get Started" onCtaClick={() => handleStartAssessment('navbar')} />}

      {/* Landing Page */}
      <AnimatePresence>
        {!showChat && (
          <motion.div exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}>
            {/* Hero with SparklesCore + BackgroundBeams */}
            <HeroSection onStartAssessment={handleStartAssessment} />

            {/* === How It Works === */}
            <section id="how-it-works" className="py-16 md:py-20 px-6 relative">
              <Spotlight fill="#10B981" />
              <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, ease }}
                  className="text-center mb-10"
                >
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-600 mb-3 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                    How It Works
                  </span>
                  <h2
                    className="text-3xl md:text-[42px] leading-[1.15] text-foreground font-normal tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Three minutes from question
                    <br />
                    to <span className="italic text-gradient">strategic clarity</span>
                  </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {HOW_IT_WORKS.map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ delay: i * 0.15, duration: 0.6, ease }}
                    >
                      <MagicCard
                        className="card-elevated p-7 h-full group"
                        gradientColor="rgba(16, 185, 129, 0.06)"
                      >
                        {/* Step number + icon row */}
                        <div className="flex items-center justify-between mb-5">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shadow-md"
                            style={{ background: 'linear-gradient(135deg, #059669, #0D9488)' }}
                          >
                            {item.step}
                          </div>
                          <span className="text-2xl">{item.icon}</span>
                        </div>

                        <h3 className="text-[16px] font-semibold text-foreground mb-2 tracking-tight">{item.title}</h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{item.description}</p>

                        {/* Bottom connector line */}
                        {i < 2 && (
                          <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-px bg-gradient-to-r from-border to-transparent" />
                        )}
                      </MagicCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Gradient divider */}
            <div className="max-w-5xl mx-auto px-6">
              <div className="divider-light" />
            </div>

            {/* === Testimonials with Infinite Moving Cards === */}
            <section id="testimonials" className="py-16 md:py-20 px-6 relative overflow-hidden section-alt">
              <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, ease }}
                  className="text-center mb-10"
                >
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-600 mb-3 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                    Trusted by Founders
                  </span>
                  <h2
                    className="text-3xl md:text-[42px] leading-[1.15] text-foreground font-normal tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Real results from <span className="italic text-gradient">real founders</span>
                  </h2>
                </motion.div>

                {/* Aceternity: Infinite Moving Cards — two rows, opposite directions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  <InfiniteMovingCards items={TESTIMONIALS.slice(0, 3)} direction="left" speed="slow" />
                  <InfiniteMovingCards items={TESTIMONIALS.slice(3)} direction="right" speed="slow" />
                </motion.div>
              </div>
            </section>

            {/* === Bottom CTA with Spotlight === */}
            <section className="py-16 md:py-20 px-6 relative">
              <Spotlight fill="#0D9488" />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="max-w-3xl mx-auto text-center relative z-10"
              >
                <h2
                  className="text-3xl md:text-[42px] leading-[1.15] text-foreground mb-3 font-normal tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Ready to find your <span className="italic text-gradient">PMF gaps</span>?
                </h2>
                <p className="text-[15px] text-muted-foreground mb-7 max-w-md mx-auto">
                  No signup. No credit card. Get your full diagnostic in under 3 minutes.
                </p>
                <ShimmerButton onClick={() => handleStartAssessment('bottom_cta')} aria-label="Start free assessment">
                  Start Free Assessment
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </ShimmerButton>
              </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-6 px-6 border-t border-border">
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #059669, #0D9488)' }}
                  >
                    <span className="text-white font-bold text-[8px]">P</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground">PMF Insights by Wednesday Solutions</span>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  &copy; {new Date().getFullYear()} Wednesday Solutions. All rights reserved.
                </p>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      {showChat && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <AssessmentWizard />
        </motion.div>
      )}
    </main>
  )
}
