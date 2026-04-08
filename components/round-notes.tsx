'use client'

import { useState } from 'react'
import { RoundNote } from '@/lib/types'
import { addNote } from '@/app/actions'

interface Props {
  roundId: string
  initialNotes: RoundNote[]
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RoundNotes({ roundId, initialNotes }: Props) {
  const [notes, setNotes] = useState<RoundNote[]>(initialNotes)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    const result = await addNote(roundId, trimmed)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.note) {
      setNotes(prev => [...prev, result.note!])
    }
    setText('')
    setAdding(false)
  }

  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</h2>

      {notes.length === 0 && !adding && (
        <p className="text-sm text-slate-400 mb-3">No notes yet.</p>
      )}

      {notes.length > 0 && (
        <ul className="space-y-3 mb-4">
          {notes.map(note => (
            <li key={note.id} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
              <p className="text-sm text-slate-800">{note.content}</p>
              <p className="text-xs text-slate-400 mt-1.5">
                {note.author?.name ?? 'Unknown'} · {formatTime(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setAdding(false); setText(''); setError('') }
            }}
            rows={3}
            placeholder="e.g. Johnnie had a hole in 1 on hole 3!"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
          />
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !text.trim()}
              className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Add Note'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setText(''); setError('') }}
              className="text-slate-400 hover:text-slate-600 text-sm px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-sm text-green-700 hover:underline focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none rounded"
        >
          + Add note
        </button>
      )}
    </div>
  )
}
