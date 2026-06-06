'use client'

import { useState } from 'react'
import { RoundWithScores } from '@/lib/types'

interface Props {
  rounds: RoundWithScores[]
}

export function ExportButton({ rounds }: Props) {
  const [error, setError] = useState<string | null>(null)

  if (rounds.length === 0) return null

  async function handleExport() {
    setError(null)
    try {
      const [{ buildWorkbook }, { writeFile }] = await Promise.all([
        import('@/lib/export'),
        import('xlsx'),
      ])
      const wb = buildWorkbook(rounds)
      writeFile(wb, 'scorez-rounds.xlsx')
    } catch {
      setError('Export failed. Please try again.')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:border-slate-300 hover:shadow-sm transition-all"
      >
        Export to Excel
      </button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
