import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://matchconnect.se'),
  title: {
    default: 'MatchConnect – AI-driven jobbmatchning',
    template: '%s | MatchConnect',
  },
  description:
    'AI-driven plattform som matchar rätt kandidater med rätt jobb på den svenska arbetsmarknaden.',
  keywords: ['jobbmatchning', 'AI', 'rekrytering', 'karriär', 'Sverige'],
  openGraph: {
    title: 'MatchConnect – AI-driven jobbmatchning',
    description: 'Hitta rätt jobb eller rätt kandidat med hjälp av AI.',
    locale: 'sv_SE',
    type: 'website',
    url: 'https://matchconnect.se',
    siteName: 'MatchConnect',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MatchConnect – AI-driven jobbmatchning',
    description: 'Hitta rätt jobb eller rätt kandidat med hjälp av AI.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
