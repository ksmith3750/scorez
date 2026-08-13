# Delete Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a note's author to delete their own round notes via a `×` button on the Round Detail page.

**Architecture:** A new `deleteRoundNote` DB helper and `deleteNote` server action handle persistence; the existing `RoundNotes` client component gains a `currentPlayerId` prop (passed from the server-rendered page) to conditionally show the delete button and apply an optimistic remove with rollback on failure. An RLS migration enforces ownership at the DB level.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS), React client components, Jest

## Global Constraints

- Only the note's author can delete it — enforced both in the server action (playerId check) and via RLS
- No confirmation dialog — delete is immediate with optimistic UI and rollback on error
- Delete button: `×` character, right-aligned, `text-slate-300 hover:text-red-500 transition-colors`; only rendered when `note.created_by === currentPlayerId`
- Tests live under `__tests__/` mirroring source path
- Follow the existing pattern in `__tests__/app/actions.test.ts` (jest.mock at top, makeSupabase helper, beforeEach clearAllMocks)

---

### Task 1: DB helper + server action + tests + RLS migration

**Files:**
- Create: `supabase/migrations/20260812000001_round_notes_delete_policy.sql`
- Modify: `lib/db/notes.ts`
- Modify: `app/actions.ts`
- Modify: `__tests__/app/actions.test.ts`

**Interfaces:**
- Produces:
  - `deleteRoundNote(noteId: string, playerId: string): Promise<void>` — throws if 0 rows deleted
  - `deleteNote(noteId: string, roundId: string): Promise<{ error?: string }>` — returns `{}` on success, `{ error }` on failure; never throws

---

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `__tests__/app/actions.test.ts` with the following (preserves all existing `updateScore` tests and adds `deleteNote` tests):

```ts
// Must mock before importing the module under test — Jest hoists jest.mock() calls
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db/rounds', () => ({
  ...jest.requireActual('@/lib/db/rounds'),
  updateRoundScore: jest.fn(),
}))
jest.mock('@/lib/db/notes', () => ({
  ...jest.requireActual('@/lib/db/notes'),
  deleteRoundNote: jest.fn(),
}))
jest.mock('@/lib/db/players', () => ({
  ...jest.requireActual('@/lib/db/players'),
  getPlayerByUserId: jest.fn(),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { updateScore, deleteNote } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { updateRoundScore } from '@/lib/db/rounds'
import { deleteRoundNote } from '@/lib/db/notes'
import { getPlayerByUserId } from '@/lib/db/players'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUpdateRoundScore = updateRoundScore as jest.MockedFunction<typeof updateRoundScore>
const mockDeleteRoundNote = deleteRoundNote as jest.MockedFunction<typeof deleteRoundNote>
const mockGetPlayerByUserId = getPlayerByUserId as jest.MockedFunction<typeof getPlayerByUserId>

function makeSupabase(user: object | null) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  } as unknown as Awaited<ReturnType<typeof createClient>>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('updateScore', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const result = await updateScore('score-1', 85)
    expect(result).toEqual({ error: 'Not logged in' })
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('returns error when score is below 1', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    const result = await updateScore('score-1', 0)
    expect(result.error).toBeDefined()
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('returns error when score is above 200', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    const result = await updateScore('score-1', 201)
    expect(result.error).toBeDefined()
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('returns error when score is not an integer', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    const result = await updateScore('score-1', 85.5)
    expect(result.error).toBeDefined()
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('calls updateRoundScore and returns {} on valid input', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockUpdateRoundScore.mockResolvedValue(undefined)
    const result = await updateScore('score-1', 85)
    expect(mockUpdateRoundScore).toHaveBeenCalledWith('score-1', 85)
    expect(result).toEqual({})
  })

  it('returns error when updateRoundScore throws', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockUpdateRoundScore.mockRejectedValue(new Error('DB error'))
    const result = await updateScore('score-1', 85)
    expect(result.error).toBeDefined()
  })
})

describe('deleteNote', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const result = await deleteNote('note-1', 'round-1')
    expect(result).toEqual({ error: 'Not logged in' })
    expect(mockDeleteRoundNote).not.toHaveBeenCalled()
  })

  it('returns error when no player record found', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockGetPlayerByUserId.mockResolvedValue(null)
    const result = await deleteNote('note-1', 'round-1')
    expect(result).toEqual({ error: 'No player record found for your account' })
    expect(mockDeleteRoundNote).not.toHaveBeenCalled()
  })

  it('calls deleteRoundNote with noteId and playerId and returns {}', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockGetPlayerByUserId.mockResolvedValue({ id: 'player-1', name: 'Kirk' })
    mockDeleteRoundNote.mockResolvedValue(undefined)
    const result = await deleteNote('note-1', 'round-1')
    expect(mockDeleteRoundNote).toHaveBeenCalledWith('note-1', 'player-1')
    expect(result).toEqual({})
  })

  it('returns error when deleteRoundNote throws', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockGetPlayerByUserId.mockResolvedValue({ id: 'player-1', name: 'Kirk' })
    mockDeleteRoundNote.mockRejectedValue(new Error('note not found or not owned'))
    const result = await deleteNote('note-1', 'round-1')
    expect(result.error).toBeDefined()
    expect(mockDeleteRoundNote).toHaveBeenCalledWith('note-1', 'player-1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/app/actions.test.ts --no-coverage
```

Expected: FAIL — `deleteNote` is not exported from `@/app/actions`, `deleteRoundNote` is not exported from `@/lib/db/notes`

- [ ] **Step 3: Create the RLS migration**

Create `supabase/migrations/20260812000001_round_notes_delete_policy.sql`:

```sql
CREATE POLICY "Authors can delete their own notes"
  ON round_notes FOR DELETE TO authenticated
  USING (created_by IN (SELECT id FROM players WHERE user_id = auth.uid()));
```

- [ ] **Step 4: Add `deleteRoundNote` to `lib/db/notes.ts`**

Append after the `addRoundNote` function:

```ts
export async function deleteRoundNote(noteId: string, playerId: string): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('round_notes')
    .delete()
    .eq('id', noteId)
    .eq('created_by', playerId)
    .select('id')
  if (error) throw new Error(`deleteRoundNote: ${error.message}`)
  if (!data || data.length === 0) throw new Error('deleteRoundNote: note not found or not owned by player')
}
```

- [ ] **Step 5: Add `deleteNote` to `app/actions.ts`**

Update the existing `lib/db/notes` import line (currently `import { addRoundNote } from '@/lib/db/notes'`):

```ts
import { addRoundNote, deleteRoundNote } from '@/lib/db/notes'
```

Then append at the bottom of `app/actions.ts`:

```ts
export async function deleteNote(
  noteId: string,
  roundId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const player = await getPlayerByUserId(user.id)
  if (!player) return { error: 'No player record found for your account' }

  try {
    await deleteRoundNote(noteId, player.id)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete note' }
  }

  revalidatePath('/rounds')
  revalidatePath(`/rounds/${roundId}`)
  return {}
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx jest __tests__/app/actions.test.ts --no-coverage
```

Expected: PASS — all 10 tests passing (6 existing + 4 new)

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260812000001_round_notes_delete_policy.sql \
        lib/db/notes.ts \
        app/actions.ts \
        __tests__/app/actions.test.ts
git commit -m "feat: add deleteNote server action and deleteRoundNote DB helper"
```

---

### Task 2: Component + page wire-up

**Files:**
- Modify: `components/round-notes.tsx`
- Modify: `app/rounds/[id]/page.tsx`

**Interfaces:**
- Consumes from Task 1:
  - `deleteNote(noteId: string, roundId: string): Promise<{ error?: string }>` from `@/app/actions`
- Consumes from existing code:
  - `RoundNote` type from `@/lib/types`
  - `getPlayerByUserId(userId: string): Promise<Profile | null>` from `@/lib/db/players`
  - `createClient()` from `@/lib/supabase/server`
- Produces: `<RoundNotes roundId={string} initialNotes={RoundNote[]} currentPlayerId={string | undefined} />`

---

- [ ] **Step 1: Replace `components/round-notes.tsx` with the updated component**

```tsx
'use client'

import { useState } from 'react'
import { RoundNote } from '@/lib/types'
import { addNote, deleteNote } from '@/app/actions'

interface Props {
  roundId: string
  initialNotes: RoundNote[]
  currentPlayerId?: string
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RoundNotes({ roundId, initialNotes, currentPlayerId }: Props) {
  const [notes, setNotes] = useState<RoundNote[]>(initialNotes)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    const result = await addNote(roundId, trimmed)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.note) {
      setNotes(prev => [...prev, result.note!])
    }
    setText('')
    setAdding(false)
  }

  async function handleDelete(note: RoundNote) {
    const idx = notes.findIndex(n => n.id === note.id)
    setDeleting(prev => new Set(prev).add(note.id))
    setNotes(prev => prev.filter(n => n.id !== note.id))
    setDeleteError(null)

    try {
      const result = await deleteNote(note.id, roundId)
      if (result.error) {
        setNotes(prev => {
          const next = [...prev]
          next.splice(idx, 0, note)
          return next
        })
        setDeleteError(result.error)
      }
    } catch {
      setNotes(prev => {
        const next = [...prev]
        next.splice(idx, 0, note)
        return next
      })
      setDeleteError('Failed to delete — please try again')
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(note.id); return s })
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</h2>

      {notes.length === 0 && !adding && (
        <p className="text-sm text-slate-400 mb-3">No notes yet.</p>
      )}

      {notes.length > 0 && (
        <ul className="space-y-3 mb-4">
          {notes.map(note => (
            <li key={note.id} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-800">{note.content}</p>
                {currentPlayerId && note.created_by === currentPlayerId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    disabled={deleting.has(note.id)}
                    aria-label="Delete note"
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-50"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {note.author?.name ?? 'Unknown'} · {formatTime(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {deleteError && <p role="alert" className="text-xs text-red-600 mb-3">{deleteError}</p>}

      {adding ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setAdding(false); setText(''); setError('') }
            }}
            rows={3}
            placeholder="e.g. Johnnie had a hole in 1 on hole 3!"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
          />
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !text.trim()}
              className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Add Note'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setText(''); setError('') }}
              className="text-slate-400 hover:text-slate-600 text-sm px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-sm text-green-700 hover:underline focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none rounded"
        >
          + Add note
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace `app/rounds/[id]/page.tsx` with the updated page**

```tsx
import Link from 'next/link'
import { getRound } from '@/lib/db/rounds'
import { getRoundNotes } from '@/lib/db/notes'
import { getPlayerByUserId } from '@/lib/db/players'
import { createClient } from '@/lib/supabase/server'
import { RoundNotes } from '@/components/round-notes'
import { EditableScorecard } from '@/components/editable-scorecard'

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function RoundDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [round, notes, currentPlayer] = await Promise.all([
    getRound(id),
    getRoundNotes(id),
    user ? getPlayerByUserId(user.id) : Promise.resolve(null),
  ])

  return (
    <div className="max-w-lg">
      <Link href="/rounds" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        ← Back to History
      </Link>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">{round.course?.name ?? 'Unknown Course'}</h1>
        <p className="text-sm text-slate-500 mb-5">
          {formatDate(round.date)} · {round.holes} holes · Par {round.par}
        </p>
        <EditableScorecard scores={round.scores} par={round.par} />
        <RoundNotes roundId={id} initialNotes={notes} currentPlayerId={currentPlayer?.id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add components/round-notes.tsx "app/rounds/[id]/page.tsx"
git commit -m "feat: show delete button on own notes in RoundNotes"
```

---

### Post-implementation: apply the RLS migration

After deploying, run the migration in the Supabase dashboard SQL Editor:

```sql
CREATE POLICY "Authors can delete their own notes"
  ON round_notes FOR DELETE TO authenticated
  USING (created_by IN (SELECT id FROM players WHERE user_id = auth.uid()));
```

Or with the Supabase CLI if the project is linked:

```bash
supabase db push
```
