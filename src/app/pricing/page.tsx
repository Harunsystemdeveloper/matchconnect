import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CheckCircle, ArrowRight, Zap, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Priser – MatchConnect' }

const seekerFeatures = [
  'Ladda upp CV och få AI-analys direkt',
  'Se matchningspoäng 0–100 per jobb',
  'Kompetensgap-analys per jobbbannons',
  'AI-genererade intervjufrågor',
  'Ansök och följ dina ansökningar',
  'Spara intressanta jobb',
  'Direktmeddelanden med rekryterare',
]

const recruiterFeatures = [
  'Skapa och publicera jobbannonser',
  'AI-rankad kandidatlista per annons',
  'AI-sammanfattning per kandidat',
  'Talangpool med passiva kandidater',
  'Hantera ansökningsstatus',
  'Shortlist-funktion',
  'Direktmeddelanden med kandidater',
  'Analytics-dashboard',
]

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 text-center px-6">
        <Badge variant="secondary" className="mb-5 gap-1.5 px-4 py-1.5 text-xs border border-primary/20 bg-primary/5 text-primary">
          <Zap className="h-3 w-3" />
          Transparent prissättning
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Helt gratis —{' '}
          <span className="gradient-text">alltid</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          MatchConnect är gratis för både jobbsökare och rekryterare. Inga dolda avgifter, inget kreditkort.
        </p>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-6 pb-20 w-full">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Jobbsökare */}
          <div className="rounded-2xl border border-border/60 bg-card flex flex-col overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 px-7 py-6 border-b border-border/60">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">Jobbsökare</p>
                  <p className="text-2xl font-black gradient-text leading-none">0 kr</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Allt du behöver för att hitta och söka jobb med AI-stöd.</p>
            </div>
            <ul className="p-7 space-y-3 flex-1">
              {seekerFeatures.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="px-7 pb-7">
              <Button asChild className="w-full">
                <Link href="/register">Kom igång gratis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          {/* Rekryterare */}
          <div className="rounded-2xl border border-border/60 bg-card flex flex-col overflow-hidden">
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 px-7 py-6 border-b border-border/60">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">Rekryterare</p>
                  <p className="text-2xl font-black gradient-text leading-none">0 kr</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Hitta och ranka rätt kandidater med AI — utan bemanningsbyråns prislapp.</p>
            </div>
            <ul className="p-7 space-y-3 flex-1">
              {recruiterFeatures.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="px-7 pb-7">
              <Button asChild variant="outline" className="w-full border-violet-500/30 hover:bg-violet-500/10">
                <Link href="/register">Skapa rekryterar-konto <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Plattformen är i tidig fas. Vi tar inte betalt nu — och meddelar alltid i god tid om något förändras.
        </p>
      </section>

      <Footer />
    </div>
  )
}
