import Link from 'next/link'
import { getRound } from '@/lib/db/rounds'
import { getRoundNotes } from '@/lib/db/notes'
import { getPlayerByUserId } from '@/lib/db/players'
import { createClient } from '@/lib/supabase/server'
import { RoundNotes } from '@/components/round-notes'
import { EditableScorecard } from '@/components/editable-scorecard'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [round, notes, currentPlayer] = await Promise.all([
    getRound(id),
    getRoundNotes(id),
    user ? getPlayerByUserId(user.id) : Promise.resolve(null),
  ])

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
        <EditableScorecard scores={round.scores} par={round.par} />
        <RoundNotes roundId={id} initialNotes={notes} currentPlayerId={currentPlayer?.id} />
      </div>
    </div>
  )
}
