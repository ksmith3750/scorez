import { createClient } from '@/lib/supabase/server'
import { getPlayerByUserId } from '@/lib/db/players'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings-form'

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

        <SettingsForm currentName={player?.name ?? user.email ?? ''} />
      </div>
    </div>
  )
}
