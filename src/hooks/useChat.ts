'use client'

import { useState, useCallback, useRef } from 'react'

import type { ChatMessage, ChatStep, UserResponse } from '@/lib/types'
import { CATEGORIES, QUESTIONS, MICRO_INSIGHTS } from '@/lib/constants'

const TYPING_DELAY = 1200
const INSIGHT_DELAY = 3000

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function getRandomInsight(step: number): string {
  const insights = MICRO_INSIGHTS[String(step)]
  if (!insights) return 'Processing your response...'
  return insights[Math.floor(Math.random() * insights.length)]
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentStep, setCurrentStep] = useState<ChatStep>('landing')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [emailUnlocked, setEmailUnlocked] = useState(false)
  const sessionIdRef = useRef<string>(generateId())

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }, [])

  const simulateTyping = useCallback(async (delay: number = TYPING_DELAY) => {
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, delay))
    setIsTyping(false)
  }, [])

  const startChat = useCallback(async () => {
    setCurrentStep('category-select')

    await simulateTyping(800)

    addMessage({
      role: 'bot',
      content:
        "Hi, I'm your PMF diagnostic assistant. I'll help you identify where you stand on your product-market fit journey in under 3 minutes.",
      type: 'text',
    })

    await simulateTyping(600)

    addMessage({
      role: 'bot',
      content: 'What is the primary challenge you are facing right now?',
      type: 'categories',
      options: CATEGORIES,
    })
  }, [addMessage, simulateTyping])

  const selectCategory = useCallback(
    async (categoryId: string) => {
      const category = CATEGORIES.find(c => c.id === categoryId)
      if (!category) return

      setSelectedCategory(categoryId)

      addMessage({
        role: 'user',
        content: `${category.icon} ${category.title}`,
        type: 'text',
      })

      await simulateTyping()

      addMessage({
        role: 'bot',
        content: `Great choice. ${category.title} is one of the most critical PMF dimensions. Let me ask you 5 focused questions to diagnose your situation.`,
        type: 'text',
      })

      await simulateTyping(800)

      setCurrentStep('questions')
      setQuestionIndex(0)

      const firstQuestion = QUESTIONS[0]
      addMessage({
        role: 'bot',
        content: firstQuestion.question,
        type: 'question',
        options: firstQuestion.options,
      })
    },
    [addMessage, simulateTyping],
  )

  const answerQuestion = useCallback(
    async (answer: string) => {
      const currentQuestion = QUESTIONS[questionIndex]
      if (!currentQuestion) return

      addMessage({
        role: 'user',
        content: answer,
        type: 'text',
      })

      const newResponse: UserResponse = {
        step: currentQuestion.step,
        question: currentQuestion.question,
        answer,
      }
      setResponses(prev => [...prev, newResponse])

      await simulateTyping()

      const insight = getRandomInsight(currentQuestion.step)
      addMessage({
        role: 'bot',
        content: insight,
        type: 'insight',
      })

      const nextIndex = questionIndex + 1

      if (nextIndex < QUESTIONS.length) {
        await simulateTyping(INSIGHT_DELAY)

        setQuestionIndex(nextIndex)
        const nextQuestion = QUESTIONS[nextIndex]
        addMessage({
          role: 'bot',
          content: nextQuestion.question,
          type: 'question',
          options: nextQuestion.options,
        })
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000))

        addMessage({
          role: 'bot',
          content: 'Excellent. I have everything I need. Let me analyze your responses now.',
          type: 'text',
        })

        setCurrentStep('analysis')
      }
    },
    [addMessage, questionIndex, simulateTyping],
  )

  const completeAnalysis = useCallback(() => {
    setCurrentStep('preview')
    addMessage({
      role: 'bot',
      content: 'Analysis complete. Here are your top signals:',
      type: 'preview',
    })
  }, [addMessage])

  const showEmailGate = useCallback(() => {
    setCurrentStep('email-gate')
    addMessage({
      role: 'bot',
      content:
        "I've generated your 9-section PMF report. Enter your email to unlock the full analysis and PDF download.",
      type: 'email-gate',
    })
  }, [addMessage])

  const submitEmail = useCallback(
    async (email: string) => {
      addMessage({
        role: 'user',
        content: email,
        type: 'text',
      })

      await simulateTyping(800)

      setEmailUnlocked(true)
      setCurrentStep('report')

      addMessage({
        role: 'bot',
        content: 'Your full PMF Insights Report is ready. Scroll down to explore all 9 sections.',
        type: 'report',
      })
    },
    [addMessage, simulateTyping],
  )

  return {
    messages,
    currentStep,
    questionIndex,
    responses,
    isTyping,
    selectedCategory,
    emailUnlocked,
    sessionIdRef,
    startChat,
    selectCategory,
    answerQuestion,
    completeAnalysis,
    showEmailGate,
    submitEmail,
  }
}
