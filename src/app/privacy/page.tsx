import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Integritetspolicy' }

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-6">Integritetspolicy</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p className="text-muted-foreground">Senast uppdaterad: 2026-06-03</p>

          <h2 className="text-xl font-semibold mt-8">1. Vilka vi är</h2>
          <p>
            MatchConnect är en AI-driven jobbmatchningsplattform som hjälper jobbsökare
            och rekryterare att hitta varandra. Vi tar din integritet på allvar.
          </p>

          <h2 className="text-xl font-semibold mt-8">2. Vilka uppgifter vi samlar in</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Kontouppgifter: e-post, namn, profilbild</li>
            <li>CV-data: kompetenser, erfarenhet, utbildning (frivilligt uppladdad)</li>
            <li>Jobbannonser och ansökningsstatus</li>
            <li>Meddelanden mellan användare</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">3. Datalagring</h2>
          <p>
            All data lagras inom EU (Irland) via Supabase och behandlas i enlighet med GDPR.
            Supabase är certifierat enligt SOC 2 Type II och uppfyller EU:s krav på databehandling.
          </p>

          <h2 className="text-xl font-semibold mt-8">4. Hur vi använder AI</h2>
          <p>
            Vi använder Claude AI (Anthropic) för att analysera CV:n, beräkna matchningspoäng
            och generera intervjufrågor. Ditt CV och dina uppgifter skickas till Anthropics API
            enbart för att utföra dessa tjänster — Anthropic lagrar inte din data och använder
            den inte för att träna AI-modeller. Detta framgår av{' '}
            <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Anthropics integritetspolicy
            </a>.
          </p>

          <h2 className="text-xl font-semibold mt-8">5. GDPR</h2>
          <p>
            Vi följer EU:s dataskyddsförordning (GDPR). Du har rätt att:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Få tillgång till dina uppgifter</li>
            <li>Radera ditt konto och all data</li>
            <li>Exportera dina uppgifter</li>
            <li>Invända mot viss databehandling</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">6. Kontakt</h2>
          <p>
            Vid frågor om din integritet, kontakta oss på privacy@matchconnect.se.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
