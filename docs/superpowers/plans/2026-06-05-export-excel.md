# Export to Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Export to Excel" button to the Round History page that downloads all rounds as a two-tab `.xlsx` file.

**Architecture:** A pure `buildWorkbook()` utility in `lib/export.ts` transforms `RoundWithScores[]` into a SheetJS workbook. A `components/export-button.tsx` client component receives rounds as props from the existing server component, calls `buildWorkbook()`, and triggers the browser download via SheetJS `writeFile`.

**Tech Stack:** SheetJS (`xlsx` npm package), React 19, Next.js 16, TypeScript.

---

### Task 1: Install xlsx

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the xlsx package**

```bash
npm install xlsx
```

- [ ] **Step 2: Verify installation**

```bash
grep '"xlsx"' package.json
```

Expected output includes a line like `"xlsx": "^0.18.5"` (exact version may differ).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add xlsx dependency for Excel export"
```

---

### Task 2: Build the export utility with TDD

**Files:**
- Create: `lib/export.ts`
- Create: `__tests__/lib/export.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/export.test.ts`:

```typescript
import { utils } from 'xlsx'
import { buildWorkbook } from '@/lib/export'
import { RoundWithScores } from '@/lib/types'

const rounds: RoundWithScores[] = [
  {
    id: 'r1',
    course_id: 'c1',
    date: '2026-04-20',
    holes: 18,
    par: 72,
    created_by: 'p1',
    created_at: '',
    course: { id: 'c1', name: 'Pebble Beach', par_9: null, par_18: 72, created_by: 'p1', created_at: '' },
    scores: [
      { id: 's1', round_id: 'r1', player_id: 'p1', score: 84, player: { id: 'p1', name: 'Kirk' } },
      { id: 's2', round_id: 'r1', player_id: 'p2', score: 91, player: { id: 'p2', name: 'Jake' } },
    ],
    notes: [{ id: 'n1', round_id: 'r1', content: 'Great weather', created_by: 'p1', created_at: '' }],
  },
  {
    id: 'r2',
    course_id: 'c2',
    date: '2026-03-15',
    holes: 9,
    par: 36,
    created_by: 'p1',
    created_at: '',
    course: { id: 'c2', name: 'Augusta', par_9: 36, par_18: null, created_by: 'p1', created_at: '' },
    scores: [
      { id: 's3', round_id: 'r2', player_id: 'p1', score: 42, player: { id: 'p1', name: 'Kirk' } },
    ],
    notes: [],
  },
]

describe('buildWorkbook', () => {
  it('creates a workbook with Rounds and Scores sheets', () => {
    const wb = buildWorkbook(rounds)
    expect(wb.SheetNames).toEqual(['Rounds', 'Scores'])
  })

  it('Rounds sheet has frozen header row', () => {
    const wb = buildWorkbook(rounds)
    expect(wb.Sheets['Rounds']['!freeze']).toEqual({ xSplit: 0, ySplit: 1 })
  })

  it('Rounds sheet header contains Date, Course, Holes, Par, sorted player names, Notes', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Rounds'], { header: 1 })
    expect(rows[0]).toEqual(['Date', 'Course', 'Holes', 'Par', 'Jake', 'Kirk', 'Notes'])
  })

  it('Rounds sheet has one data row per round (newest first) plus header', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Rounds'], { header: 1 })
    expect(rows).toHaveLength(3)
  })

  it('Rounds sheet first data row has correct values', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Rounds'], { header: 1 })
    // r1 is newest: Jake=91, Kirk=84, notes joined
    expect(rows[1]).toEqual(['Apr 20, 2026', 'Pebble Beach', 18, 72, 91, 84, 'Great weather'])
  })

  it('Rounds sheet uses empty string for players who did not play a round', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Rounds'], { header: 1 })
    // r2: only Kirk played; Jake column blank; no notes
    expect(rows[2]).toEqual(['Mar 15, 2026', 'Augusta', 9, 36, '', 42, ''])
  })

  it('Rounds sheet joins multiple notes with " | "', () => {
    const multiNoteRound: RoundWithScores[] = [
      {
        id: 'r3', course_id: 'c1', date: '2026-05-01', holes: 18, par: 72,
        created_by: 'p1', created_at: '',
        course: { id: 'c1', name: 'Pebble Beach', par_9: null, par_18: 72, created_by: 'p1', created_at: '' },
        scores: [{ id: 's4', round_id: 'r3', player_id: 'p1', score: 80, player: { id: 'p1', name: 'Kirk' } }],
        notes: [
          { id: 'n2', round_id: 'r3', content: 'Windy', created_by: 'p1', created_at: '' },
          { id: 'n3', round_id: 'r3', content: 'Great pace', created_by: 'p1', created_at: '' },
        ],
      },
    ]
    const wb = buildWorkbook(multiNoteRound)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Rounds'], { header: 1 })
    expect(rows[1][rows[1].length - 1]).toBe('Windy | Great pace')
  })

  it('Scores sheet has frozen header row', () => {
    const wb = buildWorkbook(rounds)
    expect(wb.Sheets['Scores']['!freeze']).toEqual({ xSplit: 0, ySplit: 1 })
  })

  it('Scores sheet header is correct', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Scores'], { header: 1 })
    expect(rows[0]).toEqual(['Date', 'Course', 'Holes', 'Par', 'Player', 'Score', '+/- Par'])
  })

  it('Scores sheet has one row per player-round plus header', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Scores'], { header: 1 })
    // r1 has 2 players, r2 has 1 player → 3 data rows + 1 header
    expect(rows).toHaveLength(4)
  })

  it('Scores sheet calculates +/- par correctly', () => {
    const wb = buildWorkbook(rounds)
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['Scores'], { header: 1 }) as unknown[][]
    const kirkPebble = rows.slice(1).find(r => r[4] === 'Kirk' && r[1] === 'Pebble Beach')
    expect(kirkPebble).toEqual(['Apr 20, 2026', 'Pebble Beach', 18, 72, 'Kirk', 84, 12])
  })

  it('falls back to "Unknown Course" and "Unknown Player" for missing relations', () => {
    const noRelations: RoundWithScores[] = [
      {
        id: 'r4', course_id: 'c1', date: '2026-01-01', holes: 18, par: 72,
        created_by: 'p1', created_at: '',
        course: undefined,
        scores: [{ id: 's5', round_id: 'r4', player_id: 'p1', score: 80, player: undefined }],
        notes: [],
      },
    ]
    const wb = buildWorkbook(noRelations)
    const roundRows = utils.sheet_to_json<unknown[]>(wb.Sheets['Rounds'], { header: 1 })
    const scoreRows = utils.sheet_to_json<unknown[]>(wb.Sheets['Scores'], { header: 1 })
    expect(roundRows[1][1]).toBe('Unknown Course')
    expect(scoreRows[1][4]).toBe('Unknown Player')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/export.test.ts --no-coverage
```

Expected: All tests fail with `Cannot find module '@/lib/export'`.

- [ ] **Step 3: Write the implementation**

Create `lib/export.ts`:

```typescript
import { utils, WorkBook } from 'xlsx'
import { RoundWithScores } from '@/lib/types'

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function buildWorkbook(rounds: RoundWithScores[]): WorkBook {
  const wb = utils.book_new()

  const playerNames = Array.from(
    new Set(rounds.flatMap(r => r.scores.map(s => s.player?.name ?? 'Unknown Player')))
  ).sort()

  const roundsHeader = ['Date', 'Course', 'Holes', 'Par', ...playerNames, 'Notes']
  const roundsData = rounds.map(round => {
    const scoreMap = new Map(round.scores.map(s => [s.player?.name ?? 'Unknown Player', s.score]))
    const playerCells = playerNames.map(name => scoreMap.get(name) ?? '')
    const notes = round.notes.map(n => n.content).join(' | ')
    return [
      formatDate(round.date),
      round.course?.name ?? 'Unknown Course',
      round.holes,
      round.par,
      ...playerCells,
      notes,
    ]
  })
  const roundsWs = utils.aoa_to_sheet([roundsHeader, ...roundsData])
  roundsWs['!freeze'] = { xSplit: 0, ySplit: 1 }
  utils.book_append_sheet(wb, roundsWs, 'Rounds')

  const scoresHeader = ['Date', 'Course', 'Holes', 'Par', 'Player', 'Score', '+/- Par']
  const scoresData = rounds.flatMap(round =>
    round.scores.map(s => [
      formatDate(round.date),
      round.course?.name ?? 'Unknown Course',
      round.holes,
      round.par,
      s.player?.name ?? 'Unknown Player',
      s.score,
      s.score - round.par,
    ])
  )
  const scoresWs = utils.aoa_to_sheet([scoresHeader, ...scoresData])
  scoresWs['!freeze'] = { xSplit: 0, ySplit: 1 }
  utils.book_append_sheet(wb, scoresWs, 'Scores')

  return wb
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/export.test.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/export.ts __tests__/lib/export.test.ts
git commit -m "feat: add buildWorkbook utility for Excel export"
```

---

### Task 3: Build the ExportButton client component

**Files:**
- Create: `components/export-button.tsx`

- [ ] **Step 1: Create the component**

Create `components/export-button.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { writeFile } from 'xlsx'
import { buildWorkbook } from '@/lib/export'
import { RoundWithScores } from '@/lib/types'

interface Props {
  rounds: RoundWithScores[]
}

export function ExportButton({ rounds }: Props) {
  const [exporting, setExporting] = useState(false)

  if (rounds.length === 0) return null

  function handleExport() {
    setExporting(true)
    const wb = buildWorkbook(rounds)
    writeFile(wb, 'scorez-rounds.xlsx')
    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:border-slate-300 hover:shadow-sm transition-all disabled:opacity-50"
    >
      {exporting ? 'Exporting…' : 'Export to Excel'}
    </button>
  )
}
```

- [ ] **Step 2: Run the full test suite to make sure nothing broke**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/export-button.tsx
git commit -m "feat: add ExportButton client component"
```

---

### Task 4: Wire up the button on the Round History page

**Files:**
- Modify: `app/rounds/page.tsx`

- [ ] **Step 1: Update the page**

Replace the contents of `app/rounds/page.tsx` with:

```tsx
import { getRounds } from '@/lib/db/rounds'
import { RoundsList } from '@/components/rounds-list'
import { ExportButton } from '@/components/export-button'

export default async function RoundsPage() {
  const rounds = await getRounds()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Round History</h1>
        <ExportButton rounds={rounds} />
      </div>
      <RoundsList rounds={rounds} />
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 3: Build to confirm no TypeScript errors**

```bash
npx next build 2>&1 | tail -20
```

Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add app/rounds/page.tsx
git commit -m "feat: add Export to Excel button to Round History page"
```
