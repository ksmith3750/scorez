'use client'

import { useState, useRef, useEffect } from 'react'
import { Course } from '@/lib/types'
import { AddCourseModal } from './add-course-modal'

interface Props {
  initialCourses: Course[]
  selectedCourse: Course | null
  onSelect: (course: Course | null) => void
}

export function CourseSelector({ initialCourses, selectedCourse, onSelect }: Props) {
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState(selectedCourse?.name ?? '')
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(course: Course) {
    onSelect(course)
    setSearch(course.name)
    setOpen(false)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    onSelect(null)
    setOpen(true)
  }

  function handleCourseAdded(course: Course) {
    setCourses(prev =>
      [...prev, course].sort((a, b) => a.name.localeCompare(b.name))
    )
    handleSelect(course)
    setShowModal(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={e => handleSearchChange(e.target.value)}
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
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-1 text-sm text-green-700 hover:underline"
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
