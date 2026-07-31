# Edit Score in a Round — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow any logged-in user to click a score on the Round Detail page to edit it inline, saving on Enter or blur.

**Architecture:** Extract the scorecard table from the server-rendered Round Detail page into a new `EditableScorecard` client component. A new `updateScore` server action validates and persists the change via a new `updateRoundScore` DB helper. Local state tracks optimistic updates and reverts on failure.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL), React client components, Jest + Testing Library

## Global Constraints

- Score must be a whole integer between 1 and 200 (same range as new-round form)
- Any logged-in user can edit any score (same permission model as creating rounds)
- No schema changes — `round_scores` table already has `id`, `score` columns
- Styling must match existing inputs in `components/new-round-form.tsx` (border-slate-200, rounded, focus:ring-green-600)
- Tests live under `__tests__/` mirroring the source path

---

### Task 1: DB helper + server action + tests

**Files:**
- Modify: `lib/db/rounds.ts`
- Modify: `app/actions.ts`
- Create: `__tests__/app/actions.test.ts`

**Interfaces:**
- Produces:
  - `updateRoundScore(scoreId: string, score: number): Promise<void>` — throws on DB error
  - `updateScore(scoreId: string, score: number): Promise<{ error?: string }>` — returns `{}` on success, `{ error }` on failure; never throws

---

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/actions.test.ts`:

```ts
// Must mock before importing the module under test — Jest hoists jest.mock() calls
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db/rounds', () => ({
  ...jest.requireActual('@/lib/db/rounds'),
  updateRoundScore: jest.fn(),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { updateScore } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { updateRoundScore } from '@/lib/db/rounds'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUpdateRoundScore = updateRoundScore as jest.MockedFunction<typeof updateRoundScore>

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/app/actions.test.ts --no-coverage
```

Expected: FAIL — `updateScore` is not exported from `@/app/actions`

- [ ] **Step 3: Add `updateRoundScore` to `lib/db/rounds.ts`**

Append after the `createRound` function:

```ts
export async function updateRoundScore(scoreId: string, score: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('round_scores')
    .update({ score })
    .eq('id', scoreId)
  if (error) throw new Error(`updateRoundScore: ${error.message}`)
}
```

- [ ] **Step 4: Add `updateScore` to `app/actions.ts`**

Add the import at the top (update the existing `lib/db/rounds` import line):

```ts
import { createRound, updateRoundScore } from '@/lib/db/rounds'
```

Then append at the bottom of `app/actions.ts`:

```ts
export async function updateScore(
  scoreId: string,
  score: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!Number.isInteger(score) || score < 1 || score > 200) {
    return { error: 'Score must be a whole number between 1 and 200' }
  }

  try {
    await updateRoundScore(scoreId, score)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save score' }
  }

  revalidatePath('/')
  revalidatePath('/rounds')
  return {}
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/app/actions.test.ts --no-coverage
```

Expected: PASS — 6 tests passing

- [ ] **Step 6: Commit**

```bash
git add lib/db/rounds.ts app/actions.ts __tests__/app/actions.test.ts
git commit -m "feat: add updateScore server action and updateRoundScore DB helper"
```

---

### Task 2: EditableScorecard component + wire up Round Detail page

**Files:**
- Create: `components/editable-scorecard.tsx`
- Modify: `app/rounds/[id]/page.tsx`

**Interfaces:**
- Consumes from Task 1:
  - `updateScore(scoreId: string, score: number): Promise<{ error?: string }>` from `@/app/actions`
- Consumes from existing code:
  - `RoundScore` type from `@/lib/types`
- Produces: `<EditableScorecard scores={RoundScore[]} par={number} />` for use in page

---

- [ ] **Step 1: Create `components/editable-scorecard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { updateScore } from '@/app/actions'
import type { RoundScore } from '@/lib/types'

interface Props {
  scores: RoundScore[]
  par: number
}

export function EditableScorecard({ scores, par }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [localScores, setLocalScores] = useState<Record<string, number>>(
    Object.fromEntries(scores.map(s => [s.id, s.score]))
  )

  function startEdit(id: string, currentScore: number) {
    setEditingId(id)
    setDraftValue(String(currentScore))
    setError(null)
  }

  async function commitEdit(id: string, originalScore: number) {
    const parsed = parseInt(draftValue, 10)
    setEditingId(null)
    setDraftValue('')

    if (isNaN(parsed) || parsed === originalScore) return

    setLocalScores(prev => ({ ...prev, [id]: parsed }))

    const result = await updateScore(id, parsed)
    if (result.error) {
      setLocalScores(prev => ({ ...prev, [id]: originalScore }))
      setError(result.error)
    }
  }

  const sortedScores = [...scores].sort(
    (a, b) => (localScores[a.id] ?? a.score) - (localScores[b.id] ?? b.score)
  )

  return (
    <>
      <table className="w-full">
        <thead>
          <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <th className="text-left pb-2">Player</th>
            <th className="text-right pb-2">Score</th>
            <th className="text-right pb-2">+/- Par</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sortedScores.map(s => {
            const currentScore = localScores[s.id] ?? s.score
            const isEditing = editingId === s.id
            const displayScore = isEditing
              ? (parseInt(draftValue, 10) || currentScore)
              : currentScore
            const diff = displayScore - par

            return (
              <tr key={s.id}>
                <td className="py-2.5 text-sm font-medium text-slate-800">
                  {s.player?.name}
                </td>
                <td className="py-2.5 text-sm text-right font-bold text-slate-800">
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={draftValue}
                      autoFocus
                      onChange={e => setDraftValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(s.id, currentScore)
                        if (e.key === 'Escape') { setEditingId(null); setDraftValue('') }
                      }}
                      onBlur={() => commitEdit(s.id, currentScore)}
                      className="w-16 text-right border border-slate-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(s.id, currentScore)}
                      title="Click to edit"
                      className="tabular-nums hover:text-green-700 cursor-pointer"
                    >
                      {currentScore}
                    </button>
                  )}
                </td>
                <td className="py-2.5 text-sm text-right text-slate-500">
                  {diff > 0 ? `+${diff}` : diff}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </>
  )
}
```

- [ ] **Step 2: Replace the inline scorecard table in `app/rounds/[id]/page.tsx`**

The current file renders a `<table>` inline. Replace the import section and that table block.

Add import at the top of the file (after the existing imports):

```ts
import { EditableScorecard } from '@/components/editable-scorecard'
```

Replace the entire `<table>…</table>` block (lines 32–56 in the current file) with:

```tsx
<EditableScorecard scores={round.scores} par={round.par} />
```

The final `app/rounds/[id]/page.tsx` should look like:

```tsx
import Link from 'next/link'
import { getRound } from '@/lib/db/rounds'
import { getRoundNotes } from '@/lib/db/notes'
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
  const [round, notes] = await Promise.all([getRound(id), getRoundNotes(id)])

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
        <RoundNotes roundId={id} initialNotes={notes} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass (existing tests unchanged, new actions tests pass)

- [ ] **Step 4: Manually verify in the browser**

Start the dev server:

```bash
npm run dev
```

Navigate to any round detail page (e.g. `http://localhost:3000/rounds/<id>`).

Verify:
1. Score values are clickable (cursor changes, value turns green on hover)
2. Clicking a score renders a focused number input with the current value
3. Changing the value and pressing Enter saves it — the row reverts to read mode with the new score
4. Pressing Escape reverts the input without saving
5. The +/- par column updates live as you type in the input
6. Navigating away and back shows the updated score (confirming DB persistence)

- [ ] **Step 5: Commit**

```bash
git add components/editable-scorecard.tsx app/rounds/[id]/page.tsx
git commit -m "feat: inline score editing on Round Detail page"
```
