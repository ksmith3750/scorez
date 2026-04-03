'use client'

import { useState } from 'react'
import { Course, Profile } from '@/lib/types'
import { CourseSelector } from './course-selector'
import { submitRound } from '@/app/actions'

interface Props {
  courses: Course[]
  players: Profile[]
}

export function NewRoundForm({ courses, players }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [holes, setHoles] = useState<9 | 18>(18)
  const [par, setPar] = useState('')

  function handleCourseSelect(course: Course | null) {
    setSelectedCourse(course)
    if (course) {
      const defaultPar = holes === 9 ? course.par_9 : course.par_18
      if (defaultPar !== null) setPar(String(defaultPar))
    }
  }

  function handleHolesChange(h: 9 | 18) {
    setHoles(h)
    if (selectedCourse) {
      const defaultPar = h === 9 ? selectedCourse.par_9 : selectedCourse.par_18
      if (defaultPar !== null) setPar(String(defaultPar))
    }
  }

  return (
    <form action={submitRound} className="space-y-6">
      <input type="hidden" name="course_id" value={selectedCourse?.id ?? ''} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
        <CourseSelector
          initialCourses={courses}
          selectedCourse={selectedCourse}
          onSelect={handleCourseSelect}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          required
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Holes</label>
          <select
            name="holes"
            value={holes}
            onChange={e => handleHolesChange(parseInt(e.target.value) as 9 | 18)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value={18}>18</option>
            <option value={9}>9</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Par</label>
          <input
            type="number"
            name="par"
            value={par}
            onChange={e => setPar(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="72"
            required
            min={1}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Scores <span className="font-normal text-slate-400">(leave blank if player didn't play)</span>
        </label>
        <div className="space-y-2">
          {players.map(player => (
            <div key={player.id} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-28 shrink-0">{player.name}</span>
              <input
                type="number"
                name={`score_${player.id}`}
                min={1}
                max={200}
                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!selectedCourse}
        className="bg-green-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Round
      </button>
    </form>
  )
}
