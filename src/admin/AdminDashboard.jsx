import { Camera, ShieldAlert, UserRoundSearch, Users } from 'lucide-react'
import AlertPanel from '../components/AlertPanel'
import StatsCard from '../components/StatsCard'

const alerts = [
  { id: 'AL-1', message: 'Possible match detected at Central Plaza Camera 1', time: '2 min ago', severity: 'high' },
  { id: 'AL-2', message: 'Verification team approved one candidate match', time: '8 min ago', severity: 'normal' },
]

function AdminDashboard() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy-900">Police Control Dashboard</h1>
        <p className="text-sm text-steel-600">Monitor camera alerts and AI verification queue.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Missing Persons" value="124" icon={<Users size={18} />} />
        <StatsCard title="AI Matches Detected" value="32" icon={<UserRoundSearch size={18} />} tone="accent" />
        <StatsCard title="Active CCTV Cameras" value="06" icon={<Camera size={18} />} />
        <StatsCard title="Pending Verifications" value="09" icon={<ShieldAlert size={18} />} tone="warning" />
      </div>

      <AlertPanel alerts={alerts} />
    </section>
  )
}

export default AdminDashboard
