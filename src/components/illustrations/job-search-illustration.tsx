/**
 * Handbyggd, varumärkesanpassad illustration (inga externa bildfiler/nätverksanrop) —
 * abstrakta figurer som symboliserar jobbsökande: en person vid en "tavla" med jobbkort,
 * en förstoringsglas-sökning, och en kandidat med ett CV. Följer temats färgtokens
 * (fill-primary/fill-secondary-ish via CSS-variabler) så den anpassar sig till dark/light.
 */
export function JobSearchIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Illustration av jobbsökande">
      {/* Bakgrundsblobbar */}
      <circle cx="90" cy="70" r="70" className="fill-primary/10" />
      <circle cx="410" cy="250" r="90" className="fill-primary/10" />

      {/* "Tavla" med jobbkort */}
      <rect x="150" y="40" width="200" height="150" rx="14" className="fill-card stroke-border" strokeWidth="2" />
      <rect x="170" y="62" width="60" height="10" rx="5" className="fill-primary" />
      <rect x="170" y="84" width="160" height="26" rx="8" className="fill-muted" />
      <rect x="182" y="93" width="70" height="8" rx="4" className="fill-primary/60" />
      <rect x="170" y="118" width="160" height="26" rx="8" className="fill-muted" />
      <rect x="182" y="127" width="90" height="8" rx="4" className="fill-primary/60" />
      <rect x="170" y="152" width="160" height="26" rx="8" className="fill-primary/15" />
      <rect x="182" y="161" width="55" height="8" rx="4" className="fill-primary" />

      {/* Person 1 — sitter och tittar på tavlan (vänster) */}
      <g>
        <ellipse cx="95" cy="272" rx="46" ry="10" className="fill-primary/10" />
        <rect x="70" y="200" width="50" height="66" rx="18" className="fill-primary" />
        <circle cx="95" cy="178" r="22" className="fill-primary" />
        <rect x="60" y="222" width="18" height="46" rx="9" className="fill-primary/70" />
      </g>

      {/* Person 2 — står med ett CV (höger) */}
      <g>
        <ellipse cx="390" cy="290" rx="52" ry="11" className="fill-primary/10" />
        <rect x="362" y="200" width="56" height="80" rx="20" className="fill-foreground/80 dark:fill-foreground/70" />
        <circle cx="390" cy="176" r="24" className="fill-foreground/80 dark:fill-foreground/70" />
        {/* CV i handen */}
        <rect x="410" y="210" width="34" height="44" rx="4" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="416" y="218" width="22" height="4" rx="2" className="fill-primary" />
        <rect x="416" y="226" width="22" height="3" rx="1.5" className="fill-muted-foreground/40" />
        <rect x="416" y="232" width="16" height="3" rx="1.5" className="fill-muted-foreground/40" />
        <rect x="416" y="240" width="22" height="3" rx="1.5" className="fill-muted-foreground/40" />
      </g>

      {/* Förstoringsglas — symboliserar "sök" */}
      <g transform="translate(255, 205)">
        <circle cx="0" cy="0" r="26" className="fill-card stroke-primary" strokeWidth="5" />
        <line x1="19" y1="19" x2="38" y2="38" className="stroke-primary" strokeWidth="6" strokeLinecap="round" />
        <path d="M -10 0 A 10 10 0 0 1 0 -10" className="stroke-primary/50" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Flytande checkmarks / prickar */}
      <circle cx="335" cy="30" r="6" className="fill-primary/40" />
      <circle cx="55" cy="140" r="5" className="fill-primary/30" />
      <path d="M 358 200 l 6 6 l 10 -12" className="stroke-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
