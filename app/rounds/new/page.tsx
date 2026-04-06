import { getCourses } from '@/lib/db/courses'
import { getPlayers } from '@/lib/db/players'
import { NewRoundForm } from '@/components/new-round-form'

export default async function NewRoundPage() {
  const [courses, players] = await Promise.all([getCourses(), getPlayers()])

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Record New Round</h1>
      <NewRoundForm courses={courses} players={players} />
    </div>
  )
}
