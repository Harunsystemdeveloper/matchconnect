'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

export interface ConversationPreview {
  id: string
  last_message_at: string | null
  recruiter: { id: string; full_name: string | null; avatar_url: string | null; headline: string | null } | null
  seeker: { id: string; full_name: string | null; avatar_url: string | null; headline: string | null } | null
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export function MessagesClient({
  currentUser,
  conversations: initialConversations,
}: {
  currentUser: Profile
  conversations: ConversationPreview[]
  initialConversationId?: string
}) {
  const [conversations] = useState(initialConversations)
  const [activeConv, setActiveConv] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const activeConversation = conversations.find(c => c.id === activeConv)
  const otherUser = activeConversation
    ? currentUser.user_type === 'recruiter'
      ? activeConversation.seeker
      : activeConversation.recruiter
    : null

  useEffect(() => {
    if (!activeConv) return

    // Load messages
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConv)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []))

    // Subscribe to new messages from others (own messages are added optimistically)
    const channel = supabase
      .channel(`messages:${activeConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv}`,
      }, (payload) => {
        const incoming = payload.new as Message
        setMessages(prev => {
          // Avoid duplicates: skip if real ID already exists, or replace optimistic placeholder
          if (prev.some(m => m.id === incoming.id)) return prev
          const withoutOptimistic = prev.filter(m => !(
            m.id.startsWith('tmp-') &&
            m.sender_id === incoming.sender_id &&
            m.content === incoming.content
          ))
          return [...withoutOptimistic, incoming]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !activeConv) return
    const content = input.trim()
    setInput('')
    setSending(true)

    // Optimistically add message immediately so UI feels instant
    const tmpId = `tmp-${Date.now()}`
    const optimistic: Message = {
      id: tmpId,
      conversation_id: activeConv,
      sender_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConv, sender_id: currentUser.id, content })
      .select()
      .single()

    if (error) {
      toast.error('Kunde inte skicka meddelandet')
      setMessages(prev => prev.filter(m => m.id !== tmpId))
      setInput(content)
    } else {
      // Replace optimistic placeholder with real message from DB
      setMessages(prev => prev.map(m => m.id === tmpId ? (inserted as Message) : m))
      supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConv)
    }
    setSending(false)
  }

  function getInitials(name: string | null) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  }

  function openConversation(convId: string) {
    setActiveConv(convId)
    setMobileView('chat')
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Conversation list — hidden on mobile when chat is open */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r flex-col flex-shrink-0`}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Meddelanden</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Inga konversationer ännu
            </div>
          ) : (
            conversations.map(conv => {
              const other = currentUser.user_type === 'recruiter' ? conv.seeker : conv.recruiter
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors border-b ${
                    activeConv === conv.id ? 'bg-accent' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={other?.avatar_url ?? ''} />
                    <AvatarFallback className="gradient-primary text-white text-xs">
                      {getInitials(other?.full_name ?? null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{other?.full_name ?? 'Okänd'}</p>
                    <p className="text-xs text-muted-foreground truncate">{other?.headline ?? ''}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat window — hidden on mobile when list is shown */}
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        {!activeConv || !otherUser ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Välj en konversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <button
                className="md:hidden text-muted-foreground hover:text-foreground mr-1"
                onClick={() => setMobileView('list')}
                aria-label="Tillbaka"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={otherUser.avatar_url ?? ''} />
                <AvatarFallback className="gradient-primary text-white text-xs">
                  {getInitials(otherUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{otherUser.full_name}</p>
                <p className="text-xs text-muted-foreground">{otherUser.headline}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Ingen meddelandehistorik. Skicka ett meddelande för att börja!
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.sender_id === currentUser.id
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? 'gradient-primary text-white rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-3">
              <Input
                placeholder="Skriv ett meddelande..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={sending || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
