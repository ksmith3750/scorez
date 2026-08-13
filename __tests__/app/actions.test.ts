// Must mock before importing the module under test — Jest hoists jest.mock() calls
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db/rounds', () => ({
  ...jest.requireActual('@/lib/db/rounds'),
  updateRoundScore: jest.fn(),
}))
jest.mock('@/lib/db/notes', () => ({
  ...jest.requireActual('@/lib/db/notes'),
  deleteRoundNote: jest.fn(),
}))
jest.mock('@/lib/db/players', () => ({
  ...jest.requireActual('@/lib/db/players'),
  getPlayerByUserId: jest.fn(),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { updateScore, deleteNote } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { updateRoundScore } from '@/lib/db/rounds'
import { deleteRoundNote } from '@/lib/db/notes'
import { getPlayerByUserId } from '@/lib/db/players'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUpdateRoundScore = updateRoundScore as jest.MockedFunction<typeof updateRoundScore>
const mockDeleteRoundNote = deleteRoundNote as jest.MockedFunction<typeof deleteRoundNote>
const mockGetPlayerByUserId = getPlayerByUserId as jest.MockedFunction<typeof getPlayerByUserId>

function makeSupabase(user: object | null) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  } as unknown as Awaited<ReturnType<typeof createClient>>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('updateScore', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const result = await updateScore('score-1', 85)
    expect(result).toEqual({ error: 'Not logged in' })
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('returns error when score is below 1', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    const result = await updateScore('score-1', 0)
    expect(result.error).toBeDefined()
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('returns error when score is above 200', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    const result = await updateScore('score-1', 201)
    expect(result.error).toBeDefined()
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('returns error when score is not an integer', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    const result = await updateScore('score-1', 85.5)
    expect(result.error).toBeDefined()
    expect(mockUpdateRoundScore).not.toHaveBeenCalled()
  })

  it('calls updateRoundScore and returns {} on valid input', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockUpdateRoundScore.mockResolvedValue(undefined)
    const result = await updateScore('score-1', 85)
    expect(mockUpdateRoundScore).toHaveBeenCalledWith('score-1', 85)
    expect(result).toEqual({})
  })

  it('returns error when updateRoundScore throws', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockUpdateRoundScore.mockRejectedValue(new Error('DB error'))
    const result = await updateScore('score-1', 85)
    expect(result.error).toBeDefined()
  })
})

describe('deleteNote', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const result = await deleteNote('note-1', 'round-1')
    expect(result).toEqual({ error: 'Not logged in' })
    expect(mockDeleteRoundNote).not.toHaveBeenCalled()
  })

  it('returns error when no player record found', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockGetPlayerByUserId.mockResolvedValue(null)
    const result = await deleteNote('note-1', 'round-1')
    expect(result).toEqual({ error: 'No player record found for your account' })
    expect(mockDeleteRoundNote).not.toHaveBeenCalled()
  })

  it('calls deleteRoundNote with noteId and playerId and returns {}', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockGetPlayerByUserId.mockResolvedValue({ id: 'player-1', name: 'Kirk' })
    mockDeleteRoundNote.mockResolvedValue(undefined)
    const result = await deleteNote('note-1', 'round-1')
    expect(mockDeleteRoundNote).toHaveBeenCalledWith('note-1', 'player-1')
    expect(result).toEqual({})
  })

  it('returns error when deleteRoundNote throws', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: 'user-1' }))
    mockGetPlayerByUserId.mockResolvedValue({ id: 'player-1', name: 'Kirk' })
    mockDeleteRoundNote.mockRejectedValue(new Error('note not found or not owned'))
    const result = await deleteNote('note-1', 'round-1')
    expect(result.error).toBeDefined()
    expect(mockDeleteRoundNote).toHaveBeenCalledWith('note-1', 'player-1')
  })
})
