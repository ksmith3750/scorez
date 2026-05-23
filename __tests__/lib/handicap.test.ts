import { calculateHandicaps } from '@/lib/handicap'
import { Profile, Round, RoundScore } from '@/lib/types'

const currentYear = new Date().getFullYear()

const players: Profile[] = [
  { id: 'p1', name: 'Kirk' },
  { id: 'p2', name: 'Dave' },
  { id: 'p3', name: 'Mike' },
]

const rounds: Round[] = [
  { id: 'r1', course_id: 'c1', date: `${currentYear}-03-01`, holes: 18, par: 72, created_by: 'p1', created_at: '' },
  { id: 'r2', course_id: 'c1', date: `${currentYear}-03-15`, holes: 18, par: 72, created_by: 'p1', created_at: '' },
  { id: 'r3', course_id: 'c1', date: `${currentYear - 1}-12-01`, holes: 18, par: 72, created_by: 'p1', created_at: '' },
]

const scores: RoundScore[] = [
  { id: 's1', round_id: 'r1', player_id: 'p1', score: 76 }, // Kirk +4
  { id: 's2', round_id: 'r1', player_id: 'p2', score: 81 }, // Dave +9
  { id: 's3', round_id: 'r2', player_id: 'p1', score: 74 }, // Kirk +2
  { id: 's4', round_id: 'r2', player_id: 'p2', score: 79 }, // Dave +7
  { id: 's5', round_id: 'r3', player_id: 'p1', score: 78 }, // Kirk last year — excluded
]

describe('calculateHandicaps', () => {
  it('averages (score - par) for current year rounds only', () => {
    const result = calculateHandicaps(players, rounds, scores)
    const kirk = result.find(h => h.player.id === 'p1')!
    // Kirk current year: (76-72) + (74-72) = 4+2 = 6, avg = 3
    expect(kirk.handicap).toBe(3)
    expect(kirk.roundCount).toBe(2)
  })

  it('excludes prior-year scores from the handicap calculation', () => {
    const result = calculateHandicaps(players, rounds, scores)
    const kirk = result.find(h => h.player.id === 'p1')!
    // If r3 (prior year, score 78, +6) were included: (4+2+6)/3 = 4.0
    // With r3 excluded: (4+2)/2 = 3.0
    expect(kirk.handicap).toBe(3) // not 4
  })

  it('returns null handicap for players with no current-year rounds', () => {
    const result = calculateHandicaps(players, rounds, scores)
    const mike = result.find(h => h.player.id === 'p3')!
    expect(mike.handicap).toBeNull()
    expect(mike.roundCount).toBe(0)
  })

  it('sorts players by handicap ascending, nulls last', () => {
    const result = calculateHandicaps(players, rounds, scores)
    expect(result[0].player.id).toBe('p1') // Kirk: 3
    expect(result[1].player.id).toBe('p2') // Dave: 8
    expect(result[2].player.id).toBe('p3') // Mike: null
  })

  it('returns empty array when no players provided', () => {
    const result = calculateHandicaps([], rounds, scores)
    expect(result).toEqual([])
  })

  it('returns null handicap for all players when no rounds provided', () => {
    const result = calculateHandicaps(players, [], [])
    expect(result.every(h => h.handicap === null && h.roundCount === 0)).toBe(true)
  })

  it('rounds handicap to 1 decimal place', () => {
    const oddRounds: Round[] = [
      { id: 'r4', course_id: 'c1', date: `${currentYear}-04-01`, holes: 9, par: 36, created_by: 'p3', created_at: '' },
      { id: 'r5', course_id: 'c1', date: `${currentYear}-04-08`, holes: 9, par: 36, created_by: 'p3', created_at: '' },
      { id: 'r6', course_id: 'c1', date: `${currentYear}-04-15`, holes: 9, par: 36, created_by: 'p3', created_at: '' },
    ]
    const oddScores: RoundScore[] = [
      { id: 'os1', round_id: 'r4', player_id: 'p3', score: 37 }, // +1
      { id: 'os2', round_id: 'r5', player_id: 'p3', score: 38 }, // +2
      { id: 'os3', round_id: 'r6', player_id: 'p3', score: 38 }, // +2
    ]
    const result = calculateHandicaps([players[2]], oddRounds, oddScores)
    // (1+2+2)/3 = 1.666... → rounded to 1 decimal = 1.7
    expect(result[0].handicap).toBe(1.7)
  })

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
})
