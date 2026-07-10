import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ParadoxStats } from '@/components/paradox-stats'
import { DemoMatcher } from '@/components/demo-matcher'
import { ScrollReveal } from '@/components/scroll-reveal'
import { AnimatedHeroWidget } from '@/components/animated-hero-widget'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Target, Users, TrendingUp, Shield,
  ArrowRight, CheckCircle, Zap, Sparkles,
  FileText, BarChart3, MessageSquare, AlertTriangle,
  Building2, TrendingDown
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI-driven CV-analys',
    description: 'Claude AI läser ditt CV och extraherar kompetenser, erfarenhet och utbildning automatiskt.',
    gradient: 'from-blue-500/25 to-indigo-500/15',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-500',
    glow: 'hover:shadow-blue-500/15',
  },
  {
    icon: Target,
    title: 'Precisionsmatchning',
    description: 'Varje matchning får ett poäng 0–100 med förklaring av varför du passar för jobbet.',
    gradient: 'from-violet-500/25 to-purple-500/15',
    border: 'border-violet-500/20 hover:border-violet-500/50',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-500',
    glow: 'hover:shadow-violet-500/15',
  },
  {
    icon: TrendingUp,
    title: 'Kompetensgap-analys',
    description: 'Se exakt vilka kompetenser du saknar för drömjobbet och hur du kan fylla gapen.',
    gradient: 'from-purple-500/25 to-pink-500/15',
    border: 'border-purple-500/20 hover:border-purple-500/50',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-500',
    glow: 'hover:shadow-purple-500/15',
  },
  {
    icon: Users,
    title: 'Smart rekrytering',
    description: 'Rekryterare hittar rätt kandidater på minuter, inte månader – med AI-ranking.',
    gradient: 'from-cyan-500/25 to-blue-500/15',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-500',
    glow: 'hover:shadow-cyan-500/15',
  },
  {
    icon: MessageSquare,
    title: 'Intervjuförberedelse',
    description: 'Få AI-genererade intervjufrågor baserade på jobbet och din profil.',
    gradient: 'from-emerald-500/25 to-teal-500/15',
    border: 'border-emerald-500/20 hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-500',
    glow: 'hover:shadow-emerald-500/15',
  },
  {
    icon: Shield,
    title: 'GDPR-säkert',
    description: 'Dina data lagras säkert inom EU (Irland) via Supabase och behandlas strikt enligt GDPR.',
    gradient: 'from-orange-500/25 to-amber-500/15',
    border: 'border-orange-500/20 hover:border-orange-500/50',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-500',
    glow: 'hover:shadow-orange-500/15',
  },
]


const steps = [
  { step: '01', title: 'Skapa konto', desc: 'Registrera dig gratis som jobbsökare eller rekryterare på under en minut.' },
  { step: '02', title: 'Ladda upp CV / skapa annons', desc: 'AI analyserar ditt CV eller din jobbannons och extraherar nyckelkompetenser.' },
  { step: '03', title: 'Få AI-matchning', desc: 'Se ditt matchningspoäng, kompetensgap och personaliserade intervjufrågor direkt.' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center px-6 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 hero-mesh" />
        <div className="absolute inset-0 -z-20 dot-grid opacity-40" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/8 blur-3xl -z-10 pointer-events-none" />

        <div className="mx-auto max-w-6xl w-full">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16 items-center">

            {/* Left: Text */}
            <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-xs font-medium border border-primary/20 bg-primary/5 text-primary">
                <Sparkles className="h-3 w-3" />
                AI-driven rekrytering · Alla branscher · Svenska arbetsmarknaden
              </Badge>

              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                Kompetensen finns.{' '}
                <span className="gradient-text">Matchningen</span>
                {' '}är trasig.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                <strong className="text-foreground">73% av svenska arbetsgivare</strong> hittar inte rätt kompetens — dubbelt så många som för tio år sedan.
                Samtidigt tjänar <strong className="text-foreground">var fjärde nyexaminerad akademiker</strong> under studiemedelsnivån månader efter sin examen.{' '}
                Det är inte ett kompetensproblem. Det är ett <strong className="text-foreground">matchningsproblem</strong> — och vi löser det med AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button size="lg" asChild className="text-base px-8 h-12 shadow-lg shadow-primary/30 glow-primary">
                  <Link href="/register">
                    Kom igång gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-8 h-12">
                  <Link href="#problemet">
                    Se problemet i siffror
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-8">
                {['Gratis att börja', 'Inget kreditkort krävs', 'GDPR-säkert'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                Kom igång som en av de första — helt gratis
              </div>
            </div>

            {/* Right: Image + product demo */}
            <div className="relative hidden lg:flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">

              {/* Office photo with floating stat cards */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 aspect-[16/9]">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=85"
                  alt="Team på modernt kontor"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/70" />

                {/* Floating: kompetensbrist */}
                <div className="absolute top-4 left-4 rounded-2xl border border-white/20 bg-background/90 backdrop-blur-md p-3 shadow-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Kompetensbrist</span>
                  </div>
                  <p className="text-2xl font-black text-red-500 leading-none">73%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">av svenska företag · ManpowerGroup 2026</p>
                </div>

                {/* Floating: nyexaminerade */}
                <div className="absolute top-4 right-4 rounded-2xl border border-white/20 bg-background/90 backdrop-blur-md p-3 shadow-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nyexaminerade</span>
                  </div>
                  <p className="text-2xl font-black text-amber-500 leading-none">1 av 4</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">under studiemedelsnivån · Saco 2025</p>
                </div>
              </div>

              {/* Animated product demo */}
              <AnimatedHeroWidget />

            </div>
          </div>
        </div>
      </section>


      {/* ── Ticker tape ── */}
      <div className="border-y border-border/50 bg-muted/30 py-3 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="ticker-track text-xs font-medium text-muted-foreground select-none">
          {[
            { label: 'Företag med kompetensbrist', value: '73%', up: true },
            { label: 'Nyexaminerade under studiemedelsnivån', value: '1 av 4', up: true },
            { label: 'Arbetsgivare med rekryteringssvårigheter', value: '49%', up: true },
            { label: 'Rekryteringar som misslyckas', value: '25%', up: true },
            { label: 'Företag drabbade negativt', value: '90%', up: true },
            { label: 'Expansioner som uteblir', value: '33%', up: true },
            { label: 'Nyexaminerade utan a-kassa', value: '7 av 8', up: true },
            { label: 'Ser inga resultat av arbetsmarknadspolitiken', value: '60%', up: true },
            { label: 'Kompetensbrist dubbelt mot för 10 år sedan', value: '2×', up: true },
            // Duplicate for seamless loop
            { label: 'Företag med kompetensbrist', value: '73%', up: true },
            { label: 'Nyexaminerade under studiemedelsnivån', value: '1 av 4', up: true },
            { label: 'Arbetsgivare med rekryteringssvårigheter', value: '49%', up: true },
            { label: 'Rekryteringar som misslyckas', value: '25%', up: true },
            { label: 'Företag drabbade negativt', value: '90%', up: true },
            { label: 'Expansioner som uteblir', value: '33%', up: true },
            { label: 'Nyexaminerade utan a-kassa', value: '7 av 8', up: true },
            { label: 'Ser inga resultat av arbetsmarknadspolitiken', value: '60%', up: true },
            { label: 'Kompetensbrist dubbelt mot för 10 år sedan', value: '2×', up: true },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap">
              <span className={`font-bold ${item.up ? 'text-red-500' : 'text-emerald-500'}`}>
                {item.up ? '▲' : '▼'} {item.value}
              </span>
              <span>{item.label}</span>
              <span className="opacity-30">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Paradoxen ── */}
      <section id="problemet" className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/25 -z-10" />
        <div className="absolute inset-0 dot-grid opacity-25 -z-10" />
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 border-red-500/30 text-red-500 bg-red-500/5">Kompetensparadoxen</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">En paradox som kostar Sverige miljarder</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Varför är tusentals akademiker arbetslösa medan företag desperat söker kompetens?
            </p>
          </div>

          {/* Animated ticker stats */}
          <ScrollReveal className="mb-12">
            <ParadoxStats />
          </ScrollReveal>

          {/* Two-column tension */}
          <div className="grid lg:grid-cols-2 gap-5 mb-10">
            <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/6 to-orange-500/6 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-red-600 dark:text-red-400">På jobbsökarsidan</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'Var fjärde nyexaminerad akademiker tjänar under studiemedelsnivån 4 månader efter examen',
                  'Bara 1 av 8 nyexaminerade uppfyller inkomstkravet för a-kassa',
                  'Nyexaminerade hamnar i ett ekonomiskt mellanrum — utan studiemedel och utan a-kassa',
                  '"Ett enormt slöseri när studenter inte lyckas komma i arbete" — Saco studentråd',
                  'Hög arbetslöshet bland akademiker trots att arbetsgivare skriker efter kompetens',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/6 to-yellow-500/6 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400">På arbetsgivarsidan</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  '49% av arbetsgivare upplevde rekryteringssvårigheter under senaste året',
                  '64% anger brist på rätt utbildning och kompetens som primärt rekryteringshinder',
                  '60% av arbetsplatsbeslutfattare ser inga resultat från arbetsmarknadspolitiken',
                  '67% av Unionens medlemmar har lågt förtroende för regeringens arbetsmarknadspolitik',
                  'Grundproblemet: matchning — de arbetslösas kompetens möter inte arbetsgivarnas krav',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Conclusion */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-6 text-center max-w-2xl mx-auto">
            <p className="text-base font-medium leading-relaxed">
              <span className="gradient-text font-bold">Slutsats:</span>{' '}
              Det finns tillräckligt med kompetens i Sverige. Systemet för att matcha den är trasigt.
              {' '}<strong className="text-foreground">MatchConnect löser det med AI.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">Hur det fungerar</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Tre steg till din nästa möjlighet</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent hidden sm:block" />
            <div className="space-y-6">
              {steps.map((s, i) => (
                <div key={s.step} className="flex gap-6 items-start group relative">
                  <div className="flex-shrink-0 h-16 w-16 rounded-2xl gradient-primary flex flex-col items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 group-hover:shadow-primary/40 transition-all duration-200 z-10">
                    <span className="text-white/60 text-[10px] font-bold leading-none">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-white font-bold text-sm leading-none mt-0.5">{s.title.split(' ')[0]}</span>
                  </div>
                  <div className="pt-3 flex-1">
                    <h3 className="text-lg font-semibold mb-1.5">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">Prova direkt</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold">Se AI-matchningen i realtid</h2>
              <p className="text-muted-foreground mt-3">
                Inga konton. Inga kortuppgifter. Lägg in ett jobb och dina kompetenser — få ett poäng på 10 sekunder.
              </p>
            </div>
            <DemoMatcher />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">Funktioner</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Allt du behöver för smart matchning</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Från CV-analys till intervjuförberedelse — MatchConnect guidar dig hela vägen.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className={`group relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.gradient} p-6 card-hover shimmer hover:shadow-xl ${f.glow} transition-all duration-300 h-full`}>
                  <div className={`h-11 w-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── For seekers / recruiters ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-5">
          {/* Jobbsökare */}
          <div className="rounded-2xl border border-border/60 overflow-hidden flex flex-col">
            <div className="relative h-52 overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=700&q=85"
                alt="Jobbsökare med laptop"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">För jobbsökare</h3>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 flex flex-col flex-1">
              <p className="text-muted-foreground mb-6">Ladda upp ditt CV och få omedelbar AI-analys. Se hur väl du matchar varje jobb och exakt vad du behöver förbättra.</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['AI analyserar ditt CV automatiskt', 'Se matchningspoäng per jobb', 'Identifiera kompetensgap', 'Förbered dig med AI-intervjufrågor'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full">
                <Link href="/register">Hitta ditt drömjobb <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          {/* Rekryterare */}
          <div className="rounded-2xl border border-border/60 overflow-hidden flex flex-col">
            <div className="relative h-52 overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=85"
                alt="Rekryterare i modernt kontor"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">För rekryterare</h3>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-violet-500/5 to-purple-500/10 flex flex-col flex-1">
              <p className="text-muted-foreground mb-6">Sluta gissa. Få en AI-rankad lista av kandidater med matchningspoäng, kompetensgap och personliga sammanfattningar.</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Publicera jobbannonser på minuter', 'AI rankar alla sökande 0–100', 'Se kandidatsammanfattningar direkt', 'Kommunicera via inbyggd chatt'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full border-violet-500/30 hover:bg-violet-500/10">
                <Link href="/register">Rekrytera smartare <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">Vanliga frågor</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Allt du behöver veta</h2>
            <p className="text-muted-foreground mt-3">Klicka på en fråga för att se svaret.</p>
          </div>
          <Accordion className="space-y-3">
            {[
              {
                id: 'faq-1',
                q: 'Kostar det något att använda MatchConnect?',
                a: 'Nej — plattformen är helt gratis för både jobbsökare och rekryterare. Inga dolda avgifter, inget kreditkort behövs.',
              },
              {
                id: 'faq-2',
                q: 'Hur fungerar AI-matchningen?',
                a: 'Claude AI (Anthropic) analyserar ditt CV och extraherar kompetenser, erfarenhetsnivå, utbildning och styrkor. Varje jobb får ett matchningspoäng 0–100. Du ser exakt vilka kompetenser som matchar, vad du saknar och konkreta rekommendationer — inte bara en siffra utan en fullständig analys.',
              },
              {
                id: 'faq-3',
                q: 'Är mina uppgifter säkra?',
                a: 'All data lagras inom EU (Irland) via Supabase och behandlas strikt enligt GDPR. Ditt CV analyseras av Claude AI (Anthropic) enbart för matchning — Anthropic lagrar inte din data och använder den inte för att träna AI-modeller.',
              },
              {
                id: 'faq-4',
                q: 'Kan rekryterare se mitt CV utan att jag sökt jobbet?',
                a: 'Nej. Rekryterare ser bara kandidater som aktivt sökt deras jobb — eller som finns i talangpoolen och valt att vara synliga.',
              },
              {
                id: 'faq-5',
                q: 'Hur laddar jag upp mitt CV?',
                a: 'Du laddar upp PDF eller DOCX direkt i din profil efter registrering. AI-analysen körs automatiskt och tar ungefär 30 sekunder.',
              },
              {
                id: 'faq-6',
                q: 'Fungerar det för alla typer av jobb?',
                a: 'Ja — plattformen är branschoberoende och fungerar för allt från teknik och ekonomi till vård och kreativa yrken.',
              },
            ].map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="rounded-xl border border-border/60 bg-background px-5 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/2 transition-colors"
              >
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-primary" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(1_0_0/15%),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_100%,oklch(0.60_0.25_295/30%),transparent)]" />
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative px-8 py-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm mb-5 mx-auto ring-1 ring-white/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                Redo att vara en del av lösningen?
              </h2>
              <p className="text-white/70 mb-8 text-base max-w-md mx-auto leading-relaxed">
                Gå med jobbsökare och rekryterare som väljer kompetens framför kontakter.
                Gratis att börja — inga kreditkort.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" asChild className="px-8 h-12 shadow-xl shadow-black/20">
                  <Link href="/register">
                    Kom igång gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" asChild className="px-8 h-12 text-white hover:text-white hover:bg-white/15 border border-white/20">
                  <Link href="/login">Logga in</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
