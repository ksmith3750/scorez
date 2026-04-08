# Scorez

A private web app for tracking golf scores and handicaps for a group of friends. Records rounds, shows history, and calculates year-based handicaps (average of score minus par across all rounds in the current calendar year).

**Stack:** Next.js App Router · Supabase (PostgreSQL + Auth) · Tailwind CSS · Vercel

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Clone and install

```bash
git clone https://github.com/your-username/scorez.git
cd scorez
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase dashboard under **Settings → Data API**.

- **Project URL** format: `https://your-project-id.supabase.co`
- **Anon key**: the publishable/anon key (not the secret key)

### 3. Run database migrations

In the Supabase dashboard, go to **SQL Editor** and run each migration file in order:

1. `supabase/migrations/20260403000000_initial.sql`
2. `supabase/migrations/20260404000001_add_players_table.sql`

### 4. Create your first user

In the Supabase dashboard, go to **Authentication → Users → Add user → Create new user** and enter an email and password. Use those credentials to log in to the app.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### 1. Push to GitHub

Make sure your code is pushed to a GitHub repository.

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → select your repository
3. Vercel auto-detects Next.js — no build settings changes needed
4. Click **Deploy** (the first deploy may fail until env vars are added — that's expected)

### 3. Add environment variables

In your Vercel project, go to **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon/publishable key |

Both values come from Supabase → **Settings → Data API**.

### 4. Redeploy

After adding env vars, go to **Deployments** and click **Redeploy**, or push a new commit.

### 5. Update Supabase auth settings

In Supabase → **Authentication → URL Configuration**:

- Set **Site URL** to your Vercel deployment URL (e.g. `https://your-app.vercel.app`)
- Add the same URL to **Redirect URLs**

---

## Running Tests

```bash
npm test
```
