'use client'

import { useState } from 'react'
import { Course, Profile } from '@/lib/types'
import { CourseSelector } from './course-selector'
import { submitRound, addPlayer as addPlayerAction } from '@/app/actions'

interface Props {
  courses: Course[]
  players: Profile[]
}

export function NewRoundForm({ courses, players: initialPlayers }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [holes, setHoles] = useState<9 | 18>(18)
  const [par, setPar] = useState('')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [playerList, setPlayerList] = useState<Profile[]>(initialPlayers)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [addPlayerError, setAddPlayerError] = useState('')
  const [addingPlayerLoading, setAddingPlayerLoading] = useState(false)

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

  const parNum = parseInt(par, 10)

  function calcDiff(scoreStr: string): number | null {
    const s = parseInt(scoreStr, 10)
    if (isNaN(s) || isNaN(parNum) || parNum < 1) return null
    return s - parNum
  }

  function formatDiff(d: number | null): string {
    if (d === null) return '—'
    if (d === 0) return 'E'
    return d > 0 ? `+${d}` : `${d}`
  }

  async function handleAddPlayer() {
    const name = newPlayerName.trim()
    if (!name) return
    setAddingPlayerLoading(true)
    setAddPlayerError('')
    try {
      const player = await addPlayerAction(name)
      setPlayerList(prev =>
        [...prev, player].sort((a, b) => a.name.localeCompare(b.name))
      )
      setAddingPlayer(false)
      setNewPlayerName('')
    } catch (err) {
      setAddPlayerError(err instanceof Error ? err.message : 'Failed to add player')
    } finally {
      setAddingPlayerLoading(false)
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
        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          id="date"
          type="date"
          name="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          required
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="holes" className="block text-sm font-medium text-slate-700 mb-1">Holes</label>
          <select
            id="holes"
            name="holes"
            value={holes}
            onChange={e => handleHolesChange(parseInt(e.target.value, 10) as 9 | 18)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value={18}>18</option>
            <option value={9}>9</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="par" className="block text-sm font-medium text-slate-700 mb-1">Par</label>
          <input
            id="par"
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
        <h3 className="text-sm font-medium text-slate-700 mb-2">Scores</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                  Player
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-28">
                  Score
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-24">
                  +/- Par
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {playerList.map(player => {
                const scoreStr = scores[player.id] ?? ''
                const d = calcDiff(scoreStr)
                return (
                  <tr key={player.id}>
                    <td className="px-4 py-3 text-sm text-slate-800">{player.name}</td>
                    <td className="px-3 py-2 w-28">
                      <input
                        type="number"
                        name={`score_${player.id}`}
                        value={scoreStr}
                        onChange={e =>
                          setScores(prev => ({ ...prev, [player.id]: e.target.value }))
                        }
                        min={1}
                        max={200}
                        className="w-full text-right border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                        placeholder="—"
                      />
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium tabular-nums ${
                        d === null
                          ? 'text-slate-300'
                          : d < 0
                          ? 'text-green-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {formatDiff(d)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {addingPlayer ? (
            <div className="px-4 py-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddPlayer() }
                    if (e.key === 'Escape') { setAddingPlayer(false); setNewPlayerName('') }
                  }}
                  placeholder="Player name"
                  className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  disabled={addingPlayerLoading || !newPlayerName.trim()}
                  className="bg-green-700 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                >
                  {addingPlayerLoading ? 'Adding…' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingPlayer(false); setNewPlayerName(''); setAddPlayerError('') }}
                  className="text-slate-400 hover:text-slate-600 text-sm px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
              {addPlayerError && (
                <p role="alert" className="text-xs text-red-600">{addPlayerError}</p>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddingPlayer(true)}
                className="text-sm text-green-700 hover:underline focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none rounded"
              >
                + Add player
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">Leave score blank for players who didn&apos;t play</p>
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
