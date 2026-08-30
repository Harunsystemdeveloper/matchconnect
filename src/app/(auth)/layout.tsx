import Link from 'next/link'
import { Briefcase, Brain, ClipboardCheck, ShieldCheck, Check } from 'lucide-react'

const RECRUITER_FEATURES = [
  { icon: Brain, text: 'AI rankar och motiverar varje kandidat på sekunder' },
  { icon: ClipboardCheck, text: 'Strukturerade intervjuutvärderingar — inte magkänsla' },
  { icon: ShieldCheck, text: 'Fairness-övervakning och full spårbarhet enligt EU AI Act' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          width: '420px',
          minWidth: '420px',
          background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #1e3a5f 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '40px',
        }}
      >
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '60px', right: '-60px',
          width: '260px', height: '260px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Briefcase size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>MatchConnect</span>
        </Link>

        {/* Main content */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto', paddingTop: '48px' }}>
          <p style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Framtidens rekrytering
          </p>
          <h2 style={{ color: 'white', fontSize: '34px', fontWeight: 800, lineHeight: 1.25, marginBottom: '20px' }}>
            Rätt person<br />till rätt jobb —<br />
            <span style={{ color: '#a5b4fc' }}>med AI-precision</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.7, maxWidth: '300px' }}>
            MatchConnect analyserar kompetenser och erfarenhet för att skapa perfekta matchningar på svenska arbetsmarknaden.
          </p>

          {/* Recruiter value props */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            {RECRUITER_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                }}>
                  <Icon size={13} color="#c7d2fe" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13.5px', lineHeight: 1.5, margin: 0, paddingTop: '3px' }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
            {[
              { value: '180 000', label: 'Tjänster utan kandidat' },
              { value: '74%', label: 'Av företagen har svårt att rekrytera' },
            ].map((s) => (
              <div key={s.value} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '12px',
                padding: '14px',
              }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '20px', margin: 0 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11.5px', marginTop: '4px', lineHeight: 1.4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
            {['GDPR-säkert', 'EU AI Act-spårbart', '100% gratis'].map(t => (
              <div key={t} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '999px', padding: '5px 10px',
              }}>
                <Check size={11} color="#86efac" />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: 'auto' }}>
          © {new Date().getFullYear()} MatchConnect · GDPR-säkert · Sverige
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #eef2ff 0%, #f8f7ff 50%, #f0f9ff 100%)',
      }}>
        {/* Mobile header */}
        <header className="lg:hidden" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div className="gradient-primary" style={{
              width: '34px', height: '34px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Briefcase size={16} color="white" />
            </div>
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: '18px' }}>MatchConnect</span>
          </Link>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
          {children}
        </main>

        <footer className="lg:hidden" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'rgba(100,116,139,0.7)' }}>
            © {new Date().getFullYear()} MatchConnect · GDPR-säkert · Sverige
          </p>
        </footer>
      </div>
    </div>
  )
}
