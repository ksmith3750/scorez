import { createClient } from '@/lib/supabase/server'
import { getPlayerByUserId } from '@/lib/db/players'
import { redirect } from 'next/navigation'
import { updateDisplayName } from '@/app/actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const player = await getPlayerByUserId(user.id)

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Login</p>
          <p className="text-sm text-slate-700">{user.email}</p>
        </div>

        <form action={updateDisplayName} className="space-y-4">
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
              defaultValue={player?.name ?? user.email ?? ''}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Your name"
            />
          </div>
          <button
            type="submit"
            className="bg-green-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  )
}
