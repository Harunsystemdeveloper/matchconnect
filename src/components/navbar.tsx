'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Moon, Sun, Menu, Briefcase, User, LogOut, Settings, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { NotificationsBell } from '@/components/notifications-bell'
import type { Profile } from '@/types/database'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    loadProfile()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const seekerLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/seeker/jobs', label: 'Hitta jobb' },
    { href: '/seeker/applications', label: 'Ansökningar' },
    { href: '/seeker/saved', label: 'Sparade' },
    { href: '/messages', label: 'Meddelanden' },
  ]

  const recruiterLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/recruiter/jobs', label: 'Annonser' },
    { href: '/recruiter/talent-pool', label: 'Talangpool' },
    { href: '/recruiter/shortlist', label: 'Shortlist' },
    { href: '/recruiter/analytics', label: 'Analytics' },
    { href: '/messages', label: 'Meddelanden' },
  ]

  const isLoggedIn = !!profile
  const navLinks = profile?.user_type === 'recruiter' ? recruiterLinks : seekerLinks

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo — alltid länk till startsidan */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-sm shadow-primary/30">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text">MatchConnect</span>
          </Link>

          {/* Desktop nav */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-0.5">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                Hem
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Byt tema"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {isLoggedIn ? (
              <>
                {userId && profile && (
                  <NotificationsBell userId={userId} userType={profile.user_type} />
                )}

                {/* User dropdown — render prop API */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        className="relative h-9 w-9 rounded-full inline-flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none"
                        aria-label="Användarmeny"
                      />
                    }
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url ?? ''} alt={profile?.full_name ?? ''} />
                      <AvatarFallback className="gradient-primary text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <p className="font-semibold">{profile?.full_name ?? 'Användare'}</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          {profile?.user_type === 'recruiter' ? 'Rekryterare' : 'Jobbsökare'}
                        </p>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem render={<Link href="/" />}>
                        <Home className="mr-2 h-4 w-4" />
                        Startsida
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={<Link href={profile?.user_type === 'recruiter' ? '/recruiter/company' : '/seeker/profile'} />}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Min profil
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/settings" />}>
                        <Settings className="mr-2 h-4 w-4" />
                        Inställningar
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logga ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile hamburger — render prop API */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger
                    render={
                      <button
                        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors focus:outline-none"
                        aria-label="Meny"
                      />
                    }
                  >
                    <Menu className="h-5 w-5" />
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <div className="flex flex-col gap-1 mt-8">
                      <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                      >
                        <Home className="h-4 w-4" />
                        Startsida
                      </Link>
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            pathname === link.href ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="border-t mt-4 pt-4 space-y-1">
                        <Link
                          href={profile?.user_type === 'recruiter' ? '/recruiter/company' : '/seeker/profile'}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium hover:bg-accent"
                        >
                          <User className="h-4 w-4" />
                          Min profil
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium hover:bg-accent"
                        >
                          <Settings className="h-4 w-4" />
                          Inställningar
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-md text-sm text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Logga ut
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Logga in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Kom igång</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
