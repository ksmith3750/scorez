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

export async function getPlayerByUserId(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .select('id, name')
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}

export async function updatePlayerName(userId: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .update({ name: name.trim() })
    .eq('user_id', userId)
    .select('id')
  if (error) throw new Error(`updatePlayerName: ${error.message}`)
  if (!data || data.length === 0) {
    throw new Error('Could not update — no player record linked to your account')
  }
}

export async function updatePlayerNameById(playerId: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('players')
    .update({ name: name.trim() })
    .eq('id', playerId)
  if (error) throw new Error(`updatePlayerNameById: ${error.message}`)
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
