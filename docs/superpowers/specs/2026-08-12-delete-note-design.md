# Delete Note — Design Spec

**Date:** 2026-08-12

---

## Overview

Allow the author of a round note to delete it from the Round Detail page. A small `×` button appears on each note the current user wrote; clicking it removes the note immediately (optimistic delete) and calls a server action to persist the removal.

---

## Scope

- **In scope:** Deleting an existing note authored by the current logged-in user.
- **Out of scope:** Deleting other users' notes, editing notes, bulk delete.

---

## Architecture & Data Flow

The Round Detail page (`app/rounds/[id]/page.tsx`) is a server component. It already fetches the round and notes. It will also look up the current user's player ID server-side and pass it as `currentPlayerId` to `RoundNotes`. The component uses this to conditionally render the delete button — no client-side auth call required.

Flow for a single note delete:

1. User sees a `×` button on notes they authored.
2. Clicking `×` optimistically removes the note from local state.
3. `deleteNote(noteId, roundId)` server action is called.
   - On success: note stays removed, `revalidatePath` invalidates the page.
   - On failure: note is restored to the list, inline error shown.

---

## DB Layer

**`lib/db/notes.ts`** — new function:

```ts
deleteRoundNote(noteId: string, playerId: string): Promise<void>
```

Executes: `DELETE FROM round_notes WHERE id = $noteId AND created_by = $playerId`. If zero rows deleted, throws (note not found or player doesn't own it). No schema changes required.

---

## Server Action

**`app/actions.ts`** — new action:

```ts
deleteNote(noteId: string, roundId: string): Promise<{ error?: string }>
```

- Requires authenticated user; returns `{ error: 'Not logged in' }` if not.
- Looks up the player record for the logged-in user via `getPlayerByUserId(user.id)`; returns `{ error: 'No player record found' }` if missing.
- Calls `deleteRoundNote(noteId, player.id)`, catching errors and returning `{ error: '...' }`.
- On success: `revalidatePath('/rounds')` and `revalidatePath(`/rounds/${roundId}`)`, returns `{}`.

---

## RLS Migration

New migration `supabase/migrations/20260812000001_round_notes_delete_policy.sql`:

```sql
CREATE POLICY "Authors can delete their own notes"
  ON round_notes FOR DELETE TO authenticated
  USING (created_by IN (SELECT id FROM players WHERE user_id = auth.uid()));
```

This enforces ownership at the DB level independently of app logic.

---

## Component Changes

**`app/rounds/[id]/page.tsx`** — pass `currentPlayerId` to `RoundNotes`:

```tsx
import { getPlayerByUserId } from '@/lib/db/players'
// ...
const { data: { user } } = await supabase.auth.getUser()
const currentPlayer = user ? await getPlayerByUserId(user.id) : null
// ...
<RoundNotes roundId={id} initialNotes={notes} currentPlayerId={currentPlayer?.id} />
```

**`components/round-notes.tsx`** — updated props and delete UI:

```
New props:
  currentPlayerId?: string

New state:
  deleting: Set<string>   — IDs of notes currently being deleted (for per-note loading state)
  deleteError: string | null

Behaviour:
- Each note where note.created_by === currentPlayerId renders a × button
  (right-aligned, text-slate-300 hover:text-red-500 transition-colors)
- On click: add note.id to `deleting`, optimistically remove from `notes`
- Call deleteNote(note.id, roundId)
- On success: remove from `deleting`
- On error: restore note to its original position in the list, remove from `deleting`,
  set deleteError
- deleteError shown below the notes list (same style as add error)
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Delete succeeds | Note removed immediately and permanently |
| Server action fails (network / DB error) | Note restored to list; inline error shown |
| Note not owned by current user | Button not rendered client-side; server action double-checks and returns error |
| User not logged in | Server action returns `{ error: 'Not logged in' }` |

---

## Testing

- **Unit tests** (`app/actions.ts` — `deleteNote`):
  - Unauthenticated call returns error
  - No player record returns error
  - `deleteRoundNote` throwing returns error
  - Valid call succeeds and returns `{}`
- **Manual verification** for `RoundNotes` UI: delete button visible only on own notes, optimistic remove, error restore.
