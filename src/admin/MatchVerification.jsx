import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

function MatchVerification() {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [filter, setFilter] = useState('pending') // 'pending' | 'all'

  const fetchMatches = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const response = await reportApi.getMatches()
      setMatches(response.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load match verification queue.'))
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchMatches(true)
  }, [fetchMatches])

  // Auto-refresh every 15 seconds so newly detected matches appear automatically
  useEffect(() => {
    const interval = setInterval(() => fetchMatches(false), 15000)
    return () => clearInterval(interval)
  }, [fetchMatches])

  const updateStatus = async (id, verified) => {
    setUpdatingId(id)
    setError('')
    try {
      await reportApi.verifyMatch(id, verified)
      setMatches((prev) =>
        prev.map((match) =>
          match.id === id ? { ...match, status: verified ? 'Approved' : 'Rejected' } : match,
        ),
      )
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Unable to update match status.'))
    } finally {
      setUpdatingId('')
    }
  }

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this match record? This cannot be undone.')) return
    setDeletingId(id)
    setError('')
    try {
      await reportApi.deleteMatch(id)
      setMatches((prev) => prev.filter((match) => match.id !== id))
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete match record.'))
    } finally {
      setDeletingId('')
    }
  }

  const displayed = filter === 'pending'
    ? matches.filter((m) => m.status === 'Pending')
    : matches

  const pendingCount = matches.filter((m) => m.status === 'Pending').length

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">Match Verification</h1>
          <p className="text-sm text-steel-600">Review AI comparisons and verify possible matches.</p>
        </div>
        <button
          onClick={() => fetchMatches(true)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-steel-300 bg-white px-4 py-2 text-sm font-medium text-steel-700 hover:bg-steel-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${filter === 'pending' ? 'bg-navy-900 text-white' : 'bg-steel-100 text-steel-700 hover:bg-steel-200'}`}
        >
          Pending {pendingCount > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-navy-900 text-white' : 'bg-steel-100 text-steel-700 hover:bg-steel-200'}`}
        >
          All ({matches.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading match queue...
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : displayed.length === 0 ? (
        <p className="rounded-xl bg-steel-100 p-4 text-sm text-steel-700">
          {filter === 'pending' ? 'No pending matches. New matches will appear here automatically.' : 'No match records found.'}
        </p>
      ) : (
        <div className="space-y-4">
          {displayed.map((match) => {
            const isPending = match.status === 'Pending'
            const isUpdating = updatingId === match.id
            const isDeleting = deletingId === match.id

            return (
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
                    <p className="mb-2 text-sm font-semibold text-steel-600">Sighting / CCTV Frame</p>
                    {match.cctvPhoto ? (
                      <img src={match.cctvPhoto} alt={`${match.personName} sighting`} className="h-56 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-56 items-center justify-center rounded-xl bg-steel-100 text-sm text-steel-500">Frame unavailable</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 rounded-xl bg-steel-50 p-3 text-sm text-steel-700 sm:grid-cols-3">
                  <p><span className="font-medium">Person:</span> {match.personName}</p>
                  <p><span className="font-medium">Confidence:</span> {match.confidence}%</p>
                  <p><span className="font-medium">Location:</span> {match.location}</p>
                  <p><span className="font-medium">Time:</span> {match.time}</p>
                  <p className="sm:col-span-2">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`font-semibold ${match.status === 'Approved' ? 'text-emerald-600' : match.status === 'Rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                      {match.status}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {isPending && (
                    <>
                      <button
                        onClick={() => updateStatus(match.id, true)}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
                        Approve Match
                      </button>
                      <button
                        onClick={() => updateStatus(match.id, false)}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
                        Disapprove
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteRecord(match.id)}
                    disabled={isDeleting}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-60"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete Record
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default MatchVerification
