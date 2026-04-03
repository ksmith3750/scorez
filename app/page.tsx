import Link from 'next/link'
import { getPlayers } from '@/lib/db/players'
import { getRounds } from '@/lib/db/rounds'
import { calculateHandicaps } from '@/lib/handicap'
import { HandicapLeaderboard } from '@/components/handicap-leaderboard'
import { RecentRounds } from '@/components/recent-rounds'

export default async function DashboardPage() {
  const [players, rounds] = await Promise.all([getPlayers(), getRounds()])
  const allScores = rounds.flatMap(r => r.scores)
  const handicaps = calculateHandicaps(players, rounds, allScores)
  const recentRounds = rounds.slice(0, 3)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/rounds/new"
          className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
        >
          + Record New Round
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-5">
        <HandicapLeaderboard handicaps={handicaps} />
        <RecentRounds rounds={recentRounds} />
      </div>
    </div>
  )
}
