'use client'

import { useState } from 'react'
import { Course, Profile } from '@/lib/types'
import { ScorecardUploader } from './scorecard-uploader'
import { NewRoundForm, Prefill } from './new-round-form'
import type { ParsedScorecard } from '@/app/api/parse-scorecard/route'

interface Props {
  courses: Course[]
  players: Profile[]
}

export function NewRoundPageClient({ courses, players }: Props) {
  const [prefill, setPrefill] = useState<Prefill | undefined>(undefined)

  function handleParsed(data: ParsedScorecard) {
    setPrefill({
      courseName: data.courseName ?? undefined,
      date: data.date ?? undefined,
      holes: data.holes ?? undefined,
      par: data.par ?? undefined,
      scores: data.players,
    })
  }

  return (
    <>
      <ScorecardUploader onParsed={handleParsed} />
      {prefill && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Scorecard parsed — review and save below.
        </div>
      )}
      <NewRoundForm courses={courses} players={players} prefill={prefill} />
    </>
  )
}
