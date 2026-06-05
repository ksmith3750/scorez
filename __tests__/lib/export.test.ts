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
