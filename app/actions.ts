'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addCourse } from '@/lib/db/courses'
import { createRound } from '@/lib/db/rounds'
import { addPlayer as addPlayerDb, updatePlayerName } from '@/lib/db/players'
import { Course, Profile } from '@/lib/types'

export async function submitRound(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courseId = formData.get('course_id') as string
  const date = formData.get('date') as string
  const holes = parseInt(formData.get('holes') as string)
  const par = parseInt(formData.get('par') as string)

  if (!courseId || !date) throw new Error('Course and date are required')
  if (holes !== 9 && holes !== 18) throw new Error('Holes must be 9 or 18')
  if (isNaN(par) || par < 1) throw new Error('Invalid par value')

  const scores: { playerId: string; score: number }[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('score_') && (value as string).trim() !== '') {
      const playerId = key.slice('score_'.length)
      const score = parseInt(value as string)
      if (!isNaN(score)) {
        scores.push({ playerId, score })
      }
    }
  }

  const roundId = await createRound(courseId, date, holes as 9 | 18, par, user.id, scores)
  revalidatePath('/')
  revalidatePath('/rounds')
  redirect(`/rounds/${roundId}`)
}

export async function createCourse(
  name: string,
  par9: number | null,
  par18: number | null
): Promise<Course> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!name.trim()) throw new Error('Course name is required')

  let course
  try {
    course = await addCourse(name.trim(), par9, par18, user.id)
  } catch {
    throw new Error('Failed to create course. Please try again.')
  }
  return course
}

export async function addPlayer(name: string): Promise<Profile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!name.trim()) throw new Error('Player name is required')

  let player
  try {
    player = await addPlayerDb(name.trim(), user.id)
  } catch {
    throw new Error('Failed to add player. Please try again.')
  }
  return player
}

export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) throw new Error('Display name is required')

  await updatePlayerName(user.id, name)
  revalidatePath('/settings')
}
