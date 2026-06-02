import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MatchConnect – AI-driven jobbmatchning'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px',
          background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a3e 50%, #0f1a2e 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(109,40,217,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow blob */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.4) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: '64px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            💼
          </div>
          <span style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>
            MatchConnect
          </span>
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(109,40,217,0.25)',
            border: '1px solid rgba(109,40,217,0.5)',
            borderRadius: '100px',
            padding: '8px 18px',
            marginBottom: '24px',
          }}
        >
          <span style={{ color: '#a78bfa', fontSize: '14px', fontWeight: '600', letterSpacing: '0.08em' }}>
            AI-DRIVEN REKRYTERING
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '32px' }}>
          <span style={{ color: '#fff', fontSize: '64px', fontWeight: '800', lineHeight: 1.05 }}>
            Kompetensen finns.
          </span>
          <span
            style={{
              fontSize: '64px',
              fontWeight: '800',
              lineHeight: 1.05,
              background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Matchningen är trasig.
          </span>
        </div>

        {/* Subtext */}
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '22px', maxWidth: '700px', lineHeight: 1.5 }}>
          Vi löser det med AI — helt gratis för jobbsökare och rekryterare.
        </span>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
          {[
            { value: '73%', label: 'av företag hittar inte rätt' },
            { value: '0 kr', label: 'att komma igång' },
            { value: 'AI', label: 'matchning 0–100' },
          ].map((s) => (
            <div
              key={s.value}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                padding: '14px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '800' }}>{s.value}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
