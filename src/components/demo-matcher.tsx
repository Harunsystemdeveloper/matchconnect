'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, X, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function DemoMatcher() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobSkillInput, setJobSkillInput] = useState('')
  const [jobSkills, setJobSkills] = useState<string[]>([])
  const [candidateSkillInput, setCandidateSkillInput] = useState('')
  const [candidateSkills, setCandidateSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ score: number; matching: string[]; missing: string[]; verdict: string } | null>(null)
  const [error, setError] = useState('')

  function addSkill(input: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    const s = input.trim()
    if (s && !list.includes(s) && list.length < 10) {
      setList([...list, s])
      setInput('')
    }
  }

  function removeSkill(skill: string, list: string[], setList: (v: string[]) => void) {
    setList(list.filter(s => s !== skill))
  }

  async function runDemo() {
    // Auto-add any text left in the inputs before validating
    const finalJobSkills = [...jobSkills]
    if (jobSkillInput.trim() && !finalJobSkills.includes(jobSkillInput.trim())) {
      finalJobSkills.push(jobSkillInput.trim())
      setJobSkills(finalJobSkills)
      setJobSkillInput('')
    }
    const finalCandidateSkills = [...candidateSkills]
    if (candidateSkillInput.trim() && !finalCandidateSkills.includes(candidateSkillInput.trim())) {
      finalCandidateSkills.push(candidateSkillInput.trim())
      setCandidateSkills(finalCandidateSkills)
      setCandidateSkillInput('')
    }

    if (!jobTitle || finalJobSkills.length === 0 || finalCandidateSkills.length === 0) {
      setError('Fyll i jobbtitel, jobbkrav och dina kompetenser.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/demo/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: jobTitle, job_skills: finalJobSkills, candidate_skills: finalCandidateSkills }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setResult(data)
    setLoading(false)
  }

  const scoreColor = result
    ? result.score >= 70 ? 'text-green-500' : result.score >= 45 ? 'text-yellow-500' : 'text-red-500'
    : ''

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-primary/20 bg-background/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-primary/5">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-semibold">Testa AI-matchning — utan konto</span>
      </div>

      <div className="space-y-5">
        {/* Job title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Jobbtitel</label>
          <Input
            placeholder="t.ex. Senior React-utvecklare"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
          />
        </div>

        {/* Job skills */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Jobbets krav <span className="text-muted-foreground font-normal">(tryck Enter)</span></label>
          <Input
            placeholder="t.ex. React, TypeScript, Node.js..."
            value={jobSkillInput}
            onChange={e => setJobSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(jobSkillInput, jobSkills, setJobSkills, setJobSkillInput) } }}
          />
          {jobSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {jobSkills.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1">
                  {s}
                  <button onClick={() => removeSkill(s, jobSkills, setJobSkills)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Candidate skills */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dina kompetenser <span className="text-muted-foreground font-normal">(tryck Enter)</span></label>
          <Input
            placeholder="t.ex. React, JavaScript, CSS..."
            value={candidateSkillInput}
            onChange={e => setCandidateSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(candidateSkillInput, candidateSkills, setCandidateSkills, setCandidateSkillInput) } }}
          />
          {candidateSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {candidateSkills.map(s => (
                <Badge key={s} className="gap-1 pr-1 bg-primary/10 text-primary border-primary/20">
                  {s}
                  <button onClick={() => removeSkill(s, candidateSkills, setCandidateSkills)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={runDemo} disabled={loading} className="w-full">
          {loading
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyserar...</>
            : <><Sparkles className="mr-2 h-4 w-4" />Beräkna matchningspoäng</>
          }
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 pt-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Matchningspoäng</span>
            <span className={`text-4xl font-bold ${scoreColor}`}>{result.score}<span className="text-lg text-muted-foreground">/100</span></span>
          </div>

          <p className="text-sm text-muted-foreground italic">{result.verdict}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            {result.matching.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Matchar ({result.matching.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.matching.map(s => (
                    <Badge key={s} className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {result.missing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Saknas ({result.missing.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.missing.map(s => (
                    <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center space-y-2">
            <p className="text-sm font-medium">Vill du se hela analysen med CV-upload, intervjufrågor och mer?</p>
            <Button asChild size="sm">
              <Link href="/register">Skapa gratis konto <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
