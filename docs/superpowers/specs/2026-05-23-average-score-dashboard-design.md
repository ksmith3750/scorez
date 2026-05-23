# Average Score on Dashboard Leaderboard

**Date:** 2026-05-23  
**Status:** Approved

## Overview

Add a raw average score (rounded to the nearest whole stroke) for each golfer in the handicap leaderboard on the dashboard. The average is scoped to the current year, consistent with how handicap is calculated.

## Data Layer

### `lib/types.ts`

Add `avgScore: number | null` to `PlayerHandicap`:

```ts
export interface PlayerHandicap {
  player: Profile
  handicap: number | null   // null = no rounds this year
  avgScore: number | null   // null = no rounds this year
  roundCount: number
}
```

### `lib/handicap.ts`

Compute `avgScore` in the same loop as handicap. No additional DB queries — `s.score` is already fetched:

```ts
const avgScore =
  playerScores.length === 0
    ? null
    : Math.round(
        playerScores.reduce((sum, s) => sum + s.score, 0) / playerScores.length
      )

return { player, handicap, avgScore, roundCount }
```

## UI Layer

### `components/handicap-leaderboard.tsx`

Each leaderboard row gains a two-column stat group on the right side:

```
1  ●  Kirk        90   +2.3
2  ●  Alex        94   +5.0
3  ●  Sam          —    —
```

- `avgScore` renders as a plain integer (e.g., `90`) or `—` if null
- `handicap` continues to render as before (e.g., `+2.3`) or `—` if null
- Column headers (`avg` / `hdcp`) distinguish the two values
- `Props` interface is unchanged — `avgScore` arrives via the existing `PlayerHandicap[]` prop

## Edge Cases

| Scenario | Behavior |
|---|---|
| Player has no rounds this year | `avgScore: null` → renders `—` |
| Player has exactly one round | Average of one value, rounds correctly |
| Mix of 9-hole and 18-hole rounds | Raw score totals are averaged as-is (no normalization) |

## Testing

- Add assertions to `calculateHandicaps` unit tests verifying `avgScore` equals the expected rounded integer
- Existing handicap tests remain unchanged (adding a field is non-breaking)
- No new DB queries or components; visual correctness confirmed by running the app
