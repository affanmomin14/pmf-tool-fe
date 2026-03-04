import posthog from 'posthog-js'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

export function initPostHog() {
  if (typeof window === 'undefined' || initialized || !POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    persistence: 'localStorage',
  })
  initialized = true
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

export function identifyUser(email: string) {
  if (!POSTHOG_KEY) return
  const domain = email.split('@')[1]
  posthog.identify(email, { email_domain: domain })
}

export function resetUser() {
  if (!POSTHOG_KEY) return
  posthog.reset()
}
