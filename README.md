# Scorez

A private golf scoring web app for a fixed group of friends. Record rounds, track history, and see handicaps calculated automatically from your rounds this calendar year.

![Scorez dashboard showing recent rounds and handicap leaderboard](public/screenshot.svg)

---

## Features

- **Record rounds** — pick a course, set holes (9 or 18) and par, enter scores for each player
- **Scorecard photo upload** — take a photo of a paper scorecard and let AI parse it into a new round automatically (requires an Anthropic API key)
- **Live +/- par** — scores show your position relative to par as you type
- **Player management** — add new players or select existing ones per round; no separate admin step required
- **Course management** — search from a pre-populated list or add a new course inline
- **Round notes** — add free-text notes to any round; visible on the dashboard and history
- **Handicap leaderboard** — average score-minus-par across all rounds in the current calendar year, updated automatically
- **Display names** — set a friendly name in Settings or edit any player's name inline from the leaderboard
- **Login required** — email/password auth via Supabase; only invited users can access the app

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS v4 |
| AI parsing | Anthropic Claude (vision) |
| Deployment | Vercel or Render |

---

## Local development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd scorez
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Data API** and copy:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **anon / public key**
3. Run the migrations in order from `supabase/migrations/` using the Supabase SQL editor

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key   # optional — enables scorecard photo upload
```

> If `ANTHROPIC_API_KEY` is not set, the scorecard upload section on the New Round page is shown as disabled.

### 4. Add users

Invite users via **Supabase Dashboard → Authentication → Users → Invite user**. They will receive an email to set their password. Once logged in they can set a display name in **Settings**.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (optional)
4. Deploy — Vercel detects Next.js automatically

### Supabase CORS (Vercel)

In Supabase → **Project Settings → API**, add your Vercel domain (e.g. `https://scorez.vercel.app`) to the **Allowed origins** list.

---

## Deploying to Render

A `render.yaml` is included. To deploy:

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint** and connect the repo
3. Render will detect `render.yaml` and create a web service
4. Set the environment variables in the Render dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (optional)

The app runs on the free tier (spins down after inactivity).

---

## Database migrations

Migrations live in `supabase/migrations/` and must be applied in filename order via the Supabase SQL editor:

| File | Purpose |
|---|---|
| `20260403000000_initial.sql` | Core schema: courses, rounds, round_scores, profiles, RLS |
| `20260404000001_add_players_table.sql` | Standalone players table decoupled from auth |
| `20260408000001_players_update_policy.sql` | Allow any authenticated user to update player names |
| `20260408000003_round_notes.sql` | Round notes table |

---

## Scorecard photo upload

On the **New Round** page, drag and drop or browse to a JPEG, PNG, or WebP photo of a scorecard. The image is sent to a server-side API route which passes it to the Claude vision model. The model extracts:

- Course name
- Date
- Number of holes
- Total par
- Player names and total scores

The form is pre-filled with the extracted data. Player names are fuzzy-matched against existing players so known names map automatically. Review the pre-filled data before saving.

This feature is disabled when `ANTHROPIC_API_KEY` is not configured.
