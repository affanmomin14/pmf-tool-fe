'use client'

import { useRef, useState, useEffect } from 'react'

import { motion, useInView, AnimatePresence } from 'framer-motion'

import { FlipWords } from '@/components/ui/aceternity/flip-words'
import { Highlight } from '@/components/ui/aceternity/hero-highlight'
import { SparklesCore } from '@/components/ui/aceternity/sparkles-core'
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams'
import { ShimmerButton } from '@/components/ui/magicui/shimmer-button'

/* ─── Rotating PMF Facts ─── */
const PMF_FACTS = [
  { text: 'Only 10% of startups achieve true product-market fit', source: 'CB Insights' },
  { text: 'Companies with PMF grow 2.5x faster than those without', source: 'Andreessen Horowitz' },
  { text: '42% of startups fail because there\'s no market need', source: 'CB Insights' },
  { text: 'The median time to PMF is 2–3 years after founding', source: 'First Round Capital' },
  { text: 'Startups that pivot once or twice raise 2.5x more funding', source: 'Startup Genome' },
  { text: '74% of startup failures are due to premature scaling', source: 'Startup Genome' },
  { text: 'The #1 reason startups fail is lack of product-market fit', source: 'Fortune' },
  { text: '90% of new startups fail', source: 'Forbes' },
  { text: 'The average startup takes 6 months to validate their MVP', source: 'HubSpot' },
  { text: 'Startups that scale properly grow 20x faster than those that scale prematurely', source: 'Startup Genome' },
  { text: 'Customer retention is the strongest signal of long-term PMF', source: 'Sequoia Capital' },
  { text: 'Product-Market Fit is when you\'ve built something that people actually want', source: 'Sam Altman' },
  { text: 'You can always feel when product-market fit isn\'t happening', source: 'Marc Andreessen' },
  { text: 'PMF isn\'t a one-time event; it\'s a continuous process of refinement', source: 'Eric Ries' },
  { text: 'Most founders focus on the product, but PMF is found in the market', source: 'Steve Blank' },
]

function RotatingFacts() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % PMF_FACTS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const fact = PMF_FACTS[index]

  return (
    <div className="h-[48px] flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="text-center"
        >
          <span className="text-[13px] text-muted-foreground">{fact.text}</span>
          {fact.source && (
            <span className="text-[11px] text-muted-foreground/60 ml-1.5">— {fact.source}</span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ─── Hero Orb Animation ─── */
function HeroOrbs() {
  return (
    <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
      {/* Primary floating orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          top: '10%',
          right: '5%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Secondary orb */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          bottom: '15%',
          left: '3%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          y: [0, 20, 0],
          x: [0, -10, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
      />
      {/* Accent ring */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '1px solid rgba(16, 185, 129, 0.06)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
    </div>
  )
}

interface HeroSectionProps {
  onStartAssessment: () => void
}

const ease = [0.25, 1, 0.5, 1] as const

export function HeroSection({ onStartAssessment }: HeroSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 40%, #f0fdfa 70%, #f8fafc 100%)' }}
    >
      {/* SparklesCore — subtle particle texture on light */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          particleDensity={80}
          particleColor="#10B981"
          minSize={0.3}
          maxSize={1}
          speed={0.4}
        />
      </div>

      {/* BackgroundBeams — subtle beam layer */}
      <BackgroundBeams className="z-[1] opacity-50" />

      {/* Radial glow — top center green wash */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[70rem] h-[28rem] z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.1) 0%, rgba(13, 148, 136, 0.05) 40%, transparent 70%)',
        }}
      />

      {/* Dot pattern overlay for texture */}
      <div className="absolute inset-0 z-[2] pointer-events-none hero-dot-pattern opacity-40" />

      {/* Animated floating orbs */}
      <HeroOrbs />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-16 md:py-20">

        {/* Headline with FlipWords + Hero Highlight */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="text-[2.5rem] sm:text-[3.25rem] md:text-[4.25rem] leading-[1.06] tracking-tight text-foreground mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Highlight>Validate</Highlight> your path to
          <br />
          <FlipWords
            words={['Product-Market Fit', 'Growth Strategy', 'Revenue Model', 'Retention Metrics']}
            duration={2500}
          />
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="text-[16px] md:text-[17px] leading-relaxed text-muted-foreground max-w-lg mx-auto mb-7"
        >
          A free, AI-driven diagnostic for post-MVP founders.
          <br className="hidden sm:block" />
          Identify traction gaps, market risks, and your next move — in 3 minutes.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45, ease }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7"
        >
          <ShimmerButton onClick={onStartAssessment} aria-label="Start free assessment">
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

          <span className="text-[13px] text-muted-foreground">No signup required &middot; 3 min</span>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.6, ease }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[12px] text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Free forever</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span>No signup wall</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <span>
            Built by <span className="font-medium text-foreground">Wednesday Solutions</span>
          </span>
        </motion.div>
      </div>

      {/* Rotating PMF Facts — bottom-left toast */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.8, ease }}
        className="absolute bottom-8 left-6 z-20 max-w-sm"
      >
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <span className="relative flex h-[7px] w-[7px] shrink-0 mt-[7px]">
            <span
              className="absolute inset-0 rounded-full bg-emerald-500"
              style={{ animation: 'pulse-ring 2s cubic-bezier(0,0,0.2,1) infinite' }}
            />
            <span
              className="relative rounded-full h-[7px] w-[7px] bg-emerald-500"
              style={{ boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)' }}
            />
          </span>
          <RotatingFacts />
        </div>
      </motion.div>

      {/* Bottom gradient fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 z-[5] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--background), transparent)',
        }}
      />
    </section>
  )
}
