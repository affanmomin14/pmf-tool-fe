'use client'

import { motion } from 'framer-motion'

import type { ChatMessage } from '@/lib/types'

interface ChatBubbleProps {
  message: ChatMessage
  stepNumber?: number
}

export function ChatBubble({ message, stepNumber }: ChatBubbleProps) {
  const isBot = message.role === 'bot'
  const isInsight = message.type === 'insight'
  const isQuestion = message.type === 'question'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className={`flex gap-2.5 px-5 py-1.5 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {/* Bot avatar */}
      {isBot && (
        <div className="shrink-0 mt-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0F172A, #334155)' }}
          >
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Message bubble */}
      {isQuestion ? (
        /* === Question Step Card === */
        <div className="max-w-[85%] sm:max-w-[75%]">
          <motion.div
            className="rounded-2xl px-5 py-4 border"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF, #F8FAFC)',
              borderColor: 'rgba(226, 232, 240, 0.8)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Step badge */}
            {stepNumber !== undefined && (
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #10B981, #0D9488)' }}
                >
                  {stepNumber}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70">
                  Question {stepNumber} of 5
                </span>
              </div>
            )}

            {/* Question text */}
            <p className="text-[14px] leading-relaxed text-foreground font-medium">{message.content}</p>

            {/* Decorative accent */}
            <motion.div
              className="mt-3 h-[2px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, #10B981, #0D9488, transparent)',
              }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            />
          </motion.div>
        </div>
      ) : (
        /* === Standard Message Bubble === */
        <div
          className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
            isBot
              ? isInsight
                ? 'bg-emerald-50/80 border border-emerald-100/80'
                : 'bg-white border border-border/60 shadow-sm'
              : 'text-white'
          }`}
          style={
            !isBot
              ? {
                  background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.15)',
                }
              : undefined
          }
        >
          {isInsight && (
            <div className="flex items-center gap-1.5 mb-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Insight</span>
            </div>
          )}
          <p
            className={`text-[13.5px] leading-relaxed ${
              isBot ? (isInsight ? 'text-emerald-900' : 'text-foreground') : 'text-white/95'
            }`}
          >
            {message.content}
          </p>
        </div>
      )}
    </motion.div>
  )
}
