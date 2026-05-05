'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notification {
  id: string
  message: string
  href: string
  read: boolean
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'väntar på granskning',
  reviewed: 'har granskats',
  shortlisted: 'har shortlistats',
  accepted: 'har accepterats',
  rejected: 'har avslagits',
}

export function NotificationsBell({ userId, userType = 'job_seeker' }: { userId: string; userType?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createClient()

  async function loadNotifications() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    if (userType === 'recruiter') {
      // Recruiter: new applications to their jobs
      const { data: newApps } = await supabase
        .from('applications')
        .select('id, status, created_at, job:jobs!inner(id, title, recruiter_id), seeker:profiles(full_name)')
        .eq('jobs.recruiter_id', userId)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10)

      const recruiterNotifs: Notification[] = (newApps ?? []).map(a => {
        const job = a.job as unknown as { id: string; title: string } | null
        const seeker = a.seeker as unknown as { full_name: string | null } | null
        return {
          id: `newapp-${a.id}`,
          message: `${seeker?.full_name ?? 'Ny sökande'} sökte "${job?.title ?? 'ett jobb'}"`,
          href: job ? `/recruiter/jobs/${job.id}/candidates` : '/recruiter/jobs',
          read: false,
          created_at: a.created_at,
        }
      })
      setNotifications(recruiterNotifs)
      return
    }

    // Seeker: application status updates + new matching jobs
    const { data: apps } = await supabase
      .from('applications')
      .select('id, status, updated_at, job:jobs(title)')
      .eq('seeker_id', userId)
      .gte('updated_at', sevenDaysAgo)
      .order('updated_at', { ascending: false })
      .limit(8)

    const appNotifications: Notification[] = (apps ?? []).map(a => {
      const job = a.job as unknown as { title: string } | null
      return {
        id: `app-${a.id}`,
        message: `Din ansökan till "${job?.title ?? 'okänt jobb'}" ${STATUS_LABELS[a.status] ?? 'uppdaterades'}.`,
        href: '/seeker/applications',
        read: false,
        created_at: a.updated_at,
      }
    })

    const { data: cv } = await supabase
      .from('cv_profiles')
      .select('skills')
      .eq('seeker_id', userId)
      .single()

    let jobNotifications: Notification[] = []
    if (cv?.skills?.length) {
      const { data: newJobs } = await supabase
        .from('jobs')
        .select('id, title, created_at')
        .eq('status', 'active')
        .gte('created_at', sevenDaysAgo)
        .overlaps('skills_required', cv.skills)
        .limit(3)

      jobNotifications = (newJobs ?? []).map(j => ({
        id: `job-${j.id}`,
        message: `Nytt jobb matchar din profil: "${j.title}"`,
        href: `/seeker/jobs/${j.id}`,
        read: false,
        created_at: j.created_at,
      }))
    }

    const all = [...appNotifications, ...jobNotifications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    setNotifications(all)
  }

  useEffect(() => {
    loadNotifications()

    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications', filter: `seeker_id=eq.${userId}` },
        (payload) => {
          if (userType !== 'job_seeker') return
          const newStatus = (payload.new as { status: string; id: string }).status
          const appId = (payload.new as { id: string }).id
          const key = `app-${appId}`
          setNotifications(prev => {
            const exists = prev.find(n => n.id === key)
            const msg = `Din ansökan ${STATUS_LABELS[newStatus] ?? 'uppdaterades'}.`
            if (exists) return prev.map(n => n.id === key ? { ...n, message: msg, read: false } : n)
            return [{ id: key, message: msg, href: '/seeker/applications', read: false, created_at: new Date().toISOString() }, ...prev].slice(0, 10)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'applications' },
        () => { loadNotifications() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const unread = notifications.filter(n => !n.read).length

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors focus:outline-none"
            aria-label="Notiser"
          />
        }
        onClick={markAllRead}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="font-semibold">Notiser</span>
            {unread > 0 && (
              <span className="ml-2 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                {unread}
              </span>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Inga notiser ännu
          </div>
        ) : (
          <DropdownMenuGroup>
            {notifications.map(n => (
              <DropdownMenuItem key={n.id} render={<Link href={n.href} />}>
                <div className="flex flex-col gap-0.5 py-1">
                  <p className={`text-sm leading-snug ${n.read ? 'text-muted-foreground' : 'font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
