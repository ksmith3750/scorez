'use client'

import { useActionState } from 'react'
import { updateDisplayName } from '@/app/actions'

interface Props {
  currentName: string
}

export function SettingsForm({ currentName }: Props) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) => {
      try {
        await updateDisplayName(formData)
        return { success: true as const }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to save' }
      }
    },
    { error: undefined, success: undefined } as { error?: string; success?: boolean }
  )

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Display Name
        </label>
        <p className="text-xs text-slate-400 mb-2">
          This name appears on scorecards and the handicap leaderboard.
        </p>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="Your name"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-700">Display name saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-green-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
