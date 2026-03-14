import { Camera, RefreshCw, ShieldAlert, UserRoundSearch, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AlertPanel from '../components/AlertPanel'
import StatsCard from '../components/StatsCard'
import { getErrorMessage, reportApi } from '../services/api'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')
  const [reencodeStatus, setReencodeStatus] = useState('')
  const [reencoding, setReencoding] = useState(false)

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

  const handleReencode = async () => {
    setReencoding(true)
    setReencodeStatus('')
    try {
      const res = await reportApi.reencodePersons()
      setReencodeStatus(res.data.message)
    } catch (err) {
      setReencodeStatus(getErrorMessage(err, 'Re-encoding failed.'))
    } finally {
      setReencoding(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-steel-50">Police Control Dashboard</h1>
        <p className="text-sm text-steel-300">Monitor camera alerts and AI verification queue.</p>
      </header>

      {error ? <p className="rounded-xl bg-red-500/12 p-4 text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Missing Persons" value={stats?.totalMissing ?? '--'} icon={<Users size={18} />} />
        <StatsCard title="AI Matches Detected" value={stats?.totalMatches ?? '--'} icon={<UserRoundSearch size={18} />} tone="accent" />
        <StatsCard title="Active CCTV Cameras" value={stats ? 1 : '--'} icon={<Camera size={18} />} />
        <StatsCard title="Pending Verifications" value={stats?.pendingVerification ?? '--'} icon={<ShieldAlert size={18} />} tone="warning" />
      </div>

      <AlertPanel alerts={alerts} />

      <div className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-5 shadow-card">
        <h2 className="mb-1 font-display text-lg font-bold text-steel-50">Fix Missing Face Encodings</h2>
        <p className="mb-3 text-sm text-steel-300">
          Re-scan all missing person photos that have no AI encoding stored (e.g. uploaded before face-recognition was installed).
        </p>
        <button
          onClick={handleReencode}
          disabled={reencoding}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
        >
          <RefreshCw size={15} className={reencoding ? 'animate-spin' : ''} />
          {reencoding ? 'Re-encoding...' : 'Re-encode Missing Persons'}
        </button>
        {reencodeStatus ? (
          <p className="mt-2 text-sm text-steel-200">{reencodeStatus}</p>
        ) : null}
      </div>
    </section>
  )
}

export default AdminDashboard
