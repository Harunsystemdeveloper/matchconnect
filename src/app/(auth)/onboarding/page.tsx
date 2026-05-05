import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Konfigurera din profil · MatchConnect' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.onboarding_complete) redirect('/dashboard')

  const isRecruiter = profile.user_type === 'recruiter'

  return (
    <div style={{ width: '100%', maxWidth: '500px' }}>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', right: '60px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div style={{
            fontSize: '36px', lineHeight: 1,
            width: '60px', height: '60px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            {isRecruiter ? '🏢' : '🚀'}
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Välkommen till MatchConnect
            </p>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {isRecruiter ? 'Börja hitta rätt kandidater' : 'Börja hitta ditt drömjobb'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: '6px 0 0' }}>
              3 snabba steg · Tar bara 2 minuter
            </p>
          </div>
        </div>

        {/* Progress hint */}
        <div style={{
          display: 'flex', gap: '6px', marginTop: '20px', position: 'relative',
        }}>
          {['Grundinfo', isRecruiter ? 'Företag' : 'Kompetenser', 'Profilbild'].map((label, i) => (
            <div key={label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <div style={{
                height: '3px', borderRadius: '99px',
                background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <OnboardingWizard profile={profile} />
    </div>
  )
}
