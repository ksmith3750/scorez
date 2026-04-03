import Link from 'next/link'
import { RoundWithScores } from '@/lib/types'

interface Props {
  rounds: RoundWithScores[]
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RoundsList({ rounds }: Props) {
  if (rounds.length === 0) {
    return <p className="text-slate-500 text-sm">No rounds recorded yet.</p>
  }

  return (
    <ul className="space-y-3">
      {rounds.map(round => (
        <li key={round.id}>
          <Link
            href={`/rounds/${round.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-800">{round.course?.name}</span>
              <span className="text-sm text-slate-400">{formatDate(round.date)}</span>
            </div>
            <div className="text-sm text-slate-500 mb-2">{round.holes} holes · Par {round.par}</div>
            <div className="flex gap-4 flex-wrap">
              {round.scores
                .sort((a, b) => a.score - b.score)
                .map(s => (
                  <span key={s.id} className="text-sm text-slate-600">
                    {s.player?.name} <strong className="text-slate-800">{s.score}</strong>
                  </span>
                ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
