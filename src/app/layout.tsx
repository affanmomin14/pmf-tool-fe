import type { Metadata } from 'next'

import './globals.css'
import { PostHogInit } from './PostHogInit'

export const metadata: Metadata = {
  title: 'PMF Insights | Validate Your Path to Product-Market Fit',
  description:
    'A free, AI-driven diagnostic for post-MVP founders to identify traction gaps and market risks in under 3 minutes.',
  openGraph: {
    title: 'PMF Insights | Validate Your Path to Product-Market Fit',
    description:
      'A free, AI-driven diagnostic for post-MVP founders to identify traction gaps and market risks in under 3 minutes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <PostHogInit />
        {children}
      </body>
    </html>
  )
}
