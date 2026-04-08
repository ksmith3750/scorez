import Link from 'next/link'
import { getRound } from '@/lib/db/rounds'
import { getRoundNotes } from '@/lib/db/notes'
import { RoundNotes } from '@/components/round-notes'

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function RoundDetailPage({ params }: Props) {
  const { id } = await params
  const [round, notes] = await Promise.all([getRound(id), getRoundNotes(id)])

  return (
    <div className="max-w-lg">
      <Link href="/rounds" className="text-sm text-green-700 hover:underline mb-4 inline-block">
        ← Back to History
      </Link>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">{round.course?.name ?? 'Unknown Course'}</h1>
        <p className="text-sm text-slate-500 mb-5">
          {formatDate(round.date)} · {round.holes} holes · Par {round.par}
        </p>
        <table className="w-full">
          <thead>
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="text-left pb-2">Player</th>
              <th className="text-right pb-2">Score</th>
              <th className="text-right pb-2">+/- Par</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[...round.scores]
              .sort((a, b) => a.score - b.score)
              .map(s => {
                const diff = s.score - round.par
                return (
                  <tr key={s.id}>
                    <td className="py-2.5 text-sm font-medium text-slate-800">{s.player?.name}</td>
                    <td className="py-2.5 text-sm text-right font-bold text-slate-800">{s.score}</td>
                    <td className="py-2.5 text-sm text-right text-slate-500">
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        <RoundNotes roundId={id} initialNotes={notes} />
      </div>
    </div>
  )
}
