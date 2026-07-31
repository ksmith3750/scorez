'use client'

import { useState } from 'react'
import { updateScore } from '@/app/actions'
import type { RoundScore } from '@/lib/types'

interface Props {
  scores: RoundScore[]
  par: number
}

export function EditableScorecard({ scores, par }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [localScores, setLocalScores] = useState<Record<string, number>>(
    Object.fromEntries(scores.map(s => [s.id, s.score]))
  )

  function startEdit(id: string, currentScore: number) {
    setEditingId(id)
    setDraftValue(String(currentScore))
    setError(null)
  }

  async function commitEdit(id: string, originalScore: number, roundId: string) {
    const parsed = parseInt(draftValue, 10)
    setEditingId(null)
    setDraftValue('')

    if (isNaN(parsed) || parsed === originalScore) return

    if (parsed < 1 || parsed > 200) {
      setError('Score must be between 1 and 200')
      return
    }

    setLocalScores(prev => ({ ...prev, [id]: parsed }))

    try {
      const result = await updateScore(id, parsed, roundId)
      if (result.error) {
        setLocalScores(prev => ({ ...prev, [id]: originalScore }))
        setError(result.error)
      }
    } catch {
      setLocalScores(prev => ({ ...prev, [id]: originalScore }))
      setError('Failed to save — please try again')
    }
  }

  const sortedScores = [...scores].sort(
    (a, b) => (localScores[a.id] ?? a.score) - (localScores[b.id] ?? b.score)
  )

  return (
    <>
      <table className="w-full">
        <thead>
          <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <th className="text-left pb-2">Player</th>
            <th className="text-right pb-2">Score</th>
            <th className="text-right pb-2">+/- Par</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sortedScores.map(s => {
            const currentScore = localScores[s.id] ?? s.score
            const isEditing = editingId === s.id
            const displayScore = isEditing
              ? (parseInt(draftValue, 10) || currentScore)
              : currentScore
            const diff = displayScore - par

            return (
              <tr key={s.id}>
                <td className="py-2.5 text-sm font-medium text-slate-800">
                  {s.player?.name}
                </td>
                <td className="py-2.5 text-sm text-right font-bold text-slate-800">
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={draftValue}
                      autoFocus
                      onChange={e => setDraftValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(s.id, currentScore, s.round_id)
                        if (e.key === 'Escape') { setEditingId(null); setDraftValue(''); setError(null) }
                      }}
                      onBlur={() => commitEdit(s.id, currentScore, s.round_id)}
                      className="w-16 text-right border border-slate-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(s.id, currentScore)}
                      aria-label={`Edit score for ${s.player?.name}`}
                      className="tabular-nums hover:text-green-700 cursor-pointer"
                    >
                      {currentScore}
                    </button>
                  )}
                </td>
                <td className="py-2.5 text-sm text-right text-slate-500">
                  {diff > 0 ? `+${diff}` : diff}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </>
  )
}
