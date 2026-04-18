'use client'

import { useState, useRef, useEffect } from 'react'
import { Course } from '@/lib/types'
import { AddCourseModal } from './add-course-modal'

interface Props {
  initialCourses: Course[]
  selectedCourse: Course | null
  onSelect: (course: Course | null) => void
  initialSearch?: string
}

export function CourseSelector({ initialCourses, selectedCourse, onSelect, initialSearch }: Props) {
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState(initialSearch ?? selectedCourse?.name ?? '')
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // Fix 10 — ref to "+ Add new course" button for focus restoration
  const addCourseButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(course: Course) {
    onSelect(course)
    setSearch(course.name)
    setOpen(false)
  }

  // Fix 6 — only call onSelect(null) when typed value doesn't match current selection
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearch(val)
    setOpen(true)
    if (selectedCourse && val !== selectedCourse.name) {
      onSelect(null)
    }
  }

  function handleCourseAdded(course: Course) {
    setCourses(prev =>
      [...prev, course].sort((a, b) => a.name.localeCompare(b.name))
    )
    handleSelect(course)
    setShowModal(false)
    // Fix 10 — restore focus to the trigger button after modal closes
    setTimeout(() => addCourseButtonRef.current?.focus(), 0)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        onFocus={() => setOpen(true)}
        placeholder="Search courses…"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border border-slate-200 rounded-lg mt-1 w-full shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(course => (
            <li
              key={course.id}
              onMouseDown={() => handleSelect(course)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
            >
              {course.name}
            </li>
          ))}
        </ul>
      )}
      {/* Fix 7 — "No courses found" empty state */}
      {open && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <p role="status" className="text-sm text-slate-400">No courses found</p>
        </div>
      )}
      {/* Fix 8 — empty initialCourses guidance */}
      {courses.length === 0 && (
        <p className="text-xs text-slate-400 mt-1">No courses yet — use &quot;+ Add new course&quot; below to add one.</p>
      )}
      {/* Fix 9 — focus ring; Fix 10 — ref */}
      <button
        ref={addCourseButtonRef}
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-1 text-sm text-green-700 hover:underline focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none rounded"
      >
        + Add new course
      </button>
      {showModal && (
        <AddCourseModal
          onClose={() => setShowModal(false)}
          onAdded={handleCourseAdded}
        />
      )}
    </div>
  )
}
