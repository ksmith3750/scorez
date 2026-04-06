import Link from 'next/link'
import { RoundWithScores } from '@/lib/types'

interface Props {
  rounds: RoundWithScores[]
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function RecentRounds({ rounds }: Props) {
  if (rounds.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Rounds</h2>
        <p className="text-sm text-slate-400">No rounds yet — record your first one!</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Rounds</h2>
        <Link href="/rounds" className="text-sm text-green-700 hover:underline">View all →</Link>
      </div>
      <ul className="space-y-3">
        {rounds.map(round => (
          <li key={round.id}>
            <Link
              href={`/rounds/${round.id}`}
              className="block border border-slate-100 rounded-lg p-3 hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-slate-800">{round.course?.name}</span>
                <span className="text-xs text-slate-400">{formatDate(round.date)}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{round.holes} holes · Par {round.par}</div>
              <div className="flex gap-3 flex-wrap">
                {round.scores.map(s => (
                  <span key={s.id} className="text-xs text-slate-600">
                    {s.player?.name} <strong className="text-slate-800">{s.score}</strong>
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
