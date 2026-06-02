# MatchConnect

> AI-driven jobbmatchningsplattform för den svenska arbetsmarknaden

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-backend-3ECF8E?logo=supabase)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4.6-orange?logo=anthropic)

Plattform som kopplar samman jobbsökare med rekryterare via Claude AI — matchningspoäng, kompetensgap-analys och AI-genererade intervjufrågor i realtid.

---

## Funktioner

**Jobbsökare**
- Ladda upp CV (PDF/DOCX) och få AI-analys av skills och erfarenhet
- Matchas mot aktiva jobb med poäng 0–100
- Se exakta kompetensgap per jobb
- Förbered dig med personaliserade intervjufrågor

**Rekryterare**
- Skapa och hantera jobbannonser
- Rankad kandidatlista med AI-matchningspoäng
- AI-sammanfattning per kandidat
- Hantera ansökningsstatus och shortlist

---

## Tech Stack

| Lager | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Språk | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend/Auth | Supabase |
| AI | Anthropic Claude Sonnet 4.6 |
| Formulär | react-hook-form + zod |

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

**1. Databas** – Kör migrationerna i Supabase Dashboard → SQL Editor:
```
supabase/migrations/0001_initial.sql
supabase/migrations/0002_features.sql
supabase/migrations/20240120_ai_audit_logs.sql
```

**2. Storage Buckets** – Skapa i Supabase Dashboard → Storage:

| Namn | Publik |
|------|--------|
| `avatars` | Ja |
| `logos` | Ja |
| `cvs` | Nej |

**3. Realtime** – Aktivera `messages` + `conversations` i Database → Replication

### Starta

```bash
npm run dev   # http://localhost:3000
```

---

## AI-endpoints

| Route | Funktion |
|-------|----------|
| `POST /api/ai/analyze-cv` | Extraherar skills, erfarenhet och utbildning från CV |
| `POST /api/ai/match-score` | Beräknar matchningspoäng 0–100 med motivering |
| `POST /api/ai/match-candidates` | Rankar kandidater mot en jobannons |
| `POST /api/ai/skill-gaps` | Identifierar kompetensgap per jobb |
| `POST /api/ai/interview-questions` | Genererar 6–8 personaliserade intervjufrågor |
| `POST /api/ai/summarize-candidate` | Rekryterarvy – AI-sammanfattning per kandidat |

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
