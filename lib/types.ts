export interface Profile {
  id: string
  name: string
}

export interface Course {
  id: string
  name: string
  par_9: number | null
  par_18: number | null
  created_by: string
  created_at: string
}

export interface Round {
  id: string
  course_id: string
  date: string        // ISO date string e.g. "2026-03-28"
  holes: 9 | 18
  par: number
  created_by: string
  created_at: string
  course?: Course
}

export interface RoundScore {
  id: string
  round_id: string
  player_id: string
  score: number
  player?: Profile
}

export interface RoundWithScores extends Round {
  scores: RoundScore[]
}

export interface PlayerHandicap {
  player: Profile
  handicap: number | null   // null = no rounds this year
  roundCount: number
}
