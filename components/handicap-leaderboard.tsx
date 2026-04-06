import { PlayerHandicap } from '@/lib/types'

interface Props {
  handicaps: PlayerHandicap[]
}

export function HandicapLeaderboard({ handicaps }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        {new Date().getFullYear()} Handicaps
      </h2>
      <ul className="divide-y divide-slate-100">
        {handicaps.map((entry, i) => (
          <li key={entry.player.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <span className="text-sm font-medium text-slate-800">{entry.player.name}</span>
            </div>
            <span className={`text-sm font-bold ${entry.handicap !== null ? 'text-green-700' : 'text-slate-300'}`}>
              {entry.handicap !== null
                ? entry.handicap >= 0 ? `+${entry.handicap.toFixed(1)}` : `${entry.handicap.toFixed(1)}`
                : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
