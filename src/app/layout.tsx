import type { Metadata } from 'next'
import Script from 'next/script'

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
      <head>
        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "w0my8qz8zg");`}
        </Script>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LJG7BRWSES"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-LJG7BRWSES');`}
        </Script>
      </head>
      <body>
        <PostHogInit />
        {children}
      </body>
    </html>
  )
}
