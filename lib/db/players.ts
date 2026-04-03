import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/types'

export async function getPlayers(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .order('name')
  if (error) throw new Error(`getPlayers: ${error.message}`)
  return data
}
