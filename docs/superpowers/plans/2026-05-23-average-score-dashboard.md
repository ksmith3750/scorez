# Average Score on Dashboard Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each player's raw average score (rounded to nearest stroke, current year only) next to their handicap in the dashboard leaderboard.

**Architecture:** Add `avgScore: number | null` to the `PlayerHandicap` type and compute it in `calculateHandicaps` alongside the existing handicap logic. The leaderboard component reads `entry.avgScore` from the already-passed `PlayerHandicap[]` prop and renders it next to the handicap with column headers distinguishing the two values.

**Tech Stack:** TypeScript, React (Next.js), Jest

---

### Task 1: Add `avgScore` to the `PlayerHandicap` type and computation

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/handicap.ts`
- Test: `__tests__/lib/handicap.test.ts`

- [ ] **Step 1: Add a failing test for `avgScore`**

Open `__tests__/lib/handicap.test.ts`. Add this test inside the `describe('calculateHandicaps', ...)` block, after the existing tests:

```ts
it('computes avgScore as raw average strokes rounded to nearest integer, current year only', () => {
  const result = calculateHandicaps(players, rounds, scores)
  const kirk = result.find(h => h.player.id === 'p1')!
  // Kirk current year: 76 + 74 = 150, avg = 75
  expect(kirk.avgScore).toBe(75)
  const dave = result.find(h => h.player.id === 'p2')!
  // Dave current year: 81 + 79 = 160, avg = 80
  expect(dave.avgScore).toBe(80)
  const mike = result.find(h => h.player.id === 'p3')!
  // Mike has no rounds
  expect(mike.avgScore).toBeNull()
})

it('excludes prior-year scores from avgScore', () => {
  const result = calculateHandicaps(players, rounds, scores)
  const kirk = result.find(h => h.player.id === 'p1')!
  // r3 (score 78, prior year) must not affect avgScore
  // Current year only: (76 + 74) / 2 = 75, not (76 + 74 + 78) / 3 = 76
  expect(kirk.avgScore).toBe(75)
})

it('rounds avgScore to nearest integer', () => {
  const oddRounds: Round[] = [
    { id: 'r4', course_id: 'c1', date: `${currentYear}-04-01`, holes: 9, par: 36, created_by: 'p3', created_at: '' },
    { id: 'r5', course_id: 'c1', date: `${currentYear}-04-08`, holes: 9, par: 36, created_by: 'p3', created_at: '' },
    { id: 'r6', course_id: 'c1', date: `${currentYear}-04-15`, holes: 9, par: 36, created_by: 'p3', created_at: '' },
  ]
  const oddScores: RoundScore[] = [
    { id: 'os1', round_id: 'r4', player_id: 'p3', score: 37 },
    { id: 'os2', round_id: 'r5', player_id: 'p3', score: 38 },
    { id: 'os3', round_id: 'r6', player_id: 'p3', score: 38 },
  ]
  const result = calculateHandicaps([players[2]], oddRounds, oddScores)
  // (37 + 38 + 38) / 3 = 37.666... → rounds to 38
  expect(result[0].avgScore).toBe(38)
})
```

- [ ] **Step 2: Run the new tests to verify they fail**

```bash
npx jest __tests__/lib/handicap.test.ts --no-coverage
```

Expected: the three new tests FAIL with something like `TypeError: Cannot read properties of undefined (reading 'avgScore')` or `expect(received).toBe(expected)` — because `avgScore` doesn't exist yet. All pre-existing tests should still PASS.

- [ ] **Step 3: Add `avgScore` to `PlayerHandicap` in `lib/types.ts`**

Current content of the `PlayerHandicap` interface (lines 48–52):
```ts
export interface PlayerHandicap {
  player: Profile
  handicap: number | null   // null = no rounds this year
  roundCount: number
}
```

Replace with:
```ts
export interface PlayerHandicap {
  player: Profile
  handicap: number | null   // null = no rounds this year
  avgScore: number | null   // null = no rounds this year; raw avg strokes, rounded
  roundCount: number
}
```

- [ ] **Step 4: Compute `avgScore` in `lib/handicap.ts`**

Current return statement inside the `players.map` callback (the non-zero branch, around line 27):
```ts
    const total = playerScores.reduce(
      (sum, s) => sum + (s.score - parByRoundId[s.round_id]),
      0
    )
    const handicap = Math.round((total / playerScores.length) * 10) / 10

    return { player, handicap, roundCount: playerScores.length }
```

Replace with:
```ts
    const total = playerScores.reduce(
      (sum, s) => sum + (s.score - parByRoundId[s.round_id]),
      0
    )
    const handicap = Math.round((total / playerScores.length) * 10) / 10

    const avgScore = Math.round(
      playerScores.reduce((sum, s) => sum + s.score, 0) / playerScores.length
    )

    return { player, handicap, avgScore, roundCount: playerScores.length }
```

Also update the zero-scores early return (around line 23):
```ts
    if (playerScores.length === 0) {
      return { player, handicap: null, avgScore: null, roundCount: 0 }
    }
```

- [ ] **Step 5: Run all tests to verify everything passes**

```bash
npx jest __tests__/lib/handicap.test.ts --no-coverage
```

Expected: all tests PASS, including the three new ones.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/handicap.ts __tests__/lib/handicap.test.ts
git commit -m "feat: add avgScore to PlayerHandicap type and calculation"
```

---

### Task 2: Display `avgScore` in the leaderboard UI

**Files:**
- Modify: `components/handicap-leaderboard.tsx`

- [ ] **Step 1: Add column headers to the leaderboard**

Open `components/handicap-leaderboard.tsx`. Find the `<h2>` heading block (around line 66–68):
```tsx
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        {new Date().getFullYear()} Handicaps
      </h2>
```

Replace with:
```tsx
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {new Date().getFullYear()} Handicaps
      </h2>
      <div className="flex justify-end gap-4 mb-1 pr-0.5">
        <span className="text-xs text-slate-400 w-10 text-right">avg</span>
        <span className="text-xs text-slate-400 w-10 text-right">hdcp</span>
      </div>
```

- [ ] **Step 2: Replace the single-stat right side with the two-stat group**

Find the non-editing row's right side (the `<span>` showing handicap, around lines 127–129):
```tsx
                <span className={`text-sm font-bold shrink-0 ${entry.handicap !== null ? 'text-green-700' : 'text-slate-300'}`}>
                  {formatHandicap(entry.handicap)}
                </span>
```

Replace with:
```tsx
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-sm font-bold w-10 text-right ${entry.avgScore !== null ? 'text-slate-700' : 'text-slate-300'}`}>
                    {entry.avgScore !== null ? entry.avgScore : '—'}
                  </span>
                  <span className={`text-sm font-bold w-10 text-right ${entry.handicap !== null ? 'text-green-700' : 'text-slate-300'}`}>
                    {formatHandicap(entry.handicap)}
                  </span>
                </div>
```

- [ ] **Step 3: Verify the app renders correctly**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm:
- Each player row shows two right-aligned numbers: avg strokes (plain integer) and handicap (e.g., `+2.3`)
- Column headers `avg` and `hdcp` appear above the stat columns
- Players with no rounds show `—` in both columns

Stop the dev server with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add components/handicap-leaderboard.tsx
git commit -m "feat: show avg score alongside handicap in leaderboard"
```
