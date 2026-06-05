'use client'

import { useState } from 'react'
import { writeFile } from 'xlsx'
import { buildWorkbook } from '@/lib/export'
import { RoundWithScores } from '@/lib/types'

interface Props {
  rounds: RoundWithScores[]
}

export function ExportButton({ rounds }: Props) {
  const [exporting, setExporting] = useState(false)

  if (rounds.length === 0) return null

  function handleExport() {
    setExporting(true)
    const wb = buildWorkbook(rounds)
    writeFile(wb, 'scorez-rounds.xlsx')
    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:border-slate-300 hover:shadow-sm transition-all disabled:opacity-50"
    >
      {exporting ? 'Exporting…' : 'Export to Excel'}
    </button>
  )
}
