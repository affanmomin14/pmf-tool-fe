'use client'

import { useEffect } from 'react'

import { motion, stagger, useAnimate } from 'framer-motion'

import { cn } from '@/lib/utils'

interface TextGenerateEffectProps {
  words: string
  className?: string
  filter?: boolean
  duration?: number
  highlightWords?: string[]
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  highlightWords = [],
}: TextGenerateEffectProps) {
  const [scope, animate] = useAnimate()
  const wordsArray = words.split(' ')

  useEffect(() => {
    animate('span', { opacity: 1, filter: filter ? 'blur(0px)' : 'none' }, { duration, delay: stagger(0.06) })
  }, [animate, duration, filter])

  return (
    <div className={cn('font-normal', className)} ref={scope}>
      <div className="leading-[1.1] tracking-[-0.03em]">
        {wordsArray.map((word, idx) => {
          const isHighlight = highlightWords.includes(word.replace(/[^a-zA-Z]/g, ''))
          return (
            <motion.span
              key={`${word}-${idx}`}
              className={cn('inline-block', isHighlight && 'text-gradient italic')}
              style={{
                filter: filter ? 'blur(8px)' : 'none',
                opacity: 0,
                marginRight: '0.25em',
                fontFamily: 'var(--font-display)',
              }}
            >
              {word}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}
