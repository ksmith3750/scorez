'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addCourse } from '@/lib/db/courses'
import { createRound } from '@/lib/db/rounds'
import { Course } from '@/lib/types'

export async function submitRound(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courseId = formData.get('course_id') as string
  const date = formData.get('date') as string
  const holes = parseInt(formData.get('holes') as string) as 9 | 18
  const par = parseInt(formData.get('par') as string)

  const scores: { playerId: string; score: number }[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('score_') && (value as string).trim() !== '') {
      const playerId = key.replace('score_', '')
      const score = parseInt(value as string)
      if (!isNaN(score)) {
        scores.push({ playerId, score })
      }
    }
  }

  const roundId = await createRound(courseId, date, holes, par, user.id, scores)
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

  const course = await addCourse(name, par9, par18, user.id)
  revalidatePath('/rounds/new')
  return course
}
