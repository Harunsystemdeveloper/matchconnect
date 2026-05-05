import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20 mt-auto">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-base w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-sm">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="gradient-text text-lg">MatchConnect</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-driven jobbmatchning som kopplar rätt kompetens med rätt möjlighet på den svenska arbetsmarknaden.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Plattformen</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">Om oss</Link></li>
              <li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Kom igång</Link></li>
              <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Logga in</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Juridiskt</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Integritetspolicy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Användarvillkor</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MatchConnect. Alla rättigheter förbehållna.
          </p>
          <p className="text-xs text-muted-foreground">
            Byggd med <span className="gradient-text font-medium">AI</span> för den svenska arbetsmarknaden
          </p>
        </div>
      </div>
    </footer>
  )
}
