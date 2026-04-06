import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/types'

export async function getPlayers(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .select('id, name')
    .order('name')
  if (error) throw new Error(`getPlayers: ${error.message}`)
  return data ?? []
}

export async function addPlayer(name: string, createdBy: string): Promise<Profile> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ name: name.trim(), created_by: createdBy })
    .select('id, name')
    .single()
  if (error) throw new Error(`addPlayer: ${error.message}`)
  return data
}
