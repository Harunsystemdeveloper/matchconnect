import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, X, Zap, Building2, Rocket } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Priser – MatchConnect' }

const plans = [
  {
    name: 'Gratis',
    icon: Zap,
    price: '0',
    period: 'för alltid',
    description: 'Perfekt för att testa plattformen och göra din första anställning.',
    badge: null,
    cta: 'Kom igång gratis',
    href: '/register',
    features: [
      { text: '3 aktiva jobbannonser', included: true },
      { text: 'AI-matchning av kandidater', included: true },
      { text: 'Meddelandefunktion', included: true },
      { text: 'CSV-export av kandidater', included: true },
      { text: 'Talangpool (passiva kandidater)', included: false },
      { text: 'Kandidat-CRM (anteckningar)', included: false },
      { text: 'Analytics dashboard', included: false },
      { text: 'Intervjubokning', included: false },
      { text: 'Employer Branding-sida', included: false },
      { text: 'Prioriterad support', included: false },
    ],
  },
  {
    name: 'Pro',
    icon: Rocket,
    price: '1 990',
    period: 'per månad',
    description: 'För aktiva rekryteringsteam som vill automatisera hela processen.',
    badge: 'Populärast',
    cta: 'Starta Pro-period',
    href: '/register?plan=pro',
    features: [
      { text: 'Obegränsade jobbannonser', included: true },
      { text: 'AI-matchning av kandidater', included: true },
      { text: 'Meddelandefunktion', included: true },
      { text: 'CSV-export av kandidater', included: true },
      { text: 'Talangpool (passiva kandidater)', included: true },
      { text: 'Kandidat-CRM (anteckningar + taggar)', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Intervjubokning', included: true },
      { text: 'Employer Branding-sida', included: true },
      { text: 'Prioriterad support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: 'Kontakta oss',
    period: '',
    description: 'Skräddarsytt för stora organisationer med komplexa rekryteringsbehov.',
    badge: null,
    cta: 'Kontakta oss',
    href: '/about#contact',
    features: [
      { text: 'Allt i Pro', included: true },
      { text: 'Teamkonton (flera rekryterare)', included: true },
      { text: 'SSO / Active Directory', included: true },
      { text: 'API-åtkomst för integrationer', included: true },
      { text: 'Anpassade AI-prompts', included: true },
      { text: 'SLA-avtal', included: true },
      { text: 'Dedikerad account manager', included: true },
      { text: 'Onboarding & utbildning', included: true },
      { text: 'GDPR-biträdesavtal (DPA)', included: true },
      { text: 'Prioriterad support dygnet runt', included: true },
    ],
  },
]

const comparisons = [
  { item: 'Bemanningsföretag (Adecco, Manpower)', cost: '15–25% av årslön', note: 'Per lyckad anställning' },
  { item: 'Traditionellt ATS (Teamtailor, Recruitee)', cost: '3 000–8 000 kr/mån', note: 'Ingen AI-matchning' },
  { item: 'MatchConnect Pro', cost: '1 990 kr/mån', note: 'AI-matchning inkluderat' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 text-center px-4">
        <Badge variant="secondary" className="mb-4">Transparent prissättning</Badge>
        <h1 className="text-4xl font-bold mb-4">
          Rekrytera smartare.<br />
          <span className="gradient-text">Betala 90% mindre.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Bemanningsföretag tar 15–25% av kandidatens årslön. Vi tar en fast månadsavgift — oavsett hur många du anställer.
        </p>
      </section>

      {/* Plan cards */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map(plan => {
            const Icon = plan.icon
            const isPopular = plan.badge === 'Populärast'
            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-white px-3">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isPopular ? 'gradient-primary text-white' : 'bg-muted'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="mt-2">
                    {plan.price === 'Kontakta oss' ? (
                      <p className="text-2xl font-bold">Kontakta oss</p>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        {plan.price !== '0' && <span className="text-muted-foreground text-sm">kr</span>}
                        {plan.period && <span className="text-muted-foreground text-sm">/{plan.period}</span>}
                      </div>
                    )}
                    {plan.price === '0' && (
                      <p className="text-sm text-muted-foreground">för alltid</p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <Button
                    className={`w-full ${isPopular ? 'gradient-primary text-white hover:opacity-90' : ''}`}
                    variant={isPopular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                  <Separator />
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map(feature => (
                      <li key={feature.text} className="flex items-start gap-2">
                        {feature.included
                          ? <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          : <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                        }
                        <span className={`text-sm ${feature.included ? '' : 'text-muted-foreground/60'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Kostnadsjämförelse */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Varför MatchConnect slår bemanningsföretagen
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-0">
              {comparisons.map((row, i) => (
                <div
                  key={row.item}
                  className={`flex items-center justify-between py-4 ${i < comparisons.length - 1 ? 'border-b' : ''} ${i === comparisons.length - 1 ? 'bg-primary/5 -mx-6 px-6 rounded-b-lg' : ''}`}
                >
                  <div>
                    <p className={`font-medium text-sm ${i === comparisons.length - 1 ? 'text-primary' : ''}`}>
                      {row.item}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.note}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${i === comparisons.length - 1 ? 'text-primary text-lg' : 'text-destructive'}`}>
                      {row.cost}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-center">
                <strong>Exempel:</strong> En anställning på 450 000 kr/år kostar{' '}
                <span className="text-destructive font-bold">67 500–112 500 kr</span> via ett bemanningsföretag.
                Med MatchConnect Pro betalar du{' '}
                <span className="text-green-600 font-bold">23 880 kr/år</span> — oavsett hur många du anställer.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Vanliga frågor</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Kan jag avsluta när som helst?',
              a: 'Ja, du kan avsluta din prenumeration när som helst. Du behåller tillgång till Pro-funktioner till slutet av faktureringsperioden.',
            },
            {
              q: 'Finns det ett gratis provperiod för Pro?',
              a: 'Vi erbjuder en 14-dagars gratis provperiod för Pro. Inget kreditkort krävs för att börja.',
            },
            {
              q: 'Hur hanteras GDPR och personuppgifter?',
              a: 'Vi lagrar all data i Sverige via Supabase (EU). Användare kan exportera och radera sin data när som helst via inställningssidan.',
            },
            {
              q: 'Vad händer om jag överskrider 3 jobbannonser på gratisplanen?',
              a: 'Du kan alltid se befintliga annonser, men behöver uppgradera till Pro för att skapa fler.',
            },
          ].map(faq => (
            <div key={faq.q} className="rounded-lg border p-4">
              <p className="font-medium text-sm">{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-1.5">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
