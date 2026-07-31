// Must mock before importing the module under test — Jest hoists jest.mock() calls
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/db/rounds', () => ({
  ...jest.requireActual('@/lib/db/rounds'),
  updateRoundScore: jest.fn(),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { updateScore } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { updateRoundScore } from '@/lib/db/rounds'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUpdateRoundScore = updateRoundScore as jest.MockedFunction<typeof updateRoundScore>

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
