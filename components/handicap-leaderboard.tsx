'use client'

import { useState } from 'react'
import { PlayerHandicap } from '@/lib/types'
import { updateAnyPlayerName } from '@/app/actions'

interface Props {
  handicaps: PlayerHandicap[]
}

function formatHandicap(h: number | null): string {
  if (h === null) return '—'
  return h >= 0 ? `+${h.toFixed(1)}` : h.toFixed(1)
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

export function HandicapLeaderboard({ handicaps: initialHandicaps }: Props) {
  const [handicaps, setHandicaps] = useState(initialHandicaps)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function startEdit(id: string, currentName: string) {
    setEditingId(id)
    setEditName(currentName)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setError('')
  }

  async function saveEdit(playerId: string) {
    const trimmed = editName.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    const result = await updateAnyPlayerName(playerId, trimmed)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setHandicaps(prev =>
      prev.map(entry =>
        entry.player.id === playerId
          ? { ...entry, player: { ...entry.player, name: trimmed } }
          : entry
      )
    )
    setEditingId(null)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        {new Date().getFullYear()} Handicaps
      </h2>
      <ul className="divide-y divide-slate-100">
        {handicaps.map((entry, i) => (
          <li key={entry.player.id} className="py-2.5">
            {editingId === entry.player.id ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(entry.player.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(entry.player.id)}
                    disabled={saving || !editName.trim()}
                    className="text-xs bg-green-700 text-white rounded px-2 py-1 hover:bg-green-800 disabled:opacity-50"
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1 py-1"
                  >
                    Cancel
                  </button>
                </div>
                {error && <p className="text-xs text-red-600 pl-8">{error}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800 truncate">{entry.player.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(entry.player.id, entry.player.name)}
                    aria-label={`Edit name for ${entry.player.name}`}
                    className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <span className={`text-sm font-bold shrink-0 ${entry.handicap !== null ? 'text-green-700' : 'text-slate-300'}`}>
                  {formatHandicap(entry.handicap)}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
