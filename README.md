# MatchConnect – AI-driven jobbmatchning

AI-driven plattform som matchar jobbsökare med rekryterare på den svenska arbetsmarknaden.

**Tech Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Anthropic Claude API

---

## Lokal utveckling

### 1. Förutsättningar
- Node.js 20+, npm 10+
- Supabase-konto (supabase.com)
- Anthropic API-nyckel (console.anthropic.com)

### 2. Installera

```bash
cd matchconnect
npm install
cp .env.example .env.local   # Fyll i värdena
```

### 3. Supabase-setup

**a) SQL-migration** – Kör `supabase/migrations/001_initial.sql` i Supabase Dashboard → SQL Editor

**b) Storage Buckets** – Skapa i Supabase Dashboard → Storage:

| Namn | Publik |
|------|--------|
| `avatars` | Ja |
| `logos` | Ja |
| `cvs` | Nej |

**c) Realtime** – Aktivera `messages` + `conversations` i Database → Replication

**d) Google OAuth (valfritt)** – Authentication → Providers → Google

### 4. Starta

```bash
npm run dev   # http://localhost:3000
```

---

## Deploy till Vercel

```bash
npm i -g vercel && vercel login && vercel --prod
```

Lägg till miljövariabler i Vercel Dashboard. Uppdatera Supabase Redirect URLs:
- Site URL: `https://din-app.vercel.app`
- Redirect URL: `https://din-app.vercel.app/api/auth/callback`

---

## AI-routes

| Route | Funktion |
|-------|----------|
| `POST /api/ai/analyze-cv` | CV-analys med Claude – extraherar skills, erfarenhet, utbildning |
| `POST /api/ai/match-candidates` | Rankar jobbsökare mot annons (0–100%) |
| `POST /api/ai/skill-gaps` | Kompetensgap-analys per jobb |
| `POST /api/ai/interview-questions` | 6–8 personaliserade intervjufrågor |

---

## Kommandon

```bash
npm run dev          # Dev-server
npm run build        # Produktionsbygge
npm run lint         # ESLint
npx shadcn@latest add <component>   # Lägg till UI-komponent
```
