# Edit Score in a Round — Design Spec

**Date:** 2026-07-31

---

## Overview

Allow any logged-in user to correct a player's score on an existing round directly from the Round Detail page. Editing is inline — clicking a score value turns it into a number input; saving happens on Enter or blur without a separate Save button.

---

## Scope

- **In scope:** Changing an existing `round_scores.score` value for a player already on the round.
- **Out of scope:** Adding a player to a round, removing a player from a round, editing round-level fields (course, date, holes, par).

---

## Architecture & Data Flow

The Round Detail page (`app/rounds/[id]/page.tsx`) remains a server component. Its inline scorecard table is replaced with a new `EditableScorecard` client component.

Flow for a single score edit:

1. User clicks a score value on the Round Detail page.
2. That cell switches to a focused `<input type="number">` pre-filled with the current value. The +/- par cell recalculates live as the user types.
3. **Enter or blur** → calls the `updateScore` server action.
   - On success: displayed value updates, cell returns to read state.
   - On failure: cell reverts to original value, inline error appears below the row.
4. **Escape** → reverts to original value, no save.

---

## DB Layer

**`lib/db/rounds.ts`** — new function:

```ts
updateRoundScore(scoreId: string, score: number): Promise<void>
```

Executes: `UPDATE round_scores SET score = $score WHERE id = $scoreId`. No schema changes required.

---

## Server Action

**`app/actions.ts`** — new action:

```ts
updateScore(scoreId: string, score: number): Promise<{ error?: string }>
```

- Requires authenticated user; returns `{ error: 'Not logged in' }` if not.
- Validates: score is an integer, 1 ≤ score ≤ 200. Returns `{ error: '...' }` on invalid input.
- Calls `updateRoundScore`, then `revalidatePath('/')` and `revalidatePath('/rounds')`.

---

## Component

**`components/editable-scorecard.tsx`** — new client component:

```
Props:
  scores: RoundScore[]   // from getRound()
  par:    number
```

State:
- `editingId: string | null` — the `scoreId` currently in edit mode
- `draftValue: string` — the in-progress input value
- `error: string` — inline error for the last failed save

Behaviour:
- Each score cell renders as a clickable span (with a subtle hover/cursor cue) in read mode, or a `<input type="number" min=1 max=200>` in edit mode.
- Clicking a span sets `editingId` to that score's `id` and `draftValue` to its current score.
- While editing, the +/- par column derives from `draftValue` (live); all other rows use their persisted score.
- On Enter or blur: if `draftValue` is valid and changed, calls `updateScore`. On error, reverts `draftValue` and sets `error`. Always clears `editingId` after attempting save.
- On Escape: clears `editingId` and `draftValue`, no network call.
- Input styling matches existing inputs in `new-round-form.tsx`.

**`app/rounds/[id]/page.tsx`** — replaces the inline `<table>` scorecard with:

```tsx
<EditableScorecard scores={round.scores} par={round.par} />
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Save fails (network / DB error) | Revert cell to original value; show inline red error below the row |
| Score out of range (< 1 or > 200) | Blocked client-side by input `min`/`max`; no action called |
| Not authenticated | `updateScore` returns `{ error: 'Not logged in' }` |

---

## Testing

- **Unit test** (`app/actions.ts` — `updateScore`):
  - Valid update succeeds
  - Score out of range returns error
  - Unauthenticated call returns error
- **Manual verification** for `EditableScorecard` UI behaviour (click-to-edit, Enter saves, Escape reverts, live +/- par, error display).
