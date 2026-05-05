import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cookies' }

export default function CookiesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-6">Cookiepolicy</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p className="text-muted-foreground">Senast uppdaterad: 2026-03-26</p>

          <h2 className="text-xl font-semibold mt-8">Vilka cookies använder vi?</h2>

          <h3 className="text-lg font-medium mt-6">Nödvändiga cookies</h3>
          <p>
            Dessa cookies är nödvändiga för att plattformen ska fungera. De hanterar
            autentisering och sessionshantering via Supabase.
          </p>

          <h3 className="text-lg font-medium mt-6">Tema-preferenser</h3>
          <p>
            Vi sparar din preferens för mörkt/ljust läge lokalt i din webbläsare.
          </p>

          <h2 className="text-xl font-semibold mt-8">Tredjepartscookies</h2>
          <p>
            Vi använder inga tredjepartscookies för spårning eller annonsering.
          </p>

          <h2 className="text-xl font-semibold mt-8">Kontakt</h2>
          <p>
            Frågor om cookies? Kontakta oss på privacy@matchconnect.se.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
