'use client'

import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="flex gap-2.5 px-5 py-1.5"
    >
      <div className="shrink-0 mt-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0F172A, #334155)' }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5"
            />
          </svg>
        </div>
      </div>
      <div className="bg-white border border-border/60 shadow-sm rounded-2xl px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-muted-foreground/40"
            style={{ animation: `typing-dot 1.4s ${i * 0.15}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </motion.div>
  )
}
