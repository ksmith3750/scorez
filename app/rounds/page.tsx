import { getRounds } from '@/lib/db/rounds'
import { RoundsList } from '@/components/rounds-list'
import { ExportButton } from '@/components/export-button'

export default async function RoundsPage() {
  const rounds = await getRounds()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Round History</h1>
        <ExportButton rounds={rounds} />
      </div>
      <RoundsList rounds={rounds} />
    </div>
  )
}
