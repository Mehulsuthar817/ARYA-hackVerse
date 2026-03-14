import { Camera, ShieldAlert, UserRoundSearch, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AlertPanel from '../components/AlertPanel'
import StatsCard from '../components/StatsCard'
import { getErrorMessage, reportApi } from '../services/api'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardResponse, matchesResponse] = await Promise.all([
          reportApi.getDashboard(),
          reportApi.getMatches(),
        ])

        setStats(dashboardResponse.data)
        setAlerts(
          matchesResponse.data.slice(0, 4).map((match) => ({
            id: match.id,
            message: `${match.personName} flagged at ${match.location}`,
            time: match.time,
            severity: match.status === 'Pending' ? 'high' : 'normal',
          })),
        )
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load dashboard metrics.'))
      }
    }

    fetchDashboard()
  }, [])

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy-900">Police Control Dashboard</h1>
        <p className="text-sm text-steel-600">Monitor camera alerts and AI verification queue.</p>
      </header>

      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Missing Persons" value={stats?.totalMissing ?? '--'} icon={<Users size={18} />} />
        <StatsCard title="AI Matches Detected" value={stats?.totalMatches ?? '--'} icon={<UserRoundSearch size={18} />} tone="accent" />
        <StatsCard title="Active CCTV Cameras" value={stats ? 1 : '--'} icon={<Camera size={18} />} />
        <StatsCard title="Pending Verifications" value={stats?.pendingVerification ?? '--'} icon={<ShieldAlert size={18} />} tone="warning" />
      </div>

      <AlertPanel alerts={alerts} />
    </section>
  )
}

export default AdminDashboard
