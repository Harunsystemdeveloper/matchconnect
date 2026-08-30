# MatchConnect

> AI-driven jobbmatchningsplattform för den svenska arbetsmarknaden

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-backend-3ECF8E?logo=supabase)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4.6-orange?logo=anthropic)

Plattform som kopplar samman jobbsökare med rekryterare via Claude AI — matchningspoäng, kompetensgap-analys, AI-genererade intervjufrågor, strukturerade intervjuutvärderingar och en AI-karriärcoach, allt i realtid.

---

## Funktioner

### För jobbsökare
- Registrering med e-post/lösenord eller Google, guidad onboarding
- Ladda upp CV (PDF/DOCX) och få AI-analys av kompetenser, erfarenhet, utbildning och styrkor
- Bläddra och filtrera aktiva jobbannonser
- AI-matchningspoäng (0–100) med motivering per jobb
- Kompetensgapanalys — se exakt vad som saknas för ett specifikt jobb
- Personaliserade AI-genererade intervjufrågor per ansökan
- Ansök med personligt brev, spara jobb, dra tillbaka ansökan
- **AI-karriärcoach** — chattbaserad assistent (streaming, tool-use) som hämtar din profil, aktiva jobb, dina ansökningar och exakta kompetensgap i realtid för att ge konkreta råd
- Realtidschatt med rekryterare + notifikationer
- Se företagets karriärsida (varumärkesanpassad: accentfärg, omslagsbild, medarbetarcitat)
- GDPR-självbetjäning: exportera all din data eller radera kontot helt, direkt från inställningarna

### För rekryterare
- Skapa, redigera och hantera jobbannonser (status, deadline, lönespann, kompetenskrav)
- **AI-matchning av kandidater** — hybrid pipeline: snabb kompetensöverlappsfiltrering följt av djupanalys med Claude för de mest relevanta kandidaterna
- Kandidatlista i list- eller kanban-vy, med sökning, filter och CSV-export
- AI-sammanfattning per kandidat + föreslagna profiler som matchar men inte sökt än
- Shortlist och kandidat-CRM (interna anteckningar + taggar per kandidat)
- Talangpool — bläddra bland alla jobbsökares profiler, inte bara de som sökt
- Intervjubokning — föreslå tider, kandidaten bekräftar
- **Strukturerade intervju-scorecards** — betygsätt varje intervjufråga (1–5), sätt rekommendation per intervjusteg, och låt AI väga samman flera bedömares scorecards till en konsensusbild (styrkor, farhågor, samstämmighet)
- Möjlighet att manuellt överstyra ett AI-matchpoäng med motivering (EU AI Act Article 14 — mänsklig kontroll)
- Företagsprofil med varumärkesanpassning: logotyp, omslagsbild, accentfärg och medarbetarcitat på den publika karriärsidan
- Analytics-dashboard över jobbannonser, ansökningar och matchningar

### Plattformsövergripande
- **AI-beslutslogg** — varje AI-matchning, CV-analys och kompetensgapanalys loggas spårbart (modell, indata, resultat, ev. mänsklig överstyrning) enligt EU AI Act Article 12
- GDPR: dataexport/radering, cookie-banner, sekretess- och användarvillkorssidor
- Rate limiting på alla AI- och auth-endpoints
- Row Level Security på samtliga tabeller — varje användare kan bara nå sin egen data
- Dark/light-läge
- Publik landningssida med interaktiv AI-matchningsdemo (ingen inloggning krävs)

---

## Tech Stack

| Lager | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Språk | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend/Auth | Supabase (Postgres, Auth, Storage, Realtime) |
| AI | Anthropic Claude Sonnet 4.6 + Claude Haiku (demo) |
| Formulär | react-hook-form + zod |
| Tema | next-themes (dark/light) |

---

## Kom igång

### Förutsättningar
- Node.js 20+, npm 10+
- [Supabase-konto](https://supabase.com)
- [Anthropic API-nyckel](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/Harunsystemdeveloper/matchconnect.git
cd matchconnect
npm install
cp .env.example .env.local
```

Fyll i `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase-setup

**1. Databas** — Kör migrationerna i Supabase Dashboard → SQL Editor, i denna ordning:
```
supabase/migrations/0001_initial.sql
supabase/migrations/0002_features.sql
supabase/migrations/0003_scorecards_and_branding.sql
supabase/migrations/0004_fix_missing_rls.sql
supabase/migrations/0005_fix_experience_level_constraint.sql
supabase/migrations/20240120_ai_audit_logs.sql
```
Klistra in innehållet i varje fil för sig och kör (Run) i tur och ordning. Alla migrationer är skrivna med `if not exists`/`drop policy if exists`-skydd och är säkra att köra även om något redan finns.

**2. Storage Buckets** — Skapa i Supabase Dashboard → Storage:

| Namn | Publik |
|------|--------|
| `avatars` | Ja |
| `logos` | Ja *(används även för karriärsidans omslagsbild)* |
| `cvs` | Nej |

**3. Realtime** — Aktivera `messages` + `conversations` i Database → Replication

**4. Row Level Security** — Verifiera i Authentication → Policies att samtliga tabeller (`profiles`, `jobs`, `cv_profiles`, `applications`, `company_profiles`, `saved_jobs`, `shortlist`, `conversations`, `messages`, `notifications`, `candidate_notes`, `interview_schedules`, `interview_scorecards`, `ai_decision_logs`) visar RLS enabled efter migration 0004.

### Starta

```bash
npm run dev   # http://localhost:3000
```

---

## AI-endpoints

| Route | Funktion |
|-------|----------|
| `POST /api/ai/analyze-cv` | Extraherar kompetenser, erfarenhet och utbildning från CV |
| `POST /api/ai/extract-cv-text` | Extraherar ren text från uppladdad CV-fil (PDF/DOCX) |
| `POST /api/ai/match-score` | Beräknar matchningspoäng 0–100 med motivering |
| `POST /api/ai/match-candidates` | Rankar kandidater mot en jobbannons (hybrid pre-filter + Claude) |
| `POST /api/ai/auto-match` | Automatisk matchning av nya ansökningar mot ett jobb |
| `POST /api/ai/skill-gaps` | Identifierar kompetensgap per jobb |
| `POST /api/ai/interview-questions` | Genererar 6–8 personaliserade intervjufrågor |
| `POST /api/ai/summarize-candidate` | Rekryterarvy — AI-sammanfattning per kandidat |
| `POST /api/ai/summarize-interview-feedback` | Väger samman flera intervju-scorecards till en konsensusbedömning |
| `POST /api/ai/career-coach` | Streamande AI-karriärcoach med verktygsanrop mot profil/jobb/ansökningar |
| `POST /api/demo/match` | Publik, rate-limitad matchningsdemo på landningssidan (kräver ej inloggning) |

---

## Deploy

```bash
npm i -g vercel && vercel login && vercel --prod
```

Lägg till miljövariablerna i Vercel Dashboard och uppdatera Supabase Redirect URLs:
- Site URL: `https://din-app.vercel.app`
- Redirect URL: `https://din-app.vercel.app/api/auth/callback`

---

## Kommandon

```bash
npm run dev          # Dev-server (port 3000)
npm run build        # Produktionsbygge
npm run lint         # ESLint
npx shadcn@latest add <component>
```
