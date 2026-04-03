'use client'

import { useState } from 'react'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    try {
      const course = await createCourse(
        name.trim(),
        par9 ? parseInt(par9) : null,
        par18 ? parseInt(par18) : null
      )
      onAdded(course)
    } catch {
      setError('Failed to add course. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold text-slate-900 mb-4">Add New Course</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="e.g. Pebble Beach"
              required
              autoFocus
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
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding…' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
