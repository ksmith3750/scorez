import { createClient } from '@/lib/supabase/server'
import { Course } from '@/lib/types'

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('name')
  if (error) throw new Error(`getCourses: ${error.message}`)
  return data ?? []
}

export async function addCourse(
  name: string,
  par9: number | null,
  par18: number | null,
  createdBy: string
): Promise<Course> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .insert({ name, par_9: par9, par_18: par18, created_by: createdBy })
    .select()
    .single()
  if (error) throw new Error(`addCourse: ${error.message}`)
  return data!
}
