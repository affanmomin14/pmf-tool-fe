'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import type { QuestionOption } from '@/lib/types'

interface QuestionInputProps {
  type: 'textarea' | 'select'
  placeholder?: string
  options?: QuestionOption[]
  onSubmit: (answer: string) => void
  disabled: boolean
  stepNumber?: number
}

const MIN_TEXT_LENGTH = 10

/* === Select option icons === */
const OPTION_ICONS: Record<string, string> = {
  'organic-search': '🔍',
  'paid-ads': '📣',
  'social-media': '📱',
  referral: '🗣️',
  outbound: '📧',
  partnerships: '🤝',
  community: '👥',
  none: '🧭',
}

/* === Circular Progress Ring === */
function ProgressRing({ progress, size = 28 }: { progress: number; size?: number }) {
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - Math.min(progress, 1) * circumference
  const isComplete = progress >= 1

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isComplete ? '#10B981' : '#94A3B8'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      {isComplete && (
        <motion.path
          d="M9 12.5L11.5 15L16 10"
          fill="none"
          stroke="#10B981"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rotate-90 origin-center"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        />
      )}
    </svg>
  )
}

/* === Textarea Input Mode === */
function TextareaInput({
  placeholder,
  onSubmit,
  disabled,
}: {
  placeholder?: string
  onSubmit: (answer: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isValid = value.trim().length >= MIN_TEXT_LENGTH
  const progress = Math.min(value.trim().length / MIN_TEXT_LENGTH, 1)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleSubmit = () => {
    if (!isValid || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && isValid) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="px-5 py-2"
    >
      <div className="ml-[42px] max-w-lg">
        <motion.div
          className="relative rounded-2xl border transition-all duration-300 overflow-hidden"
          style={{
            borderColor: isFocused ? 'rgba(16, 185, 129, 0.4)' : 'rgba(226, 232, 240, 0.8)',
            boxShadow: isFocused
              ? '0 0 0 3px rgba(16, 185, 129, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)'
              : '0 1px 3px rgba(0, 0, 0, 0.04)',
            background: '#FFFFFF',
          }}
        >
          {/* Animated top accent line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #10B981, #0D9488, transparent)',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />

          {/* Textarea area */}
          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={2}
              className="w-full resize-none text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
              style={{ minHeight: '56px' }}
              aria-label="Your answer"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-t border-slate-100/80">
            <div className="flex items-center gap-2.5">
              <ProgressRing progress={progress} />
              <AnimatePresence mode="wait">
                {value.length > 0 && !isValid ? (
                  <motion.span
                    key="counter"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="text-[11px] text-muted-foreground/60"
                  >
                    {MIN_TEXT_LENGTH - value.trim().length} more characters
                  </motion.span>
                ) : isValid ? (
                  <motion.span
                    key="ready"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="text-[11px] text-emerald-600 font-medium"
                  >
                    Ready to send
                  </motion.span>
                ) : (
                  <motion.span
                    key="hint"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="text-[11px] text-muted-foreground/40"
                  >
                    Shift + Enter for new line
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={!isValid || disabled}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isValid && !disabled ? 'linear-gradient(135deg, #0F172A, #1E293B)' : '#E2E8F0',
                color: isValid && !disabled ? '#FFFFFF' : '#94A3B8',
                boxShadow: isValid && !disabled ? '0 2px 8px rgba(15, 23, 42, 0.2)' : 'none',
                minHeight: '36px',
              }}
              whileHover={isValid && !disabled ? { y: -1, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)' } : {}}
              whileTap={isValid && !disabled ? { scale: 0.97 } : {}}
              aria-label="Submit answer"
            >
              Send
              <motion.svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                animate={isValid ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* === Select Option Cards === */
function SelectInput({
  options,
  onSubmit,
  disabled,
}: {
  options: QuestionOption[]
  onSubmit: (answer: string) => void
  disabled: boolean
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (option: QuestionOption) => {
    if (disabled || selectedId) return
    setSelectedId(option.id)
    // Small delay for visual feedback before submitting
    setTimeout(() => {
      onSubmit(option.label)
    }, 250)
  }

  // Deterministic stagger delays
  const delays = useMemo(() => options.map((_, i) => i * 0.04), [options])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-5 py-2"
    >
      <div className="ml-[42px] max-w-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option, index) => {
            const isHovered = hoveredId === option.id
            const isSelected = selectedId === option.id
            const icon = OPTION_ICONS[option.id] || '•'

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delays[index], duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHoveredId(option.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={disabled || (selectedId !== null && selectedId !== option.id)}
                className="relative text-left rounded-xl border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
                style={{
                  minHeight: '52px',
                  borderColor: isSelected
                    ? '#10B981'
                    : isHovered
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(226, 232, 240, 0.8)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(13, 148, 136, 0.04))'
                    : isHovered
                      ? 'rgba(248, 250, 252, 1)'
                      : '#FFFFFF',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(16, 185, 129, 0.1), 0 2px 8px rgba(16, 185, 129, 0.08)'
                    : isHovered
                      ? '0 2px 8px rgba(0, 0, 0, 0.04)'
                      : '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
                aria-label={option.label}
              >
                <div className="flex items-center gap-3 px-3.5 py-3">
                  {/* Icon */}
                  <span className="text-base shrink-0" role="img" aria-hidden="true">
                    {icon}
                  </span>

                  {/* Label */}
                  <span
                    className={`text-[13px] leading-snug flex-1 ${
                      isSelected ? 'text-emerald-800 font-semibold' : 'text-foreground/80 group-hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </span>

                  {/* Selection indicator */}
                  <div className="shrink-0">
                    <motion.div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? '#10B981' : isHovered ? '#CBD5E1' : '#E2E8F0',
                        background: isSelected ? '#10B981' : 'transparent',
                      }}
                      animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isSelected && (
                        <motion.svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

/* === Main QuestionInput === */
export function QuestionInput({ type, placeholder, options, onSubmit, disabled, stepNumber }: QuestionInputProps) {
  if (type === 'select' && options) {
    return <SelectInput options={options} onSubmit={onSubmit} disabled={disabled} />
  }

  return <TextareaInput placeholder={placeholder} onSubmit={onSubmit} disabled={disabled} />
}
