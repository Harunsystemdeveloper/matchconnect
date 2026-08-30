import { createAdminClient } from '@/lib/supabase/server'
import { canonicalizeSkills } from './claude'

interface OntologyEntry {
  id: string
  canonical_name: string
  aliases: string[]
  category: string | null
}

// Hela ontologin cachas kort i minnet — den är liten (hundratals rader) och läses på
// varje CV-analys/jobbannons, så ett gratis cache-hopp för de flesta anropen är värt det.
let cache: { entries: OntologyEntry[]; loadedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function loadOntology(): Promise<OntologyEntry[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.entries
  const admin = createAdminClient()
  const { data } = await admin.from('skill_ontology').select('id, canonical_name, aliases, category')
  cache = { entries: data ?? [], loadedAt: Date.now() }
  return cache.entries
}

/** Normaliserad nyckel för uppslag — skiftläge/mellanslag/vanlig interpunktion spelar ingen roll. */
function key(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.\-_/]/g, '')
}

function buildLookup(entries: OntologyEntry[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const e of entries) {
    map.set(key(e.canonical_name), e.canonical_name)
    for (const alias of e.aliases) map.set(key(alias), e.canonical_name)
  }
  return map
}

/**
 * Normaliserar en lista råa kompetens-strängar till kanoniska namn ur skill_ontology.
 * Kända kompetenser (redan i ontologin) matchas direkt utan AI-anrop. Okända kompetenser
 * skickas i EN batch till Claude för kanonisering, och resultatet sparas tillbaka i
 * ontologin (som ny post eller ny alias på en befintlig post) så nästa uppslag är gratis.
 *
 * Kraschar aldrig hela flödet — vid AI-fel faller okända kompetenser tillbaka till sitt
 * ursprungliga (trimmade) värde.
 */
export async function normalizeSkills(rawSkills: string[]): Promise<string[]> {
  const trimmed = rawSkills.map(s => s.trim()).filter(Boolean)
  if (trimmed.length === 0) return []

  const entries = await loadOntology()
  const lookup = buildLookup(entries)

  const resolved = new Map<string, string>()
  const unknown: string[] = []

  for (const raw of trimmed) {
    const canonical = lookup.get(key(raw))
    if (canonical) resolved.set(raw, canonical)
    else unknown.push(raw)
  }

  if (unknown.length > 0) {
    try {
      const admin = createAdminClient()
      const existingNames = entries.map(e => e.canonical_name)
      const results = await canonicalizeSkills(unknown, existingNames)

      for (const r of results) {
        const existing = entries.find(e => key(e.canonical_name) === key(r.canonical_name))

        if (existing) {
          if (!existing.aliases.some(a => key(a) === key(r.raw)) && key(existing.canonical_name) !== key(r.raw)) {
            const newAliases = [...existing.aliases, r.raw]
            await admin.from('skill_ontology').update({ aliases: newAliases }).eq('id', existing.id)
            existing.aliases = newAliases
          }
          resolved.set(r.raw, existing.canonical_name)
          continue
        }

        // Ny kanonisk kompetens. Race mot en samtidig request hanteras defensivt: om
        // insert misslyckas (t.ex. unik-krock) faller vi tillbaka på Claudes förslag som
        // canonical_name utan att skriva till DB — nästa anrop läker in det i ontologin.
        const { data: inserted, error } = await admin
          .from('skill_ontology')
          .insert({
            canonical_name: r.canonical_name,
            aliases: key(r.raw) === key(r.canonical_name) ? [] : [r.raw],
            category: r.category || null,
          })
          .select('id, canonical_name, aliases, category')
          .single()

        if (!error && inserted) {
          entries.push(inserted)
          resolved.set(r.raw, inserted.canonical_name)
        } else {
          resolved.set(r.raw, r.canonical_name)
        }
      }

      cache = { entries, loadedAt: Date.now() }
    } catch (err) {
      console.error('[skill-ontology] kanonisering misslyckades, faller tillbaka på rådata:', err)
      for (const raw of unknown) resolved.set(raw, raw)
    }
  }

  // Deduplicera, behåll ursprunglig ordning.
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of trimmed) {
    const canonical = resolved.get(raw) ?? raw
    const dedupeKey = key(canonical)
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey)
      out.push(canonical)
    }
  }
  return out
}
