'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  'Analysera mitt CV och ge förbättringstips',
  'Vilket jobb passar mig bäst just nu?',
  'Hjälp mig skriva ett personligt brev',
  'Vad saknar jag för att höja mitt matchningspoäng?',
  'Hur förbereder jag mig för en intervju?',
]

function MessageBubble({ msg, userName }: { msg: Message; userName: string }) {
  const isUser = msg.role === 'user'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        {isUser ? (
          <AvatarFallback className="gradient-primary text-white text-xs font-bold">{initials}</AvatarFallback>
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <p className="text-xs text-muted-foreground px-1">
          {isUser ? 'Du' : 'Karriärcoach'}
        </p>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'gradient-primary text-white rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col space-y-1">
        <p className="text-xs text-muted-foreground px-1">Karriärcoach</p>
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex gap-1 items-center h-4">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CoachClient({ profile }: { profile: Profile }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hej ${profile.full_name?.split(' ')[0] ?? 'där'}! 👋 Jag är din AI-karriärcoach på MatchConnect.\n\nJag har tillgång till din profil, dina ansökningar och alla aktiva jobb — så jag kan ge dig personliga råd.\n\nVad kan jag hjälpa dig med idag?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput('')
    const userMessage: Message = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setLoading(true)

    // Build messages for API (exclude initial greeting)
    const apiMessages = newMessages
      .slice(1)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Något gick fel')
        setLoading(false)
        return
      }

      // Read streaming response
      setLoading(false)
      setStreaming(true)
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + chunk }
            }
            return updated
          })
        }
      }
      setStreaming(false)
    } catch {
      toast.error('Kunde inte nå karriärcoachen. Kontrollera din anslutning.')
      setLoading(false)
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function reset() {
    setMessages([
      {
        role: 'assistant',
        content: `Hej igen! Ny konversation startad. Vad kan jag hjälpa dig med?`,
      },
    ])
  }

  const isTyping = loading || (streaming && messages[messages.length - 1]?.content === '')

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AI-karriärcoach</h1>
            <p className="text-xs text-muted-foreground">Har tillgång till din profil och alla aktiva jobb</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} title="Ny konversation">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} userName={profile.full_name ?? 'Du'} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — only show at start */}
      {messages.length <= 1 && (
        <div className="pb-4 flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-2 px-1">Föreslagna frågor:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-4 border-t flex-shrink-0">
        <Textarea
          ref={textareaRef}
          placeholder="Skriv din fråga... (Enter för att skicka, Shift+Enter för ny rad)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none flex-1 text-sm"
          disabled={loading || streaming}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading || streaming}
          size="icon"
          className="h-full px-4 flex-shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center pt-2">
        AI kan göra misstag. Verifiera viktiga beslut.
      </p>
    </div>
  )
}
