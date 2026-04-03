'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login') return null

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const linkClass = (path: string) =>
    pathname === path
      ? 'text-green-700 font-semibold'
      : 'text-slate-600 hover:text-slate-900'

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-green-700 text-lg">
          ⛳ GolfScores
        </Link>
        <div className="ml-auto flex items-center gap-6 text-sm">
          <Link href="/" className={linkClass('/')}>Dashboard</Link>
          <Link href="/rounds/new" className={linkClass('/rounds/new')}>New Round</Link>
          <Link href="/rounds" className={linkClass('/rounds')}>History</Link>
          <button
            onClick={signOut}
            className="text-slate-400 hover:text-slate-700 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
