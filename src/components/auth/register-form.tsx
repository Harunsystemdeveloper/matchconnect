'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Briefcase, Search, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserType } from '@/types/database'

const schema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
  password: z.string().min(8, 'Lösenord måste vara minst 8 tecken'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [userType, setUserType] = useState<UserType>('job_seeker')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password, user_type: userType }),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error('Registrering misslyckades', { description: result.error })
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (loginError) {
      toast.error('Inloggning misslyckades', { description: loginError.message })
      setLoading(false)
      return
    }
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo + header */}
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
          <Briefcase className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Skapa konto</h1>
          <p className="text-sm text-muted-foreground mt-1">Kom igång med MatchConnect — helt gratis</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card shadow-lg shadow-black/5 p-8 space-y-5">

        {/* User type selector */}
        <div className="space-y-2">
          <Label>Jag är...</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'job_seeker' as UserType, icon: Search, label: 'Jobbsökare', sub: 'Hittar mitt drömjobb' },
              { type: 'recruiter' as UserType, icon: Briefcase, label: 'Rekryterare', sub: 'Hittar rätt kandidater' },
            ].map(({ type, icon: Icon, label, sub }) => {
              const active = userType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all outline-none cursor-pointer ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-primary/40'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${active ? 'gradient-primary' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-postadress</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input id="email" type="email" placeholder="du@exempel.se" className="h-11 pl-9" {...register('email')} />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Lösenord</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minst 8 tecken"
                className="h-11 pl-9 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="h-11 pl-9 pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? 'Dölj lösenord' : 'Visa lösenord'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground">
            Genom att registrera dig godkänner du våra{' '}
            <Link href="/terms" className="text-primary hover:underline">användarvillkor</Link>
            {' '}och{' '}
            <Link href="/privacy" className="text-primary hover:underline">integritetspolicy</Link>.
          </p>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 gradient-primary text-white font-semibold shadow-md shadow-primary/30"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Skapa konto gratis
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Redan konto?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Logga in
        </Link>
      </p>
    </div>
  )
}
