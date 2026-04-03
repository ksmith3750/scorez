import { createClient } from '@/lib/supabase/server'
import { RoundWithScores } from '@/lib/types'

export async function getRounds(): Promise<RoundWithScores[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rounds')
    .select(`
      *,
      course:courses(id, name, par_9, par_18),
      scores:round_scores(
        id, round_id, player_id, score,
        player:profiles(id, name)
      )
    `)
    .order('date', { ascending: false })
  if (error) throw new Error(`getRounds: ${error.message}`)
  return data
}

export async function getRound(id: string): Promise<RoundWithScores> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rounds')
    .select(`
      *,
      course:courses(id, name, par_9, par_18),
      scores:round_scores(
        id, round_id, player_id, score,
        player:profiles(id, name)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw new Error(`getRound: ${error.message}`)
  return data
}

export async function createRound(
  courseId: string,
  date: string,
  holes: 9 | 18,
  par: number,
  createdBy: string,
  scores: { playerId: string; score: number }[]
): Promise<string> {
  const supabase = await createClient()

  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ course_id: courseId, date, holes, par, created_by: createdBy })
    .select('id')
    .single()
  if (roundError) throw new Error(`createRound: ${roundError.message}`)

  if (scores.length > 0) {
    const scoreRows = scores.map(s => ({
      round_id: round.id,
      player_id: s.playerId,
      score: s.score,
    }))
    const { error: scoresError } = await supabase
      .from('round_scores')
      .insert(scoreRows)
    if (scoresError) throw new Error(`createRound scores: ${scoresError.message}`)
  }

  return round.id
}
