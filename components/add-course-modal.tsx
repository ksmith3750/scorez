'use client'

import { useState, useEffect } from 'react'
import { Course } from '@/lib/types'
import { createCourse } from '@/app/actions'

interface Props {
  onClose: () => void
  onAdded: (course: Course) => void
}

export function AddCourseModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState('')
  const [par9, setPar9] = useState('')
  const [par18, setPar18] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fix 1 — Escape key closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    // Fix 4 — loading reset on success path via finally
    // Fix 5 — parseInt with radix
    try {
      const course = await createCourse(
        name.trim(),
        par9 ? parseInt(par9, 10) : null,
        par18 ? parseInt(par18, 10) : null
      )
      onAdded(course)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Fix 1 — backdrop click closes modal
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Fix 1 — stop propagation; Fix 2 — role, aria-modal, aria-labelledby */}
      <div
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-course-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Fix 2 — id on h2 */}
        <h2 id="add-course-title" className="font-semibold text-slate-900 mb-4">Add New Course</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="e.g. Pebble Beach"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Par (9 holes)</label>
              <input
                type="number"
                value={par9}
                onChange={e => setPar9(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="e.g. 36"
                min={1}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Par (18 holes)</label>
              <input
                type="number"
                value={par18}
                onChange={e => setPar18(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="e.g. 72"
                min={1}
              />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding…' : 'Add Course'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
