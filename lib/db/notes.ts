import { createClient } from '@/lib/supabase/server'
import { RoundNote } from '@/lib/types'

export async function getRoundNotes(roundId: string): Promise<RoundNote[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('round_notes')
    .select(`
      id, round_id, content, created_by, created_at,
      author:players!round_notes_created_by_fkey(id, name)
    `)
    .eq('round_id', roundId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`getRoundNotes: ${error.message}`)
  return (data ?? []) as unknown as RoundNote[]
}

export async function addRoundNote(
  roundId: string,
  content: string,
  createdBy: string
): Promise<RoundNote> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('round_notes')
    .insert({ round_id: roundId, content: content.trim(), created_by: createdBy })
    .select(`
      id, round_id, content, created_by, created_at,
      author:players!round_notes_created_by_fkey(id, name)
    `)
    .single()
  if (error) throw new Error(`addRoundNote: ${error.message}`)
  return data as unknown as RoundNote
}
