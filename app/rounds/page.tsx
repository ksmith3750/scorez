import { getRounds } from '@/lib/db/rounds'
import { RoundsList } from '@/components/rounds-list'

export default async function RoundsPage() {
  const rounds = await getRounds()

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Round History</h1>
      <RoundsList rounds={rounds} />
    </div>
  )
}
