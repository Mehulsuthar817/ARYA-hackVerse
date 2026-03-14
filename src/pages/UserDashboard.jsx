import { SearchCheck, UserSearch, UsersRound } from 'lucide-react'
import StatsCard from '../components/StatsCard'

function UserDashboard() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-steel-50">Citizen Dashboard</h1>
        <p className="text-sm text-steel-300">Track reports, sightings, and AI match activity.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Reports Submitted"
          value="12"
          icon={<UsersRound size={18} />}
          tone="default"
        />
        <StatsCard
          title="Sightings Uploaded"
          value="07"
          icon={<UserSearch size={18} />}
          tone="accent"
        />
        <StatsCard
          title="Matches Found"
          value="03"
          icon={<SearchCheck size={18} />}
          tone="warning"
        />
      </div>

      <article className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-5 shadow-card">
        <h2 className="font-display text-xl font-semibold text-steel-50">Quick Actions</h2>
        <p className="mt-1 text-sm text-steel-300">
          Use the menu above to report missing persons, upload sightings, and monitor status updates.
        </p>
      </article>
    </section>
  )
}

export default UserDashboard
