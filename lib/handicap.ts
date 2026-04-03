import { Profile, Round, RoundScore, PlayerHandicap } from './types'

export function calculateHandicaps(
  players: Profile[],
  rounds: Round[],
  scores: RoundScore[]
): PlayerHandicap[] {
  const currentYear = new Date().getFullYear()

  const currentYearRoundIds = new Set(
    rounds
      .filter(r => new Date(r.date).getFullYear() === currentYear)
      .map(r => r.id)
  )

  const parByRoundId = Object.fromEntries(rounds.map(r => [r.id, r.par]))

  const result: PlayerHandicap[] = players.map(player => {
    const playerScores = scores.filter(
      s => s.player_id === player.id && currentYearRoundIds.has(s.round_id)
    )

    if (playerScores.length === 0) {
      return { player, handicap: null, roundCount: 0 }
    }

    const total = playerScores.reduce(
      (sum, s) => sum + (s.score - parByRoundId[s.round_id]),
      0
    )
    const handicap = Math.round((total / playerScores.length) * 10) / 10

    return { player, handicap, roundCount: playerScores.length }
  })

  return result.sort((a, b) => {
    if (a.handicap === null && b.handicap === null) return 0
    if (a.handicap === null) return 1
    if (b.handicap === null) return -1
    return a.handicap - b.handicap
  })
}
