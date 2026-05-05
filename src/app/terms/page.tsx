import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Användarvillkor' }

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-6">Användarvillkor</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p className="text-muted-foreground">Senast uppdaterade: 2026-03-26</p>

          <h2 className="text-xl font-semibold mt-8">1. Tjänstebeskrivning</h2>
          <p>
            MatchConnect är en plattform för AI-driven jobbmatchning. Vi erbjuder tjänster
            för både jobbsökare och rekryterare.
          </p>

          <h2 className="text-xl font-semibold mt-8">2. Användarkonton</h2>
          <p>
            Du ansvarar för att hålla din kontoinformation uppdaterad och ditt lösenord säkert.
            Varje person får bara ha ett konto.
          </p>

          <h2 className="text-xl font-semibold mt-8">3. Användning av AI</h2>
          <p>
            AI-genererade matchningspoäng och rekommendationer är vägledande och inte
            garantier. Slutgiltiga rekryteringsbeslut fattas alltid av människor.
          </p>

          <h2 className="text-xl font-semibold mt-8">4. Innehåll</h2>
          <p>
            Du ansvarar för att innehåll du laddar upp (CV, jobbannonser, meddelanden)
            är korrekt och inte bryter mot några lagar eller rättigheter.
          </p>

          <h2 className="text-xl font-semibold mt-8">5. Begränsning av ansvar</h2>
          <p>
            MatchConnect ansvarar inte för rekryteringsbeslut som fattas baserat på
            plattformens AI-analyser. Tjänsten tillhandahålls i befintligt skick.
          </p>

          <h2 className="text-xl font-semibold mt-8">6. Kontakt</h2>
          <p>
            Frågor om dessa villkor? Kontakta oss på legal@matchconnect.se.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
