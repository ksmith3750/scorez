# Export to Excel — Design Spec

**Date:** 2026-06-05

## Summary

Add an "Export to Excel" button to the Round History page that downloads all historical round data as a two-tab `.xlsx` file.

## Placement

The button lives at the top of `/rounds` (Round History page), right-aligned next to the "Round History" heading. This mirrors the heading-left / action-right pattern already used on the Dashboard. The button is hidden when there are no rounds.

## Workbook Structure

Filename: `scorez-rounds.xlsx`

### Tab 1 — "Rounds"

One row per round. Columns (in order):

| Column | Source |
|--------|--------|
| Date | `round.date` formatted as `MMM D, YYYY` |
| Course | `round.course?.name ?? 'Unknown Course'` |
| Holes | `round.holes` |
| Par | `round.par` |
| `<Player Name>` × N | One column per unique player across all rounds, sorted alphabetically. Cell is the player's score, or blank if they didn't play that round. |
| Notes | All notes for the round joined with ` \| `, or blank if none. |

Rounds ordered newest-first. Header row is frozen.

### Tab 2 — "Scores"

One row per player per round. Columns:

| Column | Source |
|--------|--------|
| Date | `round.date` formatted as `MMM D, YYYY` |
| Course | `round.course?.name ?? 'Unknown Course'` |
| Holes | `round.holes` |
| Par | `round.par` |
| Player | `score.player?.name ?? 'Unknown Player'` |
| Score | `score.score` |
| +/- Par | `score.score - round.par` |

Rounds ordered newest-first. Header row is frozen.

## Implementation Approach

**Client-side with SheetJS (`xlsx` npm package)**

The rounds data is already fetched server-side in `app/rounds/page.tsx`. No additional data fetching is needed.

### New files

- `components/export-button.tsx` — client component (`"use client"`). Receives `rounds: RoundWithScores[]` as props. Renders the button, manages the `exporting` loading state, calls `buildWorkbook()`, and triggers the download.
- `lib/export.ts` — pure utility. Exports a single function `buildWorkbook(rounds: RoundWithScores[]): WorkBook` that constructs the two-tab SheetJS workbook. No React, no side effects — fully unit-testable.

### Modified files

- `app/rounds/page.tsx` — add the heading/button header row and render `<ExportButton rounds={rounds} />`.
- `package.json` — add `xlsx` dependency.

### Data flow

```
app/rounds/page.tsx (server)
  └─ fetches RoundWithScores[]
  └─ renders RoundsList (existing)
  └─ renders ExportButton (new, receives rounds as props)
        └─ on click: calls lib/export.ts buildWorkbook()
        └─ triggers browser download of scorez-rounds.xlsx
```

## Error Handling

- Empty rounds list: button is not rendered.
- SheetJS failure: surfaces as an unhandled browser exception (acceptable for a one-off local export action).

## Dependencies

- `xlsx` (SheetJS community edition) — one new production dependency.
