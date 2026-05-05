import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ParadoxStats } from '@/components/paradox-stats'
import { ImpactStats } from '@/components/impact-stats'
import {
  Brain, Target, Users, TrendingUp, Shield,
  ArrowRight, CheckCircle, Zap, Sparkles,
  FileText, BarChart3, MessageSquare, AlertTriangle,
  Building2, TrendingDown, Star, Quote
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI-driven CV-analys',
    description: 'Claude AI läser ditt CV och extraherar kompetenser, erfarenhet och utbildning automatiskt.',
    color: 'from-blue-500/20 to-indigo-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Target,
    title: 'Precisionsmatchning',
    description: 'Varje matchning får ett poäng 0–100 med förklaring av varför du passar för jobbet.',
    color: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-500',
  },
  {
    icon: TrendingUp,
    title: 'Kompetensgap-analys',
    description: 'Se exakt vilka kompetenser du saknar för drömjobbet och hur du kan fylla gapen.',
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: Users,
    title: 'Smart rekrytering',
    description: 'Rekryterare hittar rätt kandidater på minuter, inte månader – med AI-ranking.',
    color: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-500',
  },
  {
    icon: MessageSquare,
    title: 'Intervjuförberedelse',
    description: 'Få AI-genererade intervjufrågor baserade på jobbet och din profil.',
    color: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Shield,
    title: 'GDPR-säkert',
    description: 'Dina data lagras säkert i Sverige och behandlas strikt enligt GDPR.',
    color: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-orange-500',
  },
]

const logos = [
  'Spotify', 'Klarna', 'King', 'Voi', 'Epidemic Sound',
  'Northvolt', 'Einride', 'Bambuser', 'Kry', 'AFRY',
]

const testimonials = [
  {
    quote: 'Jag fick jobb inom 3 veckor. Kompetensgap-analysen visade exakt vad jag behövde lära mig.',
    name: 'Sara Lindqvist',
    role: 'Frontend-utvecklare',
    company: 'Hittat via MatchConnect',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    quote: 'Vi halverade vår time-to-hire från 4 månader till 6 veckor. AI-rankingen är helt träffsäker.',
    name: 'Marcus Holm',
    role: 'Head of Talent',
    company: 'Tech-startup, Stockholm',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    quote: 'Äntligen en plattform som förstår vad jag faktiskt kan, inte bara vad som står på mitt CV.',
    name: 'Amina Osei',
    role: 'Data Scientist',
    company: 'Rekryterad till Fintech-bolag',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
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
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 hero-mesh" />
        <div className="absolute inset-0 -z-20 dot-grid opacity-40" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/8 blur-3xl -z-10 pointer-events-none" />

        <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-xs font-medium border border-primary/20 bg-primary/5 text-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="h-3 w-3" />
          AI-driven rekrytering · Byggt för den svenska arbetsmarknaden
        </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl leading-[1.05] animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
          Rätt jobb.{' '}
          <span className="gradient-text">Rätt person.</span>
          {' '}Varje gång.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
          Sverige har ett unikt problem: tusentals akademiker utan jobb — samtidigt som
          180 000 tjänster inte kan tillsättas. Det är inte ett kompetensproblem.
          Det är ett <strong className="text-foreground">matchningsproblem</strong>. Vi löser det.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
          {['Gratis att börja', 'Inget kreditkort krävs', 'GDPR-säkert'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              {item}
            </span>
          ))}
        </div>

        {/* Floating avatars */}
        <div className="mt-10 flex items-center gap-3 animate-in fade-in duration-700 delay-400">
          <div className="flex -space-x-2.5">
            {[
              'https://randomuser.me/api/portraits/women/44.jpg',
              'https://randomuser.me/api/portraits/men/32.jpg',
              'https://randomuser.me/api/portraits/women/68.jpg',
              'https://randomuser.me/api/portraits/men/75.jpg',
              'https://randomuser.me/api/portraits/women/12.jpg',
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-background"
                style={{ zIndex: 5 - i }}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">2 400+</span> jobbsökare och rekryterare har redan gått med
          </div>
        </div>

        {/* Mock browser */}
        <div className="mt-10 w-full max-w-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 float-animation">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 blur-sm" />
          <div className="relative rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="border-b border-border/60 px-5 py-3 flex items-center gap-2 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md bg-muted/60 flex items-center px-3">
                <span className="text-xs text-muted-foreground">matchconnect.se/seeker/jobs</span>
              </div>
            </div>
            <div className="p-5 grid sm:grid-cols-3 gap-3">
              {[
                { role: 'Senior React Developer', co: 'Spotify AB', score: 94, color: 'text-emerald-500', bar: 'bg-emerald-500' },
                { role: 'Frontend Engineer', co: 'Klarna', score: 87, color: 'text-blue-500', bar: 'bg-blue-500' },
                { role: 'UI/UX Developer', co: 'IKEA Digital', score: 79, color: 'text-violet-500', bar: 'bg-violet-500' },
              ].map((job) => (
                <div key={job.role} className="rounded-xl border border-border/60 bg-background/70 p-4 text-left hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <span className={`text-lg font-bold ${job.color}`}>{job.score}%</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{job.role}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">{job.co}</p>
                  <div className="h-1 rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full ${job.bar}`} style={{ width: `${job.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section className="py-10 px-6 border-b border-border/40">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-7">
            Kandidater matchade till Sveriges ledande bolag
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {logos.map((logo) => (
              <span key={logo} className="text-sm font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors tracking-wide">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticker tape ── */}
      <div className="border-y border-border/50 bg-muted/30 py-3 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="ticker-track text-xs font-medium text-muted-foreground select-none">
          {[
            { label: 'Kompetensbrist', value: '74%', up: true },
            { label: 'Akademikerarbetslöshet', value: '8,2%', up: true },
            { label: 'Obemannade tjänster', value: '180 000', up: true },
            { label: 'Förlorad produktion', value: '45 mdr SEK', up: true },
            { label: 'Rekryteringstid', value: '6,2 mån', up: true },
            { label: 'Misslyckade rekryteringar', value: '42%', up: true },
            { label: 'Matchning med AI', value: '2× snabbare', up: false },
            { label: 'Time-to-hire', value: '−60%', up: false },
            { label: 'Rekryterar-nöjdhet', value: '87%', up: false },
            // Duplicate for seamless loop
            { label: 'Kompetensbrist', value: '74%', up: true },
            { label: 'Akademikerarbetslöshet', value: '8,2%', up: true },
            { label: 'Obemannade tjänster', value: '180 000', up: true },
            { label: 'Förlorad produktion', value: '45 mdr SEK', up: true },
            { label: 'Rekryteringstid', value: '6,2 mån', up: true },
            { label: 'Misslyckade rekryteringar', value: '42%', up: true },
            { label: 'Matchning med AI', value: '2× snabbare', up: false },
            { label: 'Time-to-hire', value: '−60%', up: false },
            { label: 'Rekryterar-nöjdhet', value: '87%', up: false },
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
          <div className="mb-12">
            <ParadoxStats />
          </div>

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
                  '180 000+ akademiker söker arbete aktivt',
                  'Genomsnittlig jobbsökarperiod: 9,4 månader',
                  '68% får aldrig feedback på sina ansökningar',
                  '31% jobbar utanför sitt utbildningsområde',
                  'ATS-system avfärdar rätt kandidater automatiskt',
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
                  '74% kan inte hitta rätt kompetens',
                  'Genomsnittlig rekryteringstid: 6,2 månader',
                  '42% av rekryteringar misslyckas inom 18 månader',
                  '45 miljarder SEK förloras i produktion per år',
                  'Sverige är nr 4 mest missmatchat i EU (OECD)',
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
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">Funktioner</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Allt du behöver för smart matchning</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Från CV-analys till intervjuförberedelse — MatchConnect guidar dig hela vägen.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className={`group relative rounded-2xl border border-border/50 bg-gradient-to-br ${f.color} p-6 card-hover shimmer`}>
                <div className="h-11 w-11 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center mb-5 shadow-sm">
                  <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">Vad användarna säger</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Riktiga resultat, riktiga människor</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="relative rounded-2xl border border-border/60 bg-card p-6 shimmer flex flex-col gap-4">
                <Quote className="h-6 w-6 text-primary/30 absolute top-5 right-5" />
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20"
                  />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                    <p className="text-xs text-primary/70">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For seekers / recruiters ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 p-10 relative overflow-hidden">
            <img
              src="https://randomuser.me/api/portraits/women/55.jpg"
              alt=""
              className="absolute top-6 right-6 h-14 w-14 rounded-2xl object-cover opacity-80 ring-2 ring-primary/20"
            />
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-6 shadow-md shadow-primary/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">För jobbsökare</h3>
            <p className="text-muted-foreground mb-6">Ladda upp ditt CV och få omedelbar AI-analys. Se hur väl du matchar varje jobb och exakt vad du behöver förbättra.</p>
            <ul className="space-y-2.5 mb-8">
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

          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/5 to-purple-500/10 p-10 relative overflow-hidden">
            <img
              src="https://randomuser.me/api/portraits/men/41.jpg"
              alt=""
              className="absolute top-6 right-6 h-14 w-14 rounded-2xl object-cover opacity-80 ring-2 ring-violet-500/20"
            />
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-md shadow-violet-500/20">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">För rekryterare</h3>
            <p className="text-muted-foreground mb-6">Sluta gissa. Få en AI-rankad lista av kandidater med matchningspoäng, kompetensgap och personliga sammanfattningar.</p>
            <ul className="space-y-2.5 mb-8">
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
      </section>

      {/* ── Impact numbers ── */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-10">
            Resultat från vår pilotomgång — Q1 2026
          </p>
          <ImpactStats />
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
