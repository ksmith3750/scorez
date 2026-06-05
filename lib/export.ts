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
