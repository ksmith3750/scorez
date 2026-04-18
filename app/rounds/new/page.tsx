import { getCourses } from '@/lib/db/courses'
import { getPlayers } from '@/lib/db/players'
import { NewRoundPageClient } from '@/components/new-round-page-client'

export default async function NewRoundPage() {
  const [courses, players] = await Promise.all([getCourses(), getPlayers()])
  const canUpload = !!process.env.ANTHROPIC_API_KEY

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Record New Round</h1>
      <NewRoundPageClient courses={courses} players={players} canUpload={canUpload} />
    </div>
  )
}
