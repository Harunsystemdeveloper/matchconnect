import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/components/messages/messages-client'
import { Navbar } from '@/components/navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Meddelanden' }

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>
}) {
  const { user: targetUserId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // If targetUserId provided, ensure conversation exists
  if (targetUserId) {
    const isRecruiter = profile.user_type === 'recruiter'
    await supabase.from('conversations').upsert({
      recruiter_id: isRecruiter ? user.id : targetUserId,
      seeker_id: isRecruiter ? targetUserId : user.id,
    }, { onConflict: 'recruiter_id,seeker_id', ignoreDuplicates: true })
  }

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, created_at, last_message_at,
      recruiter:profiles!conversations_recruiter_id_fkey(id, full_name, avatar_url, headline),
      seeker:profiles!conversations_seeker_id_fkey(id, full_name, avatar_url, headline)
    `)
    .or(`recruiter_id.eq.${user.id},seeker_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <MessagesClient
          currentUser={profile}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          conversations={(conversations ?? []) as any}
          initialConversationId={targetUserId ? undefined : undefined}
        />
      </div>
    </div>
  )
}
