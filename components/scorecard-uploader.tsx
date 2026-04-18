'use client'

import { useRef, useState } from 'react'
import type { ParsedScorecard } from '@/app/api/parse-scorecard/route'

interface Props {
  onParsed: (data: ParsedScorecard) => void
}

export function ScorecardUploader({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setError('')
    setLoading(true)
    const form = new FormData()
    form.append('image', file)
    try {
      const res = await fetch('/api/parse-scorecard', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to parse scorecard')
      } else {
        onParsed(data as ParsedScorecard)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="mb-6">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors ${
          dragging ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        {loading ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Reading scorecard…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-2xl">📷</p>
            <p className="text-sm text-slate-600 font-medium">Upload a scorecard photo</p>
            <p className="text-xs text-slate-400">Drag and drop, or</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm text-green-700 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none rounded"
            >
              browse to select
            </button>
            <p className="text-xs text-slate-400">JPEG, PNG or WebP</p>
          </div>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
