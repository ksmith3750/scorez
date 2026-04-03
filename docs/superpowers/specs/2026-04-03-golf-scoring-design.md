# Golf Scoring App — Design Spec

**Date:** 2026-04-03

---

## Overview

A private, web-based golf scoring app for a fixed group of friends. Records rounds, displays round history, and calculates a per-player handicap based on the current year's rounds. Built with Next.js and Supabase, hosted free on Vercel.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend / Full-stack | Next.js (App Router) |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Hosting | Vercel (frontend), Supabase (backend) |

---

## Users & Authentication

- Login via email/password using Supabase Auth.
- The group is **fixed and private** — new users are added by an admin (via Supabase dashboard), not via a self-signup flow.
- All logged-in users can view all data.
- Any logged-in user can record a round and enter scores for any player.

---

## Data Model

### `profiles`
Linked 1:1 to Supabase auth users.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Foreign key to `auth.users` |
| `name` | text | Display name |

### `rounds`
One row per round played.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `course_name` | text | Name of the course |
| `date` | date | Date the round was played |
| `holes` | integer | 9 or 18 |
| `par` | integer | Par for the round |
| `created_by` | uuid | FK to `profiles.id` |
| `created_at` | timestamptz | Auto-set on insert |

### `round_scores`
One row per player per round.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `round_id` | uuid | FK to `rounds.id` |
| `player_id` | uuid | FK to `profiles.id` |
| `score` | integer | Total strokes for the round |

---

## Handicap Formula

For each player, handicap is calculated as the **average of `(score − par)`** across all `round_scores` rows where the round's date falls within the current calendar year.

- A positive value means they typically score over par.
- Players with no rounds in the current year display `—` (no handicap).
- Handicaps are computed at query time — not stored.

---

## Pages

### 1. Login (`/login`)
Email/password login form. Redirects to Dashboard on success. No self-signup — access is invitation-only (admin adds users via Supabase dashboard).

### 2. Dashboard (`/`)
Default page after login. Two-panel layout:
- **Left panel:** 2026 handicap leaderboard — all players ranked by handicap (lowest first), showing their computed handicap. Players with no rounds this year show `—`.
- **Right panel:** 3 most recent rounds — course name, date, holes, par, and each player's score for that round. "View all →" link to History.
- **CTA button:** "+ Record New Round" button linking to New Round page.

### 3. New Round (`/rounds/new`)
Form to record a round:
- Course name (text input)
- Date (date picker, defaults to today)
- Holes (select: 9 or 18)
- Par (number input)
- Score entry: one number input per player (all players shown, entry is optional per player — not every player plays every round)

On submit, creates one `rounds` row and one `round_scores` row per player who has a score entered.

### 4. Round History (`/rounds`)
Full list of all rounds, sorted by date descending. Each row shows course name, date, holes, par, and all players' scores for that round. Clicking a round opens Round Detail.

### 5. Round Detail (`/rounds/[id]`)
Shows all details for a single round: course, date, holes, par, and a table of player scores. Includes a back link to History.

---

## Visual Style

- **Theme:** Clean & Light — white backgrounds, green (`#15803d`) accents.
- **Typography:** Sans-serif, clear hierarchy.
- **Mobile-friendly:** Responsive layouts; the app should be usable on a phone on the course.

---

## Future Considerations (Out of Scope for v1)

- Multi-group support (letting other friend groups sign up and manage their own players)
- Per-hole score entry
- Course rating / slope adjustments for WHS-style handicaps
- Admin UI within the app (for now, user management is via Supabase dashboard)
