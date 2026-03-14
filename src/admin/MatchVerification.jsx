import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

function MatchVerification() {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await reportApi.getMatches()
        setMatches(response.data)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load match verification queue.'))
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const updateStatus = async (id, verified) => {
    setUpdatingId(id)
    setError('')

    try {
      await reportApi.verifyMatch(id, verified)
      setMatches((prev) =>
        prev.map((match) => (match.id === id ? { ...match, status: verified ? 'Approved' : 'Rejected' } : match)),
      )
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Unable to update match status.'))
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy-900">Match Verification</h1>
        <p className="text-sm text-steel-600">Review AI comparison and verify possible matches.</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading match queue...
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : matches.length === 0 ? (
        <p className="rounded-xl bg-steel-100 p-4 text-sm text-steel-700">No pending matches found.</p>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <article key={match.id} className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-steel-600">Missing Person Photo</p>
                  {match.missingPhoto ? (
                    <img src={match.missingPhoto} alt={match.personName} className="h-56 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-xl bg-steel-100 text-sm text-steel-500">Photo unavailable</div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-steel-600">CCTV Frame</p>
                  {match.cctvPhoto ? (
                    <img src={match.cctvPhoto} alt={`${match.personName} CCTV frame`} className="h-56 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-xl bg-steel-100 text-sm text-steel-500">Frame unavailable</div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl bg-steel-50 p-3 text-sm text-steel-700 sm:grid-cols-3">
                <p>Confidence Score: {match.confidence}%</p>
                <p>Location: {match.location}</p>
                <p>Time: {match.time}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => updateStatus(match.id, true)}
                  disabled={updatingId === match.id}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Approve Match
                </button>
                <button
                  onClick={() => updateStatus(match.id, false)}
                  disabled={updatingId === match.id}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Reject Match
                </button>
                <p className="text-sm font-medium text-steel-700">Current Status: {match.status}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default MatchVerification
