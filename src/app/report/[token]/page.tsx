'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { MotionConfig } from 'framer-motion'

import { getReport } from '@/lib/api'
import { Report } from '@/components/chat/Report'
import type { ReportData } from '@/lib/types'

export default function ReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const isPrint = searchParams.get('print') === 'true'

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    getReport(token)
      .then((result) => {
        if (result.isExpired) {
          setError('This report has expired.')
          return
        }
        setIsUnlocked(result.isUnlocked)
        if (result.report) {
          setReportData(result.report as unknown as ReportData)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-4">&#9888;&#65039;</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Report Unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion={isPrint ? 'always' : 'never'}>
      <div className={isPrint ? 'print-mode' : ''}>
        <Report
          isUnlocked={isUnlocked}
          reportData={reportData}
          reportToken={token}
          isPrint={isPrint}
        />
      </div>
    </MotionConfig>
  )
}
