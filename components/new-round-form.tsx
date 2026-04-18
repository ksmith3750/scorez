'use client'

import { useState } from 'react'
import { Course, Profile } from '@/lib/types'
import { CourseSelector } from './course-selector'
import { submitRound, addPlayer as addPlayerAction } from '@/app/actions'

export interface Prefill {
  courseName?: string
  date?: string
  holes?: 9 | 18
  par?: number
  scores?: { name: string; score: number }[]
}

interface Props {
  courses: Course[]
  players: Profile[]
  prefill?: Prefill
}

function matchScores(players: Profile[], prefillScores?: { name: string; score: number }[]): Record<string, string> {
  if (!prefillScores) return {}
  const result: Record<string, string> = {}
  for (const player of players) {
    const match = prefillScores.find(s =>
      s.name.toLowerCase().includes(player.name.toLowerCase()) ||
      player.name.toLowerCase().includes(s.name.toLowerCase())
    )
    if (match) result[player.id] = String(match.score)
  }
  return result
}

export function NewRoundForm({ courses, players: initialPlayers, prefill }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [holes, setHoles] = useState<9 | 18>(prefill?.holes ?? 18)
  const [par, setPar] = useState(prefill?.par != null ? String(prefill.par) : '')
  const [scores, setScores] = useState<Record<string, string>>(
    matchScores(initialPlayers, prefill?.scores)
  )

  // allKnownPlayers = every player we know about (DB + newly created this session)
  const [allKnownPlayers, setAllKnownPlayers] = useState<Profile[]>(initialPlayers)
  // activePlayerIds = which players are currently on the scorecard
  const [activePlayerIds, setActivePlayerIds] = useState<Set<string>>(
    new Set(initialPlayers.map(p => p.id))
  )

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

  function removePlayer(id: string) {
    setActivePlayerIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function addExistingPlayer(player: Profile) {
    setActivePlayerIds(prev => new Set([...prev, player.id]))
  }

  async function handleAddNewPlayer() {
    const name = newPlayerName.trim()
    if (!name) return
    setAddingPlayerLoading(true)
    setAddPlayerError('')
    try {
      const player = await addPlayerAction(name)
      setAllKnownPlayers(prev =>
        [...prev, player].sort((a, b) => a.name.localeCompare(b.name))
      )
      setActivePlayerIds(prev => new Set([...prev, player.id]))
      setNewPlayerName('')
    } catch (err) {
      setAddPlayerError(err instanceof Error ? err.message : 'Failed to add player')
    } finally {
      setAddingPlayerLoading(false)
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

  const activePlayers = allKnownPlayers.filter(p => activePlayerIds.has(p.id))
  const availableToAdd = allKnownPlayers.filter(p => !activePlayerIds.has(p.id))

  return (
    <form action={submitRound} className="space-y-6">
      <input type="hidden" name="course_id" value={selectedCourse?.id ?? ''} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
        <CourseSelector
          initialCourses={courses}
          selectedCourse={selectedCourse}
          onSelect={handleCourseSelect}
          initialSearch={prefill?.courseName ?? ''}
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          id="date"
          type="date"
          name="date"
          defaultValue={prefill?.date ?? new Date().toISOString().split('T')[0]}
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
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 w-20">
                  +/- Par
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activePlayers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-sm text-slate-400 text-center">
                    No players added yet
                  </td>
                </tr>
              )}
              {activePlayers.map(player => {
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
                    <td className="pr-2 text-center">
                      <button
                        type="button"
                        onClick={() => removePlayer(player.id)}
                        aria-label={`Remove ${player.name}`}
                        className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Add player section */}
          {addingPlayer ? (
            <div className="px-4 py-3 border-t border-slate-100 space-y-3">
              {/* Existing players not on the card */}
              {availableToAdd.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Select an existing player:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableToAdd.map(player => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => { addExistingPlayer(player); setAddingPlayer(false) }}
                        className="px-3 py-1 text-sm border border-slate-200 rounded-full hover:border-green-600 hover:text-green-700 transition-colors"
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New player input */}
              <div>
                {availableToAdd.length > 0 && (
                  <p className="text-xs text-slate-500 mb-2">Or add a new player:</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    autoFocus={availableToAdd.length === 0}
                    type="text"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddNewPlayer() }
                      if (e.key === 'Escape') { setAddingPlayer(false); setNewPlayerName(''); setAddPlayerError('') }
                    }}
                    placeholder="Player name"
                    className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewPlayer}
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
                  <p role="alert" className="text-xs text-red-600 mt-1">{addPlayerError}</p>
                )}
              </div>
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
